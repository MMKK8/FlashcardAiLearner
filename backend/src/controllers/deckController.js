const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Create a new deck
async function createDeck(req, res) {
    try {
        const { name } = req.body;
        const userId = req.user.userId;

        if (!name) {
            return res.status(400).json({ error: 'Deck name is required' });
        }

        const result = await pool.query(
            'INSERT INTO decks (user_id, name) VALUES ($1, $2) RETURNING *',
            [userId, name]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create deck error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Get all decks for the user
async function getDecks(req, res) {
    try {
        const userId = req.user.userId;
        const result = await pool.query('SELECT * FROM decks WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Get decks error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Get a specific deck
async function getDeck(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const result = await pool.query('SELECT * FROM decks WHERE id = $1 AND user_id = $2', [id, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Deck not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get deck error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Delete a deck
async function deleteDeck(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const result = await pool.query('DELETE FROM decks WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Deck not found or unauthorized' });
        }

        res.json({ message: 'Deck deleted successfully' });
    } catch (error) {
        console.error('Delete deck error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Export a deck
async function exportDeck(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Fetch deck details
        const deckResult = await pool.query('SELECT * FROM decks WHERE id = $1 AND user_id = $2', [id, userId]);

        if (deckResult.rows.length === 0) {
            return res.status(404).json({ error: 'Deck not found' });
        }

        const deck = deckResult.rows[0];

        // Fetch cards
        const cardsResult = await pool.query('SELECT * FROM cards WHERE deck_id = $1', [id]);
        const cards = cardsResult.rows;

        const exportData = {
            deck: {
                name: deck.name,
                created_at: deck.created_at
            },
            cards: cards.map(c => ({
                front: c.word_en,
                back: c.word_es,
                phonetic: c.phonetic,
                examples: c.examples
            }))
        };

        res.json(exportData);
    } catch (error) {
        console.error('Export deck error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { createDeck, getDecks, getDeck, deleteDeck, exportDeck };
