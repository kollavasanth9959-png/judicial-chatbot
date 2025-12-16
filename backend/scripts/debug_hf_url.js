require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'url_debug_results.txt');
function log(msg) {
    fs.appendFileSync(logFile, msg + '\n');
    console.log(msg);
}

fs.writeFileSync(logFile, '--- Testing Qwen Model ---\n');

const token = process.env.HF_API_TOKEN;
const modelId = 'Qwen/Qwen2.5-7B-Instruct';

async function testUrl(url, method = 'POST', body) {
    log(`\nTesting ${method} ${url}...`);
    try {
        const response = await axios({
            method: method,
            url: url,
            data: body,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            timeout: 10000
        });
        log(`✅ SUCCESS (Status: ${response.status})`);
        if (response.data) log('Response: ' + JSON.stringify(response.data).substring(0, 200));
        return true;
    } catch (error) {
        log(`❌ FAILED: ${error.message} ${error.response?.status || ''}`);
        if (error.response) log('Error Data: ' + JSON.stringify(error.response.data));
        return false;
    }
}

async function run() {
    // 1. Router Chat
    await testUrl(
        `https://router.huggingface.co/v1/chat/completions`,
        'POST',
        {
            model: modelId,
            messages: [{ role: "user", content: "Hi" }],
            max_tokens: 10
        }
    );

    // 2. Legacy API
    await testUrl(
        `https://api-inference.huggingface.co/models/${modelId}`,
        'POST',
        { inputs: "Hi" }
    );
}

run();
