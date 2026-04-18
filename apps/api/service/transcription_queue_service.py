from typing import Any

from redis import Redis
from rq import Queue

from libs.config import Config


class TranscriptionQueueService:
    QUEUE_NAME = "whisper"
    JOB_FUNCTION_PATH = "apps.worker.service.transcription_job_service.process_transcription_job"

    def __init__(self, config: Config) -> None:
        self._redis = Redis(
            host=config.REDIS_HOST,
            port=config.REDIS_PORT,
            db=config.REDIS_DB,
        )
        self._queue = Queue(name=self.QUEUE_NAME, connection=self._redis)

    def enqueue(self, payload: dict[str, Any]) -> str:
        job = self._queue.enqueue(self.JOB_FUNCTION_PATH, payload=payload)

        return job.id

    def close(self) -> None:
        self._redis.close()
