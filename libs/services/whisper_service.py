import os
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
        self._beam_size = int(os.getenv("WHISPER_BEAM_SIZE", "5"))
        self._vad_min_silence_duration_ms = int(
            os.getenv("WHISPER_VAD_MIN_SILENCE_MS", "250")
        )
        self._vad_speech_pad_ms = int(
            os.getenv("WHISPER_VAD_SPEECH_PAD_MS", "120")
        )
        self._vad_max_speech_duration_s = float(
            os.getenv("WHISPER_VAD_MAX_SPEECH_DURATION_S", "1.5")
        )

        self._model = WhisperModel(
            model_size_or_path=model_size,
            device=device,
            compute_type=compute_type,
        )

    def transcribe(self, audio_path: str) -> Tuple[Iterable[Segment], TranscriptionInfo]:
        return self._model.transcribe(
            audio_path,
            beam_size=self._beam_size,
            vad_filter=True,
            vad_parameters={
                "min_silence_duration_ms": self._vad_min_silence_duration_ms,
                "speech_pad_ms": self._vad_speech_pad_ms,
                "max_speech_duration_s": self._vad_max_speech_duration_s,
            },
            word_timestamps=True,
        )
