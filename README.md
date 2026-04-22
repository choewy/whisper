# @choewy/whisper

`whisper.cpp` 기반 음성 인식(ASR)을 Node.js에서 간단히 쓰기 위한 래퍼입니다.

- upstream: https://github.com/ggml-org/whisper.cpp
- 이 패키지는 `vendor/whisper.cpp`를 포함하고, 내부적으로 `whisper-cli`를 실행합니다.

## Features

- Node.js에서 `Whisper` 클래스로 간단히 실행
- `.srt` / `.vtt` / `.txt` 파일 생성 옵션 지원
- 자막 분할 길이(`-ml`) 및 단어 단위 분할(유사 word timestamp) 옵션 지원
- 모델 다운로드 CLI 제공 (`npx @choewy/whisper download`)
- 필요 시 `make`로 `whisper.cpp` 자동 빌드 시도

## Installation

```bash
npm i @choewy/whisper
```

```bash
pnpm add @choewy/whisper
```

## Requirements

환경에 따라 아래 도구가 필요합니다.

- `make` (whisper.cpp 빌드)
- C/C++ 빌드 도구 체인
- 모델 다운로드 시 `curl` 또는 `wget` 또는 `wget2`
- Windows 환경은 `make`를 사용할 수 있는 빌드 환경(예: MSYS2/WSL 등) 권장

```bash
sudo apt update
sudo apt install -y cmake build-essential
```

## Quick Start

### 1. 모델 다운로드

```bash
npx @choewy/whisper download
```

또는

```bash
pnpx @choewy/whisper download
```

실행 시 지원 모델 목록이 표시되고, 모델명을 입력하면 다운로드 + 빌드를 진행합니다.

### 2. 실행

```ts
import { Whisper } from '@choewy/whisper';

async function main() {
  const whisper = new Whisper({
    model: 'small',
    gpu: false,
    flashAttention: false,
  });

  await whisper.initialize();

  const result = await whisper.transcribe('./audio.wav', {
    language: 'auto',
  });

  console.log(result);
}

void main();
```

예시 출력:

```json
[
  {
    "start": "00:00:03.880",
    "end": "00:00:09.400",
    "speech": "세 형제가 세상의 끝이라 불리던 그림자 강 앞에 도착했다."
  }
]
```

## CLI

### `download`

대화형으로 모델명을 받아 모델을 다운로드합니다.

```bash
npx @choewy/whisper download
```

### `help`

```bash
npx @choewy/whisper --help
```

## API

### `new Whisper(options?)`

`Whisper` 인스턴스를 생성합니다.

#### `WhisperOptions`

| Option           | Type                                                                                                                      | Default  | Description                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------- |
| `model`          | `'tiny' \| 'tiny.en' \| 'base' \| 'base.en' \| 'small' \| 'small.en' \| 'medium' \| 'medium.en' \| 'large' \| 'large-v1'` | `'base'` | 사용할 모델                             |
| `gpu`            | `boolean`                                                                                                                 | `false`  | GPU 사용 여부                           |
| `gpuDevice`      | `number`                                                                                                                  | `0`      | GPU device id (`gpu: true`일 때만 사용) |
| `flashAttention` | `boolean`                                                                                                                 | `false`  | flash attention 사용 여부               |
| `debug`          | `boolean`                                                                                                                 | `true`   | 내부 커맨드 stdout/stderr 출력 여부     |
| `async`          | `boolean`                                                                                                                 | `true`   | 현재 버전에서 외부 동작 영향 없음       |

주의:

- 위 `Default`는 `new Whisper()`를 인자 없이 호출했을 때의 기본 프로필입니다.
- `new Whisper({ ... })`로 부분 옵션만 넘기면 나머지 필드는 자동 병합되지 않습니다.
- `gpu: false`와 `gpuDevice`를 같이 쓰면 에러가 발생합니다.

### `await whisper.initialize(): Promise<Whisper>`

- 선택 모델 파일이 없으면 모델 다운로드를 시도합니다.
- 필요 시 `make`를 실행해 `whisper-cli` 빌드를 시도합니다.

### `await whisper.transcribe(input, options?): Promise<WhisperTranscriptLine[]>`

- `input`: 오디오 파일 경로
- `options`: 전사/자막 옵션

#### `WhisperCppCommandInputOptions`

| Option                 | Type      | whisper.cpp flag | Description                                          |
| ---------------------- | --------- | ---------------- | ---------------------------------------------------- |
| `generateFileText`     | `boolean` | `-otxt`          | `.txt` 파일 생성                                     |
| `generateFileSubtitle` | `boolean` | `-osrt`          | `.srt` 파일 생성                                     |
| `generateFileVtt`      | `boolean` | `-ovtt`          | `.vtt` 파일 생성                                     |
| `timestampSize`        | `number`  | `-ml N`          | 세그먼트 최대 길이(문자 수)                          |
| `wordTimestamps`       | `boolean` | `-ml 1`          | 매우 짧은 단위로 분할(단어 수준에 가까운 타임스탬프) |
| `language`             | `string`  | `-l <lang>`      | 언어 지정 (`auto` 포함)                              |

주의:

- `timestampSize`와 `wordTimestamps`는 동시에 사용할 수 없습니다.

#### 반환 타입

```ts
type WhisperTranscriptLine = {
  start: string;
  end: string;
  speech: string;
};
```

## Subtitle/Timestamp Tuning

자막 길이와 타임스탬프 분할은 아래 옵션으로 조정합니다.

```ts
const lines = await whisper.transcribe('./audio.wav', {
  generateFileSubtitle: true,
  timestampSize: 36, // 한 세그먼트 최대 문자 수
  // wordTimestamps: true, // timestampSize와 동시 사용 불가
});
```

정리:

- 줄/세그먼트 길이 조절: `timestampSize`
- 더 촘촘한 분할: `wordTimestamps: true`
- SRT/VTT 파일 생성: `generateFileSubtitle`, `generateFileVtt`

## Supported Models

| Model       |   Disk |     RAM |
| ----------- | -----: | ------: |
| `tiny`      |  75 MB | ~390 MB |
| `tiny.en`   |  75 MB | ~390 MB |
| `base`      | 142 MB | ~500 MB |
| `base.en`   | 142 MB | ~500 MB |
| `small`     | 466 MB | ~1.0 GB |
| `small.en`  | 466 MB | ~1.0 GB |
| `medium`    | 1.5 GB | ~2.6 GB |
| `medium.en` | 1.5 GB | ~2.6 GB |
| `large`     | 2.9 GB | ~4.7 GB |
| `large-v1`  | 2.9 GB | ~4.7 GB |

## Behavior Notes

- `transcribe()`는 내부적으로 `whisper-cli`를 실행합니다.
- 패키지에서 노출하는 옵션은 `whisper.cpp` 전체 옵션의 일부입니다.
- 더 세밀한 제어가 필요하면 upstream 문서를 참고하세요.
  - https://github.com/ggml-org/whisper.cpp
  - https://github.com/ggml-org/whisper.cpp/tree/master/examples/cli

## Troubleshooting

### `Command not found: make`

- 시스템에 `make`와 C/C++ toolchain을 설치하세요.

### 모델 다운로드 실패

- `curl`, `wget`, `wget2` 중 하나가 설치되어 있어야 합니다.
- 네트워크/프록시 환경을 확인하세요.

### `gpuDevice` 관련 에러

- `gpu: false`일 때는 `gpuDevice`를 전달하지 마세요.

## License

MIT
