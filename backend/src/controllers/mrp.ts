import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// Runs a Material Requirements Planning pass for the company:
// for every stock item, compares current on-hand quantity + incoming supply
// (open purchase order quantities) against reorder level and open demand
// (confirmed sales order quantities not yet delivered). Anything short of
// the reorder threshold generates a shortage exception and a planned
// purchase order suggestion.
export const runMRP = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const planningHorizonDays = Number(req.body?.planningHorizonDays) || 30;

    const mrpRun = await prisma.mRPRun.create({
      data: { companyId, runById: req.user.userId, planningHorizonDays, status: 'RUNNING' },
    });

    try {
      const items = await prisma.item.findMany({
        where: { companyId, isStockItem: true, status: 'ACTIVE' },
      });

      const exceptions: any[] = [];
      const plannedOrders: any[] = [];

      for (const item of items) {
        // Current stock on hand across all warehouses (most recent ledger balance per item)
        const stockLedgers = await prisma.stockLedger.findMany({
          where: { itemId: item.id },
          orderBy: { createdAt: 'desc' },
          take: 1,
        });
        const onHand = stockLedgers.length > 0 ? Number(stockLedgers[0].balanceQty) : 0;

        // Incoming supply: quantity on open (non-cancelled, non-fully-received) purchase orders
        const openPOItems = await prisma.orderItem.findMany({
          where: {
            itemId: item.id,
            purchaseOrder: { companyId, status: { in: ['DRAFT', 'CONFIRMED'] } },
          },
        });
        const incomingSupply = openPOItems.reduce(
          (sum, oi) => sum + (Number(oi.quantity) - Number(oi.receivedQty)),
          0,
        );

        // Open demand: quantity on confirmed sales orders
        const openSOItems = await prisma.orderItem.findMany({
          where: {
            itemId: item.id,
            salesOrder: { companyId, status: { in: ['DRAFT', 'CONFIRMED'] } },
          },
        });
        const openDemand = openSOItems.reduce((sum, oi) => sum + Number(oi.quantity), 0);

        const projectedAvailable = onHand + incomingSupply - openDemand;
        const reorderLevel = Number(item.reorderLevel);

        if (projectedAvailable < reorderLevel) {
          const shortageQty = Math.max(reorderLevel - projectedAvailable, Number(item.reorderQuantity) || reorderLevel);

          exceptions.push({
            mrpRunId: mrpRun.id,
            itemId: item.id,
            type: 'SHORTAGE',
            message: `${item.name}: projected available (${projectedAvailable}) is below reorder level (${reorderLevel})`,
            quantity: shortageQty,
          });

          plannedOrders.push({
            mrpRunId: mrpRun.id,
            companyId,
            itemId: item.id,
            orderType: 'PURCHASE',
            quantity: shortageQty,
            suggestedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // suggest ordering in 3 days
            status: 'PLANNED',
          });
        }
      }

      if (exceptions.length > 0) {
        await prisma.mRPException.createMany({ data: exceptions });
      }
      if (plannedOrders.length > 0) {
        await prisma.plannedOrder.createMany({ data: plannedOrders });
      }

      const completedRun = await prisma.mRPRun.update({
        where: { id: mrpRun.id },
        data: { status: 'COMPLETED' },
        include: { exceptions: { include: { item: true } }, plannedOrders: { include: { item: true } } },
      });

      res.status(201).json(successResponse(completedRun, 'MRP run completed'));
    } catch (innerError) {
      await prisma.mRPRun.update({ where: { id: mrpRun.id }, data: { status: 'FAILED' } });
      throw innerError;
    }
  } catch (error) {
    next(error);
  }
};

export const getMRPRuns = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const runs = await prisma.mRPRun.findMany({
      where: { companyId },
      orderBy: { runDate: 'desc' },
      take: 20,
    });
    res.json(successResponse(runs));
  } catch (error) {
    next(error);
  }
};

export const getMRPRun = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const run = await prisma.mRPRun.findFirst({
      where: { id, companyId },
      include: { exceptions: { include: { item: true } }, plannedOrders: { include: { item: true } } },
    });
    if (!run) throw new AppError('MRP run not found', 404);
    res.json(successResponse(run));
  } catch (error) {
    next(error);
  }
};

export const convertPlannedOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const { supplierId } = req.body;

    const plannedOrder = await prisma.plannedOrder.findFirst({ where: { id, companyId }, include: { item: true } });
    if (!plannedOrder) throw new AppError('Planned order not found', 404);
    if (plannedOrder.status !== 'PLANNED') throw new AppError('Planned order already processed', 400);
    if (!supplierId) throw new AppError('supplierId is required to convert to a purchase order', 400);

    const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, companyId } });
    if (!supplier) throw new AppError('Supplier not found', 404);

    const count = await prisma.purchaseOrder.count({ where: { companyId } });
    const orderNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    const unitPrice = Number(plannedOrder.item.standardCost) || 0;
    const totalAmount = unitPrice * Number(plannedOrder.quantity);

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        orderDate: new Date(),
        supplierId,
        subtotal: totalAmount,
        totalAmount,
        status: 'DRAFT',
        companyId,
        createdById: req.user.userId,
        items: {
          create: [{
            itemId: plannedOrder.itemId,
            quantity: plannedOrder.quantity,
            unitPrice,
            totalAmount,
          }],
        },
      },
      include: { items: true },
    });

    await prisma.plannedOrder.update({ where: { id }, data: { status: 'CONVERTED' } });

    res.status(201).json(successResponse(purchaseOrder, 'Planned order converted to purchase order'));
  } catch (error) {
    next(error);
  }
};
