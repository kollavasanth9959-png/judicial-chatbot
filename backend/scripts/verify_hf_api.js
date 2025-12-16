require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const ragService = require('../src/services/ragService');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'verification_result.txt');

function log(message) {
    fs.appendFileSync(logFile, message + '\n');
}

async function test() {
    fs.writeFileSync(logFile, 'Starting verification...\n'); // Clear/Init file
    log('Testing Hugging Face API connection...');
    log('Using Model URL: ' + (process.env.HF_MODEL_URL || 'Default (https://router.huggingface.co/models/google/flan-t5-large)'));

    try {
        const response = await ragService.queryHuggingFace('Hello, are you working?');
        if (response) {
            log('✅ SUCCESS: Received response from Hugging Face:');
            log(JSON.stringify(response, null, 2));
        } else {
            log('❌ FAILURE: No response received (check token or quota?)');
        }
    } catch (error) {
        log('❌ CRITICAL ERROR: ' + error.message);
        if (error.response) {
            log('Response Data: ' + JSON.stringify(error.response.data));
        }
    }
}

test();
