const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');

// Configure Multer for memory storage (files are processed in memory)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
});

router.post('/ocr', authenticateToken, upload.single('image'), cardController.extractWordFromImage);
router.post('/generate', authenticateToken, cardController.generateCard);
router.post('/', authenticateToken, cardController.createCard);
router.get('/:deck_id', authenticateToken, cardController.getCards);

module.exports = router;
