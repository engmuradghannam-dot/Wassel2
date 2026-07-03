import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';

export const getDashboardStats = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.query.companyId || req.user?.companyId;

    if (!companyId) {
      return res.json(successResponse({
        message: 'Please select a company to view dashboard',
      }));
    }

    const [
      totalCustomers,
      totalSuppliers,
      totalItems,
      totalEmployees,
      totalInvoices,
      pendingInvoices,
      totalSales,
      totalPurchases,
      lowStockItems,
      recentInvoices,
      monthlySales,
    ] = await Promise.all([
      // Counts
      prisma.customer.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.supplier.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.item.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.invoice.count({ where: { companyId } }),
      prisma.invoice.count({ where: { companyId, status: 'SUBMITTED', paymentStatus: 'UNPAID' } }),

      // Totals
      prisma.invoice.aggregate({
        where: { companyId, invoiceType: 'SALES', status: 'SUBMITTED' },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { companyId, invoiceType: 'PURCHASE', status: 'SUBMITTED' },
        _sum: { totalAmount: true },
      }),

      // Low stock — availableQty (BinCard) vs reorderLevel (Item) live on different
      // models, so Prisma can't compare them via a field ref filter; fetch and
      // filter in application code instead.
      prisma.binCard.findMany({
        where: { warehouse: { companyId } },
        include: { item: { select: { name: true, code: true, reorderLevel: true } } },
      }).then(binCards =>
        binCards
          .filter(bc => bc.availableQty.lte(bc.item.reorderLevel))
          .slice(0, 10)
      ),

      // Recent invoices
      prisma.invoice.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          customer: { select: { name: true } },
          supplier: { select: { name: true } },
        },
      }),

      // Monthly sales (last 6 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "invoiceDate") as month,
          SUM("totalAmount") as total
        FROM invoices
        WHERE "companyId" = ${companyId}
          AND "invoiceType" = 'SALES'
          AND "status" = 'SUBMITTED'
          AND "invoiceDate" >= DATE_TRUNC('month', NOW()) - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "invoiceDate")
        ORDER BY month DESC
      `,
    ]);

    res.json(successResponse({
      counts: {
        customers: totalCustomers,
        suppliers: totalSuppliers,
        items: totalItems,
        employees: totalEmployees,
        invoices: totalInvoices,
        pendingInvoices,
      },
      financials: {
        totalSales: totalSales._sum.totalAmount || 0,
        totalPurchases: totalPurchases._sum.totalAmount || 0,
      },
      alerts: {
        lowStock: lowStockItems.length,
        lowStockItems,
      },
      recentActivity: {
        invoices: recentInvoices,
      },
      charts: {
        monthlySales,
      },
    }));
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req: any, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json(successResponse(notifications));
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.notification.update({
      where: { id, userId: req.user.userId },
      data: { isRead: true, readAt: new Date() },
    });

    res.json(successResponse(null, 'Notification marked as read'));
  } catch (error) {
    next(error);
  }
};
