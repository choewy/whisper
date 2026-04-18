from pydantic import BaseModel


class TranscriptionResponseDTO(BaseModel):
    id: str
    message: str
    rq_job_id: str
