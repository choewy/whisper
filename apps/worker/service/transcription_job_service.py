from typing import Any

from redis import Redis

from libs.config import Config
from apps.worker.worker.whisper_worker import WhisperWorker


def process_transcription_job(payload: dict[str, Any]) -> dict[str, Any]:
    config = Config()
    redis_connection = Redis(
        host=config.REDIS_HOST,
        port=config.REDIS_PORT,
        db=config.REDIS_DB,
    )
    worker = WhisperWorker(redis_connection)

    try:
        return worker.process(payload)
    finally:
        redis_connection.close()
