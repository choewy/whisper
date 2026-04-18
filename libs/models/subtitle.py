from dataclasses import dataclass


@dataclass
class SubtitleItem:
    start: float
    end: float
    text: str
