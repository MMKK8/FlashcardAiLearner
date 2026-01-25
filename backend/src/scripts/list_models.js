require('dotenv').config({ path: '../../.env' });
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('No API Key');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log(`Querying: ${url.replace(apiKey, 'HIDDEN')}`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error('API Error:', json.error);
            } else if (json.models) {
                console.log('Available Models:');
                json.models.forEach(m => console.log(` - ${m.name} (${m.supportedGenerationMethods})`));
            } else {
                console.log('Response:', json);
            }
        } catch (e) {
            console.error('Parse Error:', e);
            console.log('Raw:', data);
        }
    });
}).on('error', (err) => {
    console.error('Request Error:', err);
});
