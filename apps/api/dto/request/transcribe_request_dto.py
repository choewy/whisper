from pydantic import BaseModel


class TranscriptionRequestDTO(BaseModel):
    id: str
    audio_url: str
    script: str = ""
    callback_url: str
