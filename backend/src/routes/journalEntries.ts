import { Router } from 'express';
import { createJournalEntry, getJournalEntries, postJournalEntry, cancelJournalEntry } from '../controllers/accounting';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createJournalEntry);
router.get('/', getJournalEntries);
router.post('/:id/post', postJournalEntry);
router.post('/:id/cancel', cancelJournalEntry);

export default router;
