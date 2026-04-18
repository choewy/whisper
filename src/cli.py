import argparse

from services import WhisperService, SubtitleService


def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", required=True)
    parser.add_argument("--script", required=False, default="")

    return parser.parse_args()


def main() -> None:
    args = parse_arguments()
    whisper_service = WhisperService(
        model_size="small",
        device="cpu",
        compute_type="int8",
    )

    subtitle_service = SubtitleService()
    segments, info = whisper_service.transcribe(args.audio)

    srt_id = subtitle_service.build_srt(
        segments=segments,
        script=args.script,
    )

    print(srt_id)


if __name__ == "__main__":
    main()
