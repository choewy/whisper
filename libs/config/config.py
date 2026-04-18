from dataclasses import dataclass

from libs.config.config_parser import config_parser


@dataclass(frozen=True)
class Config:
    LOG_LEVEL: str = "INFO"

    REDIS_HOST = config_parser.get("REDIS_HOST")
    REDIS_PORT = config_parser.get_int("REDIS_PORT")
    REDIS_DB = config_parser.get_int("REDIS_DB")
