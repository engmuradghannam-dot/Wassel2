import { Router } from 'express';
import { createCostCenter, getCostCenters, getCostCenter, getCostCenterReport, updateCostCenter, deleteCostCenter } from '../controllers/costCenter';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createCostCenter);
router.get('/', getCostCenters);
router.get('/:id', getCostCenter);
router.get('/:id/report', getCostCenterReport);
router.put('/:id', updateCostCenter);
router.delete('/:id', deleteCostCenter);

export default router;
