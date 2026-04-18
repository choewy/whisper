import json
import os
import re
import uuid
from typing import Iterable, List

from faster_whisper.transcribe import Segment

from libs.models.subtitle import SubtitleItem


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
        normalized_lines: list[str] = []

        for line in script.splitlines():
            candidate = re.sub(r"\s+", " ", line).strip()

            if not candidate:
                continue

            normalized_lines.append(candidate)

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
            return SubtitleService._split_segments_without_script(segment_list)

        segment_count = len(segment_list)
        sentence_count = len(sentences)

        if sentence_count > segment_count:
            return SubtitleService._split_range_by_sentence_weight(
                start=segment_list[0].start,
                end=segment_list[-1].end,
                sentences=sentences,
            )

        for sentence_idx, sentence in enumerate(sentences):
            start_idx = (sentence_idx * segment_count) // sentence_count
            end_idx = ((sentence_idx + 1) * segment_count) // sentence_count

            if end_idx <= start_idx:
                end_idx = min(start_idx + 1, segment_count)

            chunk = segment_list[start_idx:end_idx]

            if not chunk:
                fallback_idx = min(start_idx, segment_count - 1)
                chunk = [segment_list[fallback_idx]]

            item = SubtitleItem(
                start=chunk[0].start,
                end=chunk[-1].end,
                text=sentence,
            )
            items.append(item)

        return items

    @staticmethod
    def _split_range_by_sentence_weight(
        start: float,
        end: float,
        sentences: List[str],
    ) -> List[SubtitleItem]:
        if not sentences:
            return []

        duration = max(end - start, 0.0)
        weights = [SubtitleService._sentence_weight(sentence) for sentence in sentences]
        total_weight = sum(weights)

        if total_weight == 0:
            return [
                SubtitleItem(start=start, end=end, text=sentence)
                for sentence in sentences
            ]

        items: List[SubtitleItem] = []
        cumulative_weight = 0

        for index, sentence in enumerate(sentences):
            sentence_start = start + duration * (cumulative_weight / total_weight)
            cumulative_weight += weights[index]

            if index == len(sentences) - 1:
                sentence_end = end
            else:
                sentence_end = start + duration * (
                    cumulative_weight / total_weight
                )

            items.append(
                SubtitleItem(
                    start=sentence_start,
                    end=sentence_end,
                    text=sentence,
                )
            )

        return items

    @staticmethod
    def _sentence_weight(sentence: str) -> int:
        compact = re.sub(r"\s+", "", sentence)
        return max(len(compact), 1)

    @staticmethod
    def _split_segments_without_script(segments: List[Segment]) -> List[SubtitleItem]:
        max_chars = SubtitleService._read_int_env(
            "SUBTITLE_AUTO_MAX_CHARS",
            14,
        )
        max_duration = SubtitleService._read_float_env(
            "SUBTITLE_AUTO_MAX_DURATION_S",
            2.0,
        )

        items: List[SubtitleItem] = []

        for segment in segments:
            split_items = SubtitleService._split_segment_by_words(
                segment=segment,
                max_chars=max_chars,
                max_duration=max_duration,
            )

            if split_items:
                items.extend(split_items)
                continue

            text = segment.text.strip()
            if not text:
                continue

            items.append(
                SubtitleItem(
                    start=segment.start,
                    end=segment.end,
                    text=text,
                )
            )

        return items

    @staticmethod
    def _split_segment_by_words(
        segment: Segment,
        max_chars: int,
        max_duration: float,
    ) -> List[SubtitleItem]:
        words = [
            word
            for word in (segment.words or [])
            if word.word and word.word.strip()
        ]

        if len(words) < 2:
            return []

        items: List[SubtitleItem] = []
        chunk_words: List[str] = []
        chunk_start = words[0].start
        chunk_end = words[0].end
        chunk_char_count = 0

        for index, word in enumerate(words):
            raw_word = word.word
            clean_word = raw_word.strip()

            if not chunk_words:
                chunk_start = word.start
                chunk_char_count = 0

            chunk_words.append(raw_word)
            chunk_end = word.end
            chunk_char_count += SubtitleService._sentence_weight(clean_word)

            chunk_duration = max(chunk_end - chunk_start, 0.0)
            punctuation_boundary = clean_word.endswith(
                (".", "!", "?", "。", "！", "？")
            )
            length_boundary = chunk_char_count >= max_chars
            duration_boundary = chunk_duration >= max_duration
            last_word = index == len(words) - 1

            should_flush = (
                punctuation_boundary
                or length_boundary
                or duration_boundary
                or last_word
            )

            if not should_flush:
                continue

            text = "".join(chunk_words).strip()
            if text:
                items.append(
                    SubtitleItem(
                        start=chunk_start,
                        end=chunk_end,
                        text=text,
                    )
                )

            chunk_words = []

        return items

    @staticmethod
    def _read_int_env(name: str, default: int) -> int:
        value = os.getenv(name)

        if not value:
            return default

        try:
            parsed = int(value)
        except ValueError:
            return default

        return parsed if parsed > 0 else default

    @staticmethod
    def _read_float_env(name: str, default: float) -> float:
        value = os.getenv(name)

        if not value:
            return default

        try:
            parsed = float(value)
        except ValueError:
            return default

        return parsed if parsed > 0 else default

    def build_srt(
        self,
        segments: Iterable[Segment],
        script: str,
    ) -> str:
        id = uuid.uuid4()
        filename = f"{id}.srt"
        output_path = f".temp/{filename}"
        whisper_path = f".temp/{id}.whisper.json"
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        segment_list = list(segments)

        # whisper segments를 JSON으로 저장
        whisper_payload = {
            "segments": [
                {
                    "id": segment.id,
                    "start": segment.start,
                    "end": segment.end,
                    "text": segment.text,
                    "words": [
                        {
                            "start": word.start,
                            "end": word.end,
                            "word": word.word,
                            "probability": word.probability,
                        }
                        for word in (segment.words or [])
                    ],
                }
                for segment in segment_list
            ]
        }

        with open(whisper_path, "w", encoding="utf-8") as whisper_file:
            json.dump(whisper_payload, whisper_file, ensure_ascii=False, indent=2)

        sentences = self.split_script_into_sentences(script)
        items = self.merge_segments_by_sentence_count(segment_list, sentences)

        with open(output_path, "w", encoding="utf-8") as file:
            for i, item in enumerate(items, start=1):
                sequence = f"{i}\n"
                timestamp = (
                    f"{self.format_time(item.start)} --> "
                    f"{self.format_time(item.end)}\n"
                )
                text = f"{item.text.strip()}\n\n"

                file.write(sequence)
                file.write(timestamp)
                file.write(text)

        return filename
