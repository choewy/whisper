import logging
import time

from redis import Redis, RedisError
from rq import Queue, SimpleWorker

from libs.config import Config


LOGGER = logging.getLogger(__name__)

RQ_QUEUE_NAME = "whisper"
REDIS_RETRY_DELAY_SECONDS = 1.0


def configure_logging(level: str) -> None:
    logging.basicConfig(
        level=level.upper(),
        format="%(asctime)s %(levelname)s %(message)s",
    )


def create_redis_connection() -> Redis:
    config = Config()

    return Redis(
        host=config.REDIS_HOST,
        port=config.REDIS_PORT,
        db=config.REDIS_DB,
    )


def main() -> None:
    configure_logging(Config.LOG_LEVEL)

    while True:
        redis_connection = None

        try:
            redis_connection = create_redis_connection()
            queue = Queue(name=RQ_QUEUE_NAME, connection=redis_connection)
            worker = SimpleWorker([queue], connection=redis_connection)

            LOGGER.info("rq worker started: queue=%s", RQ_QUEUE_NAME)
            worker.work(with_scheduler=False)
            break
        except RedisError as exc:
            LOGGER.warning(
                "redis connection error. retrying in %.1fs: %s",
                REDIS_RETRY_DELAY_SECONDS,
                exc,
            )
            try:
                time.sleep(REDIS_RETRY_DELAY_SECONDS)
            except KeyboardInterrupt:
                LOGGER.info("worker stopped by user")
                break
        except KeyboardInterrupt:
            LOGGER.info("worker stopped by user")
            break
        finally:
            if redis_connection is not None:
                redis_connection.close()


if __name__ == "__main__":
    main()
