const express = require('express');
const router = express.Router();
const deckController = require('../controllers/deckController');
const { authenticateToken } = require('../middleware/auth');

// All routes are protected
router.use(authenticateToken);

router.post('/', deckController.createDeck);
router.get('/', deckController.getDecks);
router.get('/:id', deckController.getDeck);
router.delete('/:id', deckController.deleteDeck);
router.get('/:id/export', deckController.exportDeck);


module.exports = router;
