from fastapi import FastAPI

from apps.api.controller import router as transcription_router
from apps.api.controller.transcription_controller import queue_service


app = FastAPI()
app.include_router(transcription_router)


@app.on_event("shutdown")
def shutdown_event() -> None:
    queue_service.close()
