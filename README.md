# Whisper (FastAPI + RQ Worker)

## Architecture

1. Client -> FastAPI
2. FastAPI -> RQ enqueue
3. Python worker(RQ) -> dequeue
4. Whisper
5. NestJS callback API

## Project Structure

```text
libs/
  config/
  models/
  services/

apps/
  api/
    dto/
    controller/
    service/
    main.py

  worker/
    service/
    worker/
    main.py
```

## Request Payload

`POST /transcribe`

```json
{
  "id": "job-001",
  "audio_url": "https://example.com/audio.wav",
  "script": "optional script",
  "callback_url": "https://your-nest-api.com/whisper/callback"
}
```

## Callback Payload

### Succeed

```json
{
  "id": "job-001",
  "status": "completed",
  "result": {
    "subtitle_id": "uuid.srt",
    "subtitle": "1\n00:00:00,000 --> 00:00:01,000\n...",
    "language": "ko",
    "duration": 12.34
  }
}
```

### Failed

```json
{
  "job_id": "job-001",
  "status": "failed",
  "error": {
    "message": "error message"
  }
}
```

## Environment

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6370
REDIS_DB=0

# Optional Whisper segmentation tuning.
# Smaller silence value and lower max speech duration create finer segments.
WHISPER_BEAM_SIZE=5
WHISPER_VAD_MIN_SILENCE_MS=250
WHISPER_VAD_SPEECH_PAD_MS=120
WHISPER_VAD_MAX_SPEECH_DURATION_S=2.0

# Optional fallback split when script is empty.
SUBTITLE_AUTO_MAX_CHARS=18
SUBTITLE_AUTO_MAX_DURATION_S=2.0
```

```zsh
cp .env.local .env
```

## Run

### API

```zsh
PYTHONPATH=apps/api:libs uvicorn main:app --host 0.0.0.0 --port 8000
```

### Worker

```zsh
PYTHONPATH=apps/worker:libs python -m main
```

## Example Request

```zsh
curl -X POST http://127.0.0.1:8000/transcriptions \
  -H "Content-Type: application/json" \
  -d '{
    "job_id":"job-001",
    "audio_url":"https://example.com/audio.wav",
    "script":"안녕하세요.",
    "callback_url":"https://your-nest-api.com/whisper/callback"
  }'
```
