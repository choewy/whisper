import logging
import os
import tempfile
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from faster_whisper.transcribe import TranscriptionInfo
from redis import Redis

from libs.models import TranscriptionJob
from libs.services import HttpService, SubtitleService, WhisperService


LOGGER = logging.getLogger(__name__)


class WhisperWorker:
    _temp_dir = ".temp/worker"
    _redis: Redis
    _http_service = HttpService()
    _subtitle_service = SubtitleService()
    _whisper_service = WhisperService()

    def __init__(self, redis: Redis) -> None:
        self._redis = redis
        os.makedirs(self._temp_dir, exist_ok=True)

    def process(self, payload: dict[str, Any]) -> dict[str, Any]:
        job = TranscriptionJob.from_payload(payload)
        return self._process_job(job)

    def _process_job(self, job: TranscriptionJob) -> dict[str, Any]:
        audio_path = ""

        try:
            LOGGER.info("processing job_id=%s", job.job_id)
            audio_path = self._download_audio(job.audio_url, job.job_id)

            segments, info = self._whisper_service.transcribe(audio_path)
            subtitle_id = self._subtitle_service.build_srt(
                segments=segments,
                script=job.script,
            )

            subtitle_path = os.path.join(".temp", subtitle_id)
            subtitle_content = self._read_text_file(subtitle_path)

            result_payload = self._build_success_payload(
                job=job,
                subtitle_id=subtitle_id,
                subtitle_content=subtitle_content,
                info=info,
            )
            self._post_callback(job.callback_url, result_payload)

            LOGGER.info("completed job_id=%s", job.job_id)
            return result_payload
        except Exception as exc:
            LOGGER.exception("failed job_id=%s", job.job_id)
            self._send_failure(
                callback_url=job.callback_url,
                job_id=job.job_id,
                error_message=str(exc),
            )
            raise
        finally:
            if audio_path and os.path.exists(audio_path):
                os.remove(audio_path)

    def _download_audio(self, audio_url: str, job_id: str) -> str:
        suffix = self._guess_extension(audio_url)
        safe_job_id = self._safe_filename(job_id)

        with tempfile.NamedTemporaryFile(
            mode="wb",
            dir=self._temp_dir,
            prefix=f"{safe_job_id}_",
            suffix=suffix,
            delete=False,
        ) as temp_file:
            temp_path = temp_file.name

        try:
            self._http_service.download_to_file(audio_url, temp_path)

            if os.path.getsize(temp_path) == 0:
                raise RuntimeError("downloaded audio file is empty")
        except Exception:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise

        return temp_path

    def _post_callback(self, callback_url: str, payload: dict[str, Any]) -> None:
        if not callback_url:
            LOGGER.warning("missing callback_url. skipping callback")
            return

        self._http_service.post_json(callback_url, payload)

    def _send_failure(self, callback_url: str, job_id: str, error_message: str) -> None:
        if not callback_url:
            LOGGER.warning(
                "job failed but callback_url is missing. job_id=%s error=%s",
                job_id,
                error_message,
            )
            return

        payload = {
            "job_id": job_id,
            "status": "failed",
            "error": {
                "message": error_message,
            },
        }

        try:
            self._post_callback(callback_url, payload)
        except Exception:
            LOGGER.exception(
                "failed to send failure callback. job_id=%s callback_url=%s",
                job_id,
                callback_url,
            )

    @staticmethod
    def _build_success_payload(
        job: TranscriptionJob,
        subtitle_id: str,
        subtitle_content: str,
        info: TranscriptionInfo,
    ) -> dict[str, Any]:
        return {
            "job_id": job.job_id,
            "status": "completed",
            "result": {
                "subtitle_id": subtitle_id,
                "subtitle": subtitle_content,
                "language": info.language,
                "duration": info.duration,
            },
        }

    @staticmethod
    def _guess_extension(audio_url: str) -> str:
        path = Path(urlparse(audio_url).path)
        suffix = path.suffix.strip()

        if not suffix:
            return ".audio"

        return suffix

    @staticmethod
    def _safe_filename(value: str) -> str:
        cleaned = "".join(ch for ch in value if ch.isalnum()
                          or ch in ("-", "_"))
        return cleaned or "job"

    @staticmethod
    def _read_text_file(path: str) -> str:
        with open(path, "r", encoding="utf-8") as file:
            return file.read()

    def close(self) -> None:
        self._http_service.close()
        self._redis.close()
