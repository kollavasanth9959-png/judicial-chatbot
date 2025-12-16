const FormData = require('form-data');
const axios = require('axios');

// Hugging Face Whisper Model for Speech-to-Text
const WHISPER_MODEL = 'openai/whisper-large-v3';
const HF_API_URL = `https://api-inference.huggingface.co/models/${WHISPER_MODEL}`;

exports.transcribeAudio = async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No audio file provided'
            });
        }

        const token = process.env.HF_API_TOKEN;

        if (!token) {
            console.error('⚠️ HF_API_TOKEN not set');
            return res.status(500).json({
                success: false,
                error: 'Speech-to-text service is not configured'
            });
        }

        console.log('🎤 Transcribing audio file:', req.file.originalname);

        // Send audio to Hugging Face Whisper API
        const response = await axios.post(
            HF_API_URL,
            req.file.buffer,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': req.file.mimetype
                },
                timeout: 30000 // 30 second timeout
            }
        );

        // HF Whisper returns { text: "transcribed text" }
        const transcribedText = response.data.text || '';

        console.log('✅ Transcription successful:', transcribedText.substring(0, 50) + '...');

        res.status(200).json({
            success: true,
            text: transcribedText
        });

    } catch (error) {
        console.error('❌ Transcription error:', error.response?.data || error.message);

        // Handle specific HF API errors
        if (error.response?.status === 503) {
            return res.status(503).json({
                success: false,
                error: 'Speech-to-text model is loading. Please try again in a moment.'
            });
        }

        if (error.response?.status === 401) {
            return res.status(500).json({
                success: false,
                error: 'Invalid API token configuration'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to transcribe audio. Please try again.',
            details: error.message
        });
    }
};
