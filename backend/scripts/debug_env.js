require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'verification_result.txt');

function log(message) {
    fs.appendFileSync(logFile, message + '\n');
}

log('--- DUMPING ENV KEYS ---');
const keys = Object.keys(process.env);
const hfKeys = keys.filter(k => k.startsWith('HF_'));
log('HF Keys found: ' + hfKeys.join(', '));
log('HF_API_TOKEN present: ' + (process.env.HF_API_TOKEN ? 'YES' : 'NO'));
if (process.env.HF_API_TOKEN) {
    log('HF_API_TOKEN length: ' + process.env.HF_API_TOKEN.length);
}
