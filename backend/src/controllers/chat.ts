import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// Create a new chat between two users
export const createChat = async (req: any, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      participantId: z.string().min(1),
    });

    const { participantId } = schema.parse(req.body);
    const currentUserId = req.user.userId;

    if (participantId === currentUserId) {
      throw new AppError('Cannot chat with yourself', 400);
    }

    // Check if chat already exists between these two users
    const existingChat = await prisma.chat.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: currentUserId } } },
          { participants: { some: { userId: participantId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
    });

    if (existingChat) {
      return res.json(successResponse(existingChat, 'Chat already exists'));
    }

    // Create new chat with both participants
    const chat = await prisma.chat.create({
      data: {
        participants: {
          create: [
            { userId: currentUserId },
            { userId: participantId },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
    });

    res.status(201).json(successResponse(chat, 'Chat created'));
  } catch (error) {
    next(error);
  }
};

// Get all chats for current user
export const getMyChats = async (req: any, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user.userId;

    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: { userId: currentUserId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(successResponse(chats));
  } catch (error) {
    next(error);
  }
};

// Get messages for a specific chat
export const getMessages = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { chatId } = req.params;
    const currentUserId = req.user.userId;

    // Verify user is a participant in this chat
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: { chatId, userId: currentUserId },
      },
    });

    if (!participant) {
      throw new AppError('You do not have access to this chat', 403);
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        chatId,
        senderId: { not: currentUserId },
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json(successResponse(messages));
  } catch (error) {
    next(error);
  }
};

// Send a message
export const sendMessage = async (req: any, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      chatId: z.string().min(1),
      content: z.string().min(1).max(2000),
    });

    const { chatId, content } = schema.parse(req.body);
    const currentUserId = req.user.userId;

    // Verify user is a participant
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: { chatId, userId: currentUserId },
      },
    });

    if (!participant) {
      throw new AppError('You do not have access to this chat', 403);
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: currentUserId,
        content,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    // Update chat updatedAt
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    res.status(201).json(successResponse(message, 'Message sent'));
  } catch (error) {
    next(error);
  }
};

// Delete a chat
export const deleteChat = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { chatId } = req.params;
    const currentUserId = req.user.userId;

    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: { chatId, userId: currentUserId },
      },
    });

    if (!participant) {
      throw new AppError('You do not have access to this chat', 403);
    }

    await prisma.chat.delete({
      where: { id: chatId },
    });

    res.json(successResponse(null, 'Chat deleted'));
  } catch (error) {
    next(error);
  }
};
