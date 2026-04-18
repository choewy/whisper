from fastapi import FastAPI

from apps.api.controller import transcribe_controller
from apps.api.controller.transcription_controller import queue_service


app = FastAPI()
app.include_router(transcribe_controller)


@app.on_event("shutdown")
def shutdown_event() -> None:
    queue_service.close()
