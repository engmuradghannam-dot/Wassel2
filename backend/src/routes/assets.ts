import { Router } from 'express';
import { createAsset, getAssets, depreciateAsset, disposeAsset, getAssetCategories } from '../controllers/asset';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createAsset);
router.get('/', getAssets);
router.get('/categories', getAssetCategories);
router.post('/:id/depreciate', depreciateAsset);
router.post('/:id/dispose', disposeAsset);

export default router;
