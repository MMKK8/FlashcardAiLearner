require('dotenv').config({ path: '../../.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    console.log('Testing Gemini API integration...');
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ API Key missing in .env');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // List of models to try
    const candidates = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-001",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-1.0-pro",
        "gemini-pro"
    ];

    for (const modelName of candidates) {
        console.log(`\nTesting model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const prompt = "Say hello";
            const result = await model.generateContent(prompt);
            const response = await result.response;
            console.log(`✅ SUCCESS with ${modelName}! Response:`, response.text());
            return; // Exit on first success
        } catch (err) {
            // Extract the relevant error message
            const msg = err.message ? err.message.split('\n')[0] : String(err);
            console.log(`❌ FAILED with ${modelName}: ${msg}`);
        }
    }
    console.log('\n❌ All models failed.');
}

testGemini();
