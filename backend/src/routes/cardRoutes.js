const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const { authenticateToken } = require('../middleware/auth');

router.post('/generate', authenticateToken, cardController.generateCard);
router.post('/', authenticateToken, cardController.createCard);
router.get('/:deck_id', authenticateToken, cardController.getCards);

module.exports = router;
