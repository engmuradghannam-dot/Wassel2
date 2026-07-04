import { Router } from 'express';
import {
  getTrialBalance, getProfitAndLoss, getBalanceSheet,
  getStockReport, getSalesReport, getPayrollReport,
} from '../controllers/report';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/trial-balance', getTrialBalance);
router.get('/profit-and-loss', getProfitAndLoss);
router.get('/balance-sheet', getBalanceSheet);
router.get('/stock', getStockReport);
router.get('/sales', getSalesReport);
router.get('/payroll', getPayrollReport);

export default router;
