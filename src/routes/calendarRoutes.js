const router = require('express').Router();
const { auth } = require('../middlewares/authMiddleware');
const controller = require('../controllers/calendarController');

router.get('/', auth, controller.getCalendarData);
router.get('/export', auth, controller.exportCalendar);

module.exports = router;
