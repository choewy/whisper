from typing import Any

import httpx


class HttpService:
    def __init__(self) -> None:
        self._client = httpx.Client(
            follow_redirects=True,
            timeout=httpx.Timeout(
                connect=10.0,
                read=300.0,
                write=60.0,
                pool=60.0,
            ),
        )

    def download_to_file(self, url: str, output_path: str) -> None:
        with self._client.stream("GET", url) as response:
            response.raise_for_status()

            with open(output_path, "wb") as output_file:
                for chunk in response.iter_bytes():
                    output_file.write(chunk)

    def post_json(self, url: str, payload: dict[str, Any]) -> None:
        response = self._client.post(url, json=payload)
        response.raise_for_status()

    def close(self) -> None:
        self._client.close()
