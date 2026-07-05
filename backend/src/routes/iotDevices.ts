import { Router } from 'express';
import { registerDevice, getDevices, ingestReading, getDeviceReadings, deleteDevice } from '../controllers/iotDevice';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', registerDevice);
router.get('/', getDevices);
router.post('/:id/readings', ingestReading);
router.get('/:id/readings', getDeviceReadings);
router.delete('/:id', deleteDevice);

export default router;
