const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');

try {
    let content = fs.readFileSync(envPath, 'utf8');
    console.log('Current .env content length:', content.length);

    if (content.includes('api-inference.huggingface.co')) {
        console.log('Found deprecated URL in .env, replacing...');
        const newContent = content.replace(/api-inference\.huggingface\.co/g, 'router.huggingface.co');
        fs.writeFileSync(envPath, newContent);
        console.log('✅ Successfully updated .env with new Hugging Face router URL.');
    } else {
        console.log('⚠️ Deprecated URL not found in .env. It might already be updated or not present.');
    }

} catch (err) {
    console.error('❌ Error updating .env:', err);
}
