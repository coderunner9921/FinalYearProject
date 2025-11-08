import os
import tempfile
import speech_recognition as sr
from pydub import AudioSegment
import io

class SpeechToTextService:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        
    def transcribe_audio(self, audio_data: bytes) -> str:
        """Transcribe audio using free Google Speech Recognition"""
        try:
            # Convert webm to wav using pydub
            audio = AudioSegment.from_file(io.BytesIO(audio_data), format="webm")
            wav_data = io.BytesIO()
            audio.export(wav_data, format="wav")
            wav_data.seek(0)
            
            # Use speech_recognition with Google Web Speech API
            with sr.AudioFile(wav_data) as source:
                audio = self.recognizer.record(source)
                
            text = self.recognizer.recognize_google(audio)
            return text
            
        except sr.UnknownValueError:
            return "Could not understand audio"
        except sr.RequestError as e:
            return f"Error with speech recognition service: {e}"
        except Exception as e:
            return f"Processing error: {str(e)}"

stt_service = SpeechToTextService()