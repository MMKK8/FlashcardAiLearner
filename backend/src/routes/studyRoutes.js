const express = require('express');
const router = express.Router();
const studyController = require('../controllers/studyController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/due', studyController.getDueCards);
router.post('/grade', studyController.gradeCard);

module.exports = router;
