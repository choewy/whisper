from typing import Iterable, Tuple

from faster_whisper import WhisperModel
from faster_whisper.transcribe import Segment, TranscriptionInfo


class WhisperService:
    def __init__(
        self,
        model_size: str = "small",
        device: str = "cpu",
        compute_type: str = "int8",
    ) -> None:
        self._model = WhisperModel(
            model_size_or_path=model_size,
            device=device,
            compute_type=compute_type,
        )

    def transcribe(self, audio_path: str) -> Tuple[Iterable[Segment], TranscriptionInfo]:
        return self._model.transcribe(
            audio_path,
            beam_size=5,
            vad_filter=True,
        )
