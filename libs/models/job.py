from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class TranscriptionJob:
    job_id: str
    audio_url: str
    script: str
    callback_url: str

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "TranscriptionJob":
        missing_fields = [
            key
            for key in ("job_id", "audio_url", "callback_url")
            if not payload.get(key)
        ]

        if missing_fields:
            fields = ", ".join(missing_fields)
            raise ValueError(f"missing required field(s): {fields}")

        script = payload.get("script", "")
        if script is None:
            script = ""

        return cls(
            job_id=str(payload["job_id"]),
            audio_url=str(payload["audio_url"]),
            script=str(script),
            callback_url=str(payload["callback_url"]),
        )
