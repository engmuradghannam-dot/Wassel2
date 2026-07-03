import { Router } from 'express';
import { createAsset, getAssets, depreciateAsset, disposeAsset, getAssetCategories } from '../controllers/asset';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/', createAsset);
router.get('/', getAssets);
router.get('/categories', getAssetCategories);
router.post('/:id/depreciate', depreciateAsset);
router.post('/:id/dispose', disposeAsset);

export default router;
