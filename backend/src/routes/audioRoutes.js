const express = require('express');
const multer = require('multer');
const { transcribeAudio } = require('../controllers/audioController');
const { protect: auth } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for memory storage (send buffer to HF API)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Accept audio files only
        if (file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm') {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'), false);
        }
    }
});

// POST /api/transcribe - Upload audio and get transcription
router.post('/transcribe', auth, upload.single('file'), transcribeAudio);

module.exports = router;
