import { Router } from 'express';
import {
  createProductionPlan, getProductionPlans, getProductionPlan, updateProductionPlanStatus,
  createSubcontractingOrder, getSubcontractingOrders, getSubcontractingOrder, updateSubcontractingOrderStatus,
  createQualityInspection, getQualityInspections, updateQualityInspectionStatus,
  createQualityGoal, getQualityGoals,
} from '../controllers/manufacturingExtra';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/production-plans', createProductionPlan);
router.get('/production-plans', getProductionPlans);
router.get('/production-plans/:id', getProductionPlan);
router.put('/production-plans/:id/status', updateProductionPlanStatus);

router.post('/subcontracting-orders', createSubcontractingOrder);
router.get('/subcontracting-orders', getSubcontractingOrders);
router.get('/subcontracting-orders/:id', getSubcontractingOrder);
router.put('/subcontracting-orders/:id/status', updateSubcontractingOrderStatus);

router.post('/quality-inspections', createQualityInspection);
router.get('/quality-inspections', getQualityInspections);
router.put('/quality-inspections/:id/status', updateQualityInspectionStatus);

router.post('/quality-goals', createQualityGoal);
router.get('/quality-goals', getQualityGoals);

export default router;
