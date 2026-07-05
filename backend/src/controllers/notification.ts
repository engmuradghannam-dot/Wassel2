import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

export const getNotifications = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    const { unreadOnly } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') where.read = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    res.json(successResponse({ notifications, unreadCount }));
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const notification = await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true, readAt: new Date() },
    });

    if (notification.count === 0) throw new AppError('Notification not found', 404);
    res.json(successResponse(null, 'Notification marked as read'));
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
    res.json(successResponse(null, 'All notifications marked as read'));
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    await prisma.notification.deleteMany({ where: { id, userId } });
    res.json(successResponse(null, 'Notification deleted'));
  } catch (error) {
    next(error);
  }
};

export const createNotification = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { userId, title, message, type, link } = req.body;
    const notification = await prisma.notification.create({
      data: { userId, title, message, type, link, read: false },
    });
    res.status(201).json(successResponse(notification, 'Notification created'));
  } catch (error) {
    next(error);
  }
};
