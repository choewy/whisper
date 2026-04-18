import os
import re

from models import SubtitleItem
from typing import Iterable, List
from faster_whisper.transcribe import Segment


class SubtitleService:
    @staticmethod
    def format_time(seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int(round((seconds - int(seconds)) * 1000))

        if ms == 1000:
            s += 1
            ms = 0

        if s == 60:
            m += 1
            s = 0

        if m == 60:
            h += 1
            m = 0

        return f"{h:02}:{m:02}:{s:02},{ms:03}"

    @staticmethod
    def split_script_into_sentences(script: str) -> List[str]:
        line_candidates = [re.sub(r"\s+", " ", line).strip() for line in script.splitlines()]
        normalized_lines = [line for line in line_candidates if line]

        sentences: List[str] = []

        for line in normalized_lines:
            parts = re.split(r"(?<=[.!?。！？])\s+", line)

            for part in parts:
                part = part.strip()

                if not part:
                    continue

                sentences.append(part)

        if sentences:
            return sentences

        normalized = re.sub(r"\s+", " ", script).strip()

        if normalized:
            return [normalized]

        return sentences

    @staticmethod
    def merge_segments_by_sentence_count(
        segments: Iterable[Segment],
        sentences: List[str],
    ) -> List[SubtitleItem]:
        items: List[SubtitleItem] = []
        segment_list = list(segments)

        if not segment_list:
            return items

        if not sentences:
            for segment in segment_list:
                item = SubtitleItem(
                    start=segment.start,
                    end=segment.end,
                    text=segment.text.strip(),
                )

                items.append(item)

            return items

        segment_count = len(segment_list)
        sentence_count = len(sentences)

        if segment_count == sentence_count:
            for i in range(sentence_count):
                item = SubtitleItem(
                    start=segment_list[i].start,
                    end=segment_list[i].end,
                    text=sentences[i],
                )

                items.append(item)

            return items

        for sentence_idx in range(sentence_count):
            segments_per_sentence = segment_count / sentence_count
            start_idx = round(sentence_idx * segments_per_sentence)
            end_idx = round((sentence_idx + 1) * segments_per_sentence)

            if end_idx <= start_idx:
                end_idx = min(start_idx + 1, segment_count)

            chunk = segment_list[start_idx:end_idx]

            if not chunk:
                continue

            item = SubtitleItem(
                start=chunk[0].start,
                end=chunk[-1].end,
                text=sentences[sentence_idx],
            )

            items.append(item)

        return items

    def build_srt(
        self,
        segments: Iterable[Segment],
        script: str,
        output_path: str = ".temp/script_based.srt",
    ) -> str:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        sentences = self.split_script_into_sentences(script)
        items = self.merge_segments_by_sentence_count(segments, sentences)

        with open(output_path, "w", encoding="utf-8") as f:
            for i, item in enumerate(items, start=1):
                sequence = f"{i}\n"
                timestamp = f"{self.format_time(item.start)} --> {self.format_time(item.end)}\n"
                text = f"{item.text.strip()}\n\n"

                f.write(sequence)
                f.write(timestamp)
                f.write(text)

        return output_path
