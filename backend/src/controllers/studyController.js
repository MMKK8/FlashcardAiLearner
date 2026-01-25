const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

/**
 * SuperMemo-2 Algorithm
 * @param {number} quality - 0-5 rating
 * @param {number} prevInterval - previous interval in days
 * @param {number} prevRepetition - previous repetition number
 * @param {number} prevEF - previous E-Factor
 * @returns {object} { interval, repetition, efactor }
 */
function calculateSM2(quality, prevInterval, prevRepetition, prevEF) {
    let interval, repetition, efactor;

    if (quality >= 3) {
        if (prevRepetition === 0) {
            interval = 1;
        } else if (prevRepetition === 1) {
            interval = 6;
        } else {
            interval = Math.round(prevInterval * prevEF);
        }
        repetition = prevRepetition + 1;
    } else {
        repetition = 0;
        interval = 1;
    }

    efactor = prevEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (efactor < 1.3) efactor = 1.3;

    return { interval, repetition, efactor };
}

async function getDueCards(req, res) {
    try {
        const userId = req.user.userId;
        const { deck_id } = req.query;
        console.log('getDueCards query:', req.query);
        const now = new Date().toISOString();

        let query = `
            SELECT c.*, p.interval, p.repetition, p.efactor, p.next_review
            FROM cards c
            JOIN decks d ON c.deck_id = d.id
            JOIN progress p ON c.id = p.card_id
            WHERE d.user_id = $1
            AND p.next_review <= $2
        `;

        const queryParams = [userId, now];

        if (deck_id) {
            query += ` AND c.deck_id = $3`;
            queryParams.push(deck_id);
        }

        query += ` ORDER BY p.next_review ASC`;

        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error('Get due cards error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function gradeCard(req, res) {
    try {
        const { card_id, quality } = req.body; // quality: 0-5
        const userId = req.user.userId;

        if (quality === undefined || quality < 0 || quality > 5) {
            return res.status(400).json({ error: 'Valid quality rating (0-5) is required' });
        }

        // Verify ownership via deck
        const checkQuery = `
            SELECT p.* 
            FROM progress p
            JOIN cards c ON p.card_id = c.id
            JOIN decks d ON c.deck_id = d.id
            WHERE p.card_id = $1 AND d.user_id = $2
        `;

        const currentProgressResult = await pool.query(checkQuery, [card_id, userId]);

        if (currentProgressResult.rows.length === 0) {
            return res.status(404).json({ error: 'Card not found or unauthorized' });
        }

        const current = currentProgressResult.rows[0];

        // Calculate new values
        let { interval, repetition, efactor } = calculateSM2(
            quality,
            current.interval,
            current.repetition,
            parseFloat(current.efactor)
        );

        // Calculate next review date based on UI buttons logic
        const nextReview = new Date();

        if (quality === 1) {
            // Again: 1 minute
            nextReview.setMinutes(nextReview.getMinutes() + 1);
            interval = 0; // 0 days
            repetition = 0; // Reset
        } else if (quality === 3) {
            // Hard: 10 minutes (Reverted as asked)
            nextReview.setMinutes(nextReview.getMinutes() + 10);
            interval = 0; // 0 days
            // Keep EF unchanged or standard SM-2 update? Standard update is fine.
        } else {
            // Good (4) & Easy (5): Standard SM-2 Days
            nextReview.setDate(nextReview.getDate() + interval);
        }

        // Update DB
        const updateQuery = `
            UPDATE progress 
            SET interval = $1, repetition = $2, efactor = $3, next_review = $4, last_reviewed = NOW()
            WHERE card_id = $5
            RETURNING *
        `;

        const updated = await pool.query(updateQuery, [
            interval,
            repetition,
            efactor,
            nextReview.toISOString(),
            card_id
        ]);

        res.json(updated.rows[0]);

    } catch (error) {
        console.error('Grade card error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { getDueCards, gradeCard };
