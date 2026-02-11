const router = require('express').Router();
const { auth } = require('../middlewares/authMiddleware');
const controller = require('../controllers/deliveryController');

router.get('/today/list', auth, controller.getTodayList);

router.get('/:deliveryId', auth, controller.getDeliveryDetail);

router.post('/', auth, controller.createDelivery);

router.patch('/:deliveryId', auth, controller.updateDelivery);

router.delete('/:deliveryId', auth, controller.deleteDelivery);

router.patch('/:deliveryId/collect', auth, controller.collectPayment);

router.patch('/:deliveryId/collect/cancel', auth, controller.cancelCollect);

router.patch('/:deliveryId/transport', auth, controller.completeTransport);

router.patch('/:deliveryId/transport/cancel', auth, controller.cancelTransport);

module.exports = router;
