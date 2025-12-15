const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_INPUT_DIR = path.join(__dirname, '../data_input');
const KNOWLEDGE_BASE_PATH = path.join(__dirname, '../knowledge-base.json');

async function importTextFiles() {
    try {
        // 1. Check if input directory exists
        try {
            await fs.access(DATA_INPUT_DIR);
        } catch {
            console.log(`Creating input directory: ${DATA_INPUT_DIR}`);
            await fs.mkdir(DATA_INPUT_DIR, { recursive: true });
            console.log('Please place your .txt files in this directory and run the script again.');
            return;
        }

        // 2. Read existing knowledge base
        let knowledgeBase = [];
        try {
            const kbContent = await fs.readFile(KNOWLEDGE_BASE_PATH, 'utf8');
            knowledgeBase = JSON.parse(kbContent);
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.log('Creating new knowledge-base.json');
            } else {
                throw err;
            }
        }

        // 3. Read files from data_input
        const files = await fs.readdir(DATA_INPUT_DIR);
        const txtFiles = files.filter(f => f.endsWith('.txt'));

        if (txtFiles.length === 0) {
            console.log('No .txt files found in backend/data_input/');
            return;
        }

        console.log(`Found ${txtFiles.length} files to import...`);
        let addedCount = 0;

        for (const file of txtFiles) {
            const filePath = path.join(DATA_INPUT_DIR, file);
            const content = await fs.readFile(filePath, 'utf8');
            const title = path.basename(file, '.txt').replace(/[_-]/g, ' '); // Clean title

            // Check for duplicates (simple title check)
            const exists = knowledgeBase.some(doc => doc.title === title);

            if (!exists) {
                knowledgeBase.push({
                    id: uuidv4(),
                    title: title,
                    content: content.trim(),
                    tags: ['imported', 'text-file'],
                    category: 'general',
                    createdAt: new Date().toISOString()
                });
                addedCount++;
                console.log(`[+] Added: ${title}`);
            } else {
                console.log(`[.] Skipped (duplicate): ${title}`);
            }
        }

        if (addedCount > 0) {
            await fs.writeFile(KNOWLEDGE_BASE_PATH, JSON.stringify(knowledgeBase, null, 2));
            console.log(`\n✅ Successfully added ${addedCount} documents to knowledge-base.json`);
        } else {
            console.log('\nAll files were already imported.');
        }

    } catch (err) {
        console.error('Import failed:', err);
    }
}

importTextFiles();
