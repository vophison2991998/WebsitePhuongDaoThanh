import express from 'express';
import * as controller from '../../controllers/adminControllers/deliveryController.js';

const router = express.Router();


router.get('/', controller.getDeliveries);
router.post('/', controller.createDelivery);

router.put('/:id', controller.updateDelivery);

router.patch('/:id/status', controller.updateStatus);

router.delete('/:id', controller.deleteDelivery);


router.get('/trash/all', controller.getTrashDeliveries);

router.post('/trash/:id/restore', controller.restoreDelivery);

router.delete('/trash/:id/permanent', controller.permanentlyDeleteDelivery);

export default router;