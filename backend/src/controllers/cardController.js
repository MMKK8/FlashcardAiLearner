const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateCard(req, res) {
    try {
        const { word, deck_id } = req.body;
        const userId = req.user.userId;

        if (!word) {
            return res.status(400).json({ error: 'Word is required' });
        }

        // If deck_id is provided, verify it exists (Same as before)
        if (deck_id) {
            const deckCheck = await pool.query('SELECT * FROM decks WHERE id = $1 AND user_id = $2', [deck_id, userId]);
            if (deckCheck.rows.length === 0) {
                return res.status(403).json({ error: 'Deck not found or unauthorized' });
            }
        }

        // Call Gemini API
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `Actúa como un diccionario experto. Para la palabra en inglés '${word}', devuelve únicamente un objeto JSON con la siguiente estructura: { 'translation': 'Traducción al español', 'phonetic': '...', 'examples': ['Sentence in English using the word', 'Another sentence in English'] }. Asegúrate de que la traducción sea al español pero los ejemplos (examples) estén 100% en INGLÉS.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON safely
        let cardData;
        try {
            // Remove markdown code blocks if present
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            cardData = JSON.parse(cleanedText);
        } catch (e) {
            console.error('Failed to parse AI response:', text);
            return res.status(500).json({ error: 'Failed to generate valid card data from AI' });
        }

        // IF NO DECK ID -> Return Preview (Do not save)
        if (!deck_id) {
            return res.json({
                preview: true,
                word_en: word,
                word_es: cardData.translation,
                phonetic: cardData.phonetic,
                examples: cardData.examples
            });
        }

        // IF DECK ID PROVIDED -> Save to DB (Legacy support or Direct Add)
        const insertQuery = `
      INSERT INTO cards (deck_id, word_en, word_es, phonetic, examples)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

        const newCard = await pool.query(insertQuery, [
            deck_id,
            word,
            cardData.translation,
            cardData.phonetic,
            JSON.stringify(cardData.examples)
        ]);

        // Initialize Progress for SM-2
        await pool.query('INSERT INTO progress (card_id) VALUES ($1)', [newCard.rows[0].id]);

        res.status(201).json(newCard.rows[0]);

    } catch (error) {
        console.error('Card generation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function createCard(req, res) {
    try {
        const { deck_id, word_en, word_es, phonetic, examples } = req.body;
        const userId = req.user.userId;

        if (!deck_id || !word_en || !word_es) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify deck ownership
        const deckCheck = await pool.query('SELECT * FROM decks WHERE id = $1 AND user_id = $2', [deck_id, userId]);
        if (deckCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Deck not found or unauthorized' });
        }

        const insertQuery = `
      INSERT INTO cards (deck_id, word_en, word_es, phonetic, examples)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

        const newCard = await pool.query(insertQuery, [
            deck_id,
            word_en,
            word_es,
            phonetic,
            JSON.stringify(examples || [])
        ]);

        // Initialize Progress for SM-2
        await pool.query('INSERT INTO progress (card_id) VALUES ($1)', [newCard.rows[0].id]);

        res.status(201).json(newCard.rows[0]);
    } catch (error) {
        console.error('Create card error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getCards(req, res) {
    try {
        const { deck_id } = req.params;
        const userId = req.user.userId;

        // Verify deck ownership
        const deckCheck = await pool.query('SELECT * FROM decks WHERE id = $1 AND user_id = $2', [deck_id, userId]);
        if (deckCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Deck not found or unauthorized' });
        }

        const cards = await pool.query('SELECT * FROM cards WHERE deck_id = $1 ORDER BY created_at DESC', [deck_id]);
        res.json(cards.rows);
    } catch (error) {
        console.error('Get cards error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { generateCard, getCards, createCard };
