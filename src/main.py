from services import WhisperService, SubtitleService


def main() -> None:
    audio_path = "example/audio.wav"
    output_path = "example/audio.srt"
    script = """
    아주 오래전, 이름조차 남지 않은 시대에
    세 형제가 세상의 끝이라 불리던 그림자 강 앞에 도착했다.
    """

    whisper_service = WhisperService(
        model_size="small",
        device="cpu",
        compute_type="int8",
    )

    subtitle_service = SubtitleService()
    segments, info = whisper_service.transcribe(audio_path)

    print("language:", info.language)
    print("duration:", info.duration)

    srt_path = subtitle_service.build_srt(
        segments=segments,
        script=script,
        output_path=output_path,
    )

    print(f"done: {srt_path}")


if __name__ == "__main__":
    main()
