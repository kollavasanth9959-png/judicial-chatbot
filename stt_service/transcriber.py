from faster_whisper import WhisperModel
import os

class Transcriber:
    _instance = None
    
    # Model settings - "base" is a good tradeoff for CPU
    MODEL_SIZE = "base"
    DEVICE = "cpu"
    COMPUTE_TYPE = "int8"

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            print(f"Loading Whisper model '{cls.MODEL_SIZE}' on {cls.DEVICE}...")
            cls._instance = WhisperModel(
                cls.MODEL_SIZE, 
                device=cls.DEVICE, 
                compute_type=cls.COMPUTE_TYPE
            )
            print("Model loaded successfully.")
        return cls._instance

    @staticmethod
    def transcribe(audio_path):
        """
        Transcribes the audio file at the given path.
        Returns the transcribed text and the detected language.
        """
        model = Transcriber.get_instance()
        
        # beam_size=5 is standard for accuracy
        segments, info = model.transcribe(audio_path, beam_size=5)
        
        # Combine all segments into one string
        text = " ".join([segment.text for segment in segments]).strip()
        
        return text, info.language
