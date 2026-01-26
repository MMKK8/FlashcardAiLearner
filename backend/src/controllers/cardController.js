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
        const prompt = `Actúa como un diccionario experto.
        Instrucción Principal: Analiza la palabra en inglés proporcionada: '${word}'. IGNORA si está en plural, mayúsculas o conjugada.
        
        Paso 1: Estandarización
        - Si es un sustantivo plural, conviértelo a SINGULAR (ej: HUNTERS -> Hunter).
        - Si es un verbo conjugado, conviértelo a INFINITIVO sin 'to' (ej: Running -> Run).
        - Formato: Sentence case (Primera mayúscula, resto minúsculas).

        Paso 2: Traducción y Definición
        - Traduce AL ESPAÑOL la palabra estandarizada del Paso 1 (NO la original).
        - Ejemplo: Input 'HUNTERS' -> Standardized 'Hunter' -> Translation 'Cazador'.

        Paso 3: Respuesta JSON
        Devuelve ÚNICAMENTE un objeto JSON:
        { 
            "word_en": "La palabra estandarizada (Paso 1)", 
            "translation": "Traducción al español (Paso 2)", 
            "phonetic": "Transcipción fonética de la palabra estandarizada", 
            "examples": ["Sentence in English using the standardized word", "Another sentence"] 
        }`;

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
                word_en: cardData.word_en || word,
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
            cardData.word_en || word,
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
async function extractWordFromImage(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = "Analyze the image and identify the main English word. IGNORE plurality or case. Convert it to SINGULAR form (if noun) or INFINITIVE (if verb). Return ONLY the standardized word in Sentence case (e.g. 'Hunters' -> 'Hunter'). No punctuation.";

        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text().trim();

        res.json({ word: text });
    } catch (error) {
        console.error('OCR error:', error);
        res.status(500).json({ error: 'Failed to process image' });
    }
}

module.exports = { generateCard, getCards, createCard, extractWordFromImage };
