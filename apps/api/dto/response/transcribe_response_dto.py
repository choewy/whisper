from pydantic import BaseModel


class TranscriptionResponseDTO(BaseModel):
    id: str
    message: str
    job_id: str
