require('dotenv').config();
console.log('--- DIAGNOSTIC START ---');
console.log('Current Doc:', process.cwd());
console.log('HF_API_TOKEN status:', process.env.HF_API_TOKEN ? 'FOUND' : 'MISSING');

try {
    const ragService = require('./src/services/ragService');
    console.log('ragService loaded successfully');

    ragService.initialize().then(() => {
        console.log('ragService.initialize() finished');
        process.exit(0);
    }).catch(err => {
        console.error('ragService.initialize() failed:', err);
        process.exit(1);
    });

} catch (error) {
    console.error('Failed to require ragService:', error);
    process.exit(1);
}
