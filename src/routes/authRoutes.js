const router = require('express').Router();
const { login, refresh } = require('../controllers/authController');

router.post('/login', login);
router.post('/refresh', refresh);

module.exports = router;
