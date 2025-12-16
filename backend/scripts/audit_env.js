require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'env_audit.txt');

const output = [
    '--- ENV AUDIT ---',
    `HF_MODEL_URL: ${process.env.HF_MODEL_URL || 'Not Set'}`,
    `HF_API_TOKEN: ${process.env.HF_API_TOKEN ? (process.env.HF_API_TOKEN.substring(0, 5) + '...') : 'Not Set'}`,
    `GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Set' : 'Not Set'}`
].join('\n');

fs.writeFileSync(logFile, output);
console.log(output);
