import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const deviceSchema = z.object({
  deviceCode: z.string().min(1),
  deviceType: z.string().min(1),
  warehouseId: z.string().optional(),
});

export const registerDevice = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = deviceSchema.parse(req.body);
    const companyId = req.companyId!;

    if (data.warehouseId) {
      const warehouse = await prisma.warehouse.findFirst({ where: { id: data.warehouseId, companyId } });
      if (!warehouse) throw new AppError('Warehouse not found', 404);
    }

    const device = await prisma.ioTDevice.create({ data: { ...data, companyId, status: 'OFFLINE' } });
    res.status(201).json(successResponse(device, 'Device registered'));
  } catch (error) {
    next(error);
  }
};

export const getDevices = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { warehouseId, status } = req.query;

    const where: any = { companyId };
    if (warehouseId) where.warehouseId = warehouseId as string;
    if (status) where.status = status as string;

    const devices = await prisma.ioTDevice.findMany({
      where,
      include: { warehouse: { select: { name: true } }, _count: { select: { readings: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(successResponse(devices));
  } catch (error) {
    next(error);
  }
};

// Ingestion endpoint: a device (or gateway) pushes a sensor reading and its
// heartbeat here. Marks the device online and records the reading.
export const ingestReading = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;

    const device = await prisma.ioTDevice.findFirst({ where: { id, companyId } });
    if (!device) throw new AppError('Device not found', 404);

    const readingSchema = z.object({
      metric: z.string().min(1),
      value: z.number(),
      unit: z.string().optional(),
    });
    const data = readingSchema.parse(req.body);

    const [reading] = await prisma.$transaction([
      prisma.ioTReading.create({ data: { ...data, deviceId: id } }),
      prisma.ioTDevice.update({ where: { id }, data: { status: 'ONLINE', lastSeenAt: new Date() } }),
    ]);

    res.status(201).json(successResponse(reading, 'Reading recorded'));
  } catch (error) {
    next(error);
  }
};

export const getDeviceReadings = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const device = await prisma.ioTDevice.findFirst({ where: { id, companyId } });
    if (!device) throw new AppError('Device not found', 404);

    const readings = await prisma.ioTReading.findMany({
      where: { deviceId: id },
      orderBy: { recordedAt: 'desc' },
      take: 200,
    });
    res.json(successResponse(readings));
  } catch (error) {
    next(error);
  }
};

export const deleteDevice = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const device = await prisma.ioTDevice.findFirst({ where: { id, companyId } });
    if (!device) throw new AppError('Device not found', 404);

    await prisma.ioTDevice.delete({ where: { id } });
    res.json(successResponse(null, 'Device deleted'));
  } catch (error) {
    next(error);
  }
};
