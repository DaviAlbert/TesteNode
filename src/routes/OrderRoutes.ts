import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';

const router = Router();

router.post('/', OrderController.createOrder);
router.get('/', OrderController.getAllOrders);
router.get('/:id', OrderController.getOrderById);
router.put('/:id', OrderController.updateOrder);
router.delete('/:id', OrderController.deleteOrder);

export default router;