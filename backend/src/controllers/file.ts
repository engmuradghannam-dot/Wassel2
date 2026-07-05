import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import fs from 'fs';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

export const uploadFile = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);
    const { entityType, entityId } = req.body;
    const file = req.file;

    const fileRecord = await prisma.fileAttachment.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        url: `/uploads/${file.filename}`,
        entityType: entityType || 'GENERAL',
        entityId: entityId || null,
        uploadedBy: req.user.userId,
      },
    });

    res.status(201).json(successResponse(fileRecord, 'File uploaded successfully'));
  } catch (error) {
    next(error);
  }
};

export const getFiles = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { entityType, entityId } = req.query;
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const files = await prisma.fileAttachment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { uploader: { select: { firstName: true, lastName: true } } },
    });
    res.json(successResponse(files));
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const file = await prisma.fileAttachment.findUnique({ where: { id } });
    if (!file) throw new AppError('File not found', 404);
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    await prisma.fileAttachment.delete({ where: { id } });
    res.json(successResponse(null, 'File deleted'));
  } catch (error) {
    next(error);
  }
};

export const downloadFile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const file = await prisma.fileAttachment.findUnique({ where: { id } });
    if (!file) throw new AppError('File not found', 404);
    res.download(file.path, file.originalName);
  } catch (error) {
    next(error);
  }
};
