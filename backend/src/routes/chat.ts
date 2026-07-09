import { Router } from 'express';
import { createChat, getMyChats, getMessages, sendMessage, deleteChat } from '../controllers/chat';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createChat);
router.get('/', authenticate, getMyChats);
router.get('/:chatId/messages', authenticate, getMessages);
router.post('/messages', authenticate, sendMessage);
router.delete('/:chatId', authenticate, deleteChat);

export default router;
