from fastapi import APIRouter

from apps.api.service import TranscriptionQueueService
from apps.api.dto import TranscriptionRequestDTO, TranscriptionResponseDTO
from libs.config import Config


transcribe_controller = APIRouter()

queue_service = TranscriptionQueueService(Config())


@transcribe_controller.get("/")
def root() -> dict[str, str]:
    return {"message": "ok"}


@transcribe_controller.post("/transcribe", status_code=202, response_model=TranscriptionResponseDTO)
def enqueue_transcription(body: TranscriptionRequestDTO) -> TranscriptionResponseDTO:
    payload = body.model_dump()

    return TranscriptionResponseDTO(
        id=body.id,
        message="queued",
        job_id=queue_service.enqueue(payload)
    )
