from fastapi import FastAPI, UploadFile, File, Form
import shutil
import os

from services import WhisperService, SubtitleService

app = FastAPI()

whisper_service = WhisperService(model_size="small")
subtitle_service = SubtitleService()

UPLOAD_DIR = ".temp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
def root():
    return {
        "message": "done"
    }


@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    script: str = Form(None)
):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    segments, info = whisper_service.transcribe(file_path)
    srt_id = subtitle_service.build_srt(
        segments=segments,
        script="" if script is None else script
    )

    return {
        "message": "done",
        "id": srt_id,
        "language": info.language,
        "duration": info.duration,
    }
