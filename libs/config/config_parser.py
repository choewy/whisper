import os

from dotenv import load_dotenv


class ConfigParser:
    def __init__(self) -> None:
        load_dotenv(dotenv_path=".env", override=True)

    def get(self, key: str, default: str | None = None) -> str:
        value = os.getenv(key, default)

        if not value:
            raise ValueError(f"{key} IS REQUIRED")

        return value

    def get_int(self, key: str, default: int | None = None) -> int:
        return int(self.get(key, None if default is None else str(default)))

    def get_float(self, key: str, default: float | None = None) -> float:
        return float(self.get(key, None if default is None else str(default)))


config_parser = ConfigParser()
