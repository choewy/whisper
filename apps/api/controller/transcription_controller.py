from fastapi import APIRouter

from apps.api.service import TranscriptionQueueService
from apps.api.dto import TranscriptionRequestDTO, TranscriptionResponseDTO


router = APIRouter()
queue_service = TranscriptionQueueService()


@router.get("/")
def root() -> dict[str, str]:
    return {"message": "ok"}


@router.post("/transcriptions", status_code=202, response_model=TranscriptionResponseDTO)
@router.post("/transcribe", status_code=202, response_model=TranscriptionResponseDTO)
def enqueue_transcription(body: TranscriptionRequestDTO) -> TranscriptionResponseDTO:
    payload = body.model_dump()
    rq_job_id = queue_service.enqueue(payload)

    return TranscriptionResponseDTO(
        id=body.id,
        message="queued",
        rq_job_id=rq_job_id,
    )
