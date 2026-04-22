# @choewy/whisper

A Node.js wrapper around [`whisper.cpp`](https://github.com/ggml-org/whisper.cpp) for local speech-to-text.

This package bundles `vendor/whisper.cpp` and runs `whisper-cli` under the hood.

## Features

- Simple `Whisper` class API for Node.js/TypeScript
- Interactive model downloader via CLI
- Auto-build attempt (`make`) when `whisper-cli` is missing
- Transcript parsing to `{ start, end, speech }[]`
- Optional `.txt`, `.srt`, `.vtt` generation flags

## Installation

```bash
npm install @choewy/whisper
```

```bash
pnpm install @choewy/whisper
```

## Requirements

Depending on your environment, install:

- `make` and a C/C++ toolchain
- `curl`, `wget`, or `wget2` (for model download script)

### MacOS

```zsh
brew install cmake wget
```

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install -y cmake build-essential
```

## Quick Start

### 1. Download a model

```bash
npx @choewy/whisper download
```

or

```bash
pnpx @choewy/whisper download
```

### 2. Transcribe an audio file

```ts
import { Whisper } from '@choewy/whisper';

async function main() {
  const whisper = new Whisper({
    model: 'small',
    gpu: false,
    flashAttention: false,
  });

  await whisper.initialize();

  const lines = await whisper.transcribe('./audio.wav', {
    language: 'auto',
    wordTimestamps: true,
  });

  console.log(lines);
}

void main();
```

## CLI

### `download`

Interactive model picker + download + build:

```bash
npx @choewy/whisper download
```

```bash
pnpx @choewy/whisper download
```

### `--help`

```bash
npx @choewy/whisper --help
```

```bash
pnpx @choewy/whisper --help
```

## API

### `new Whisper(options?)`

Creates a `Whisper` instance.

`WhisperOptions`:

| Option           | Type                                                                                                                      | Default\* | Description                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------- |
| `model`          | `'tiny' \| 'tiny.en' \| 'base' \| 'base.en' \| 'small' \| 'small.en' \| 'medium' \| 'medium.en' \| 'large' \| 'large-v1'` | `'base'`  | Whisper model name                           |
| `gpu`            | `boolean`                                                                                                                 | `false`   | Enable GPU execution                         |
| `gpuDevice`      | `number`                                                                                                                  | `0`       | GPU device index (requires GPU)              |
| `flashAttention` | `boolean`                                                                                                                 | `false`   | Enable flash-attention flag                  |
| `debug`          | `boolean`                                                                                                                 | `true`    | Print subprocess stdout/stderr               |
| `async`          | `boolean`                                                                                                                 | `true`    | Reserved option (no external behavior today) |

\*Defaults apply only when `new Whisper()` is called with no arguments.

Note: this constructor does not merge partial options with defaults. If you pass an object, provide all options you rely on.

### `await whisper.initialize(): Promise<Whisper>`

- Verifies model name
- Downloads the selected model if missing
- Compiles `whisper.cpp` (`make`) when needed

### `await whisper.transcribe(input, options?): Promise<WhisperTranscriptLine[]>`

- `input`: path to an audio file
- `options`: whisper command options

`WhisperCppCommandInputOptions`:

| Option                 | Type      | Flag        | Description                      |
| ---------------------- | --------- | ----------- | -------------------------------- |
| `generateFileText`     | `boolean` | `-otxt`     | Generate `.txt` output           |
| `generateFileSubtitle` | `boolean` | `-osrt`     | Generate `.srt` output           |
| `generateFileVtt`      | `boolean` | `-ovtt`     | Generate `.vtt` output           |
| `timestampSize`        | `number`  | `-ml N`     | Segment length control           |
| `wordTimestamps`       | `boolean` | `-ml 1`     | Very fine-grained segmentation   |
| `language`             | `string`  | `-l <lang>` | Language code (`auto` supported) |

Constraints:

- `timestampSize` and `wordTimestamps` cannot be used together
- `gpuDevice` requires `gpu: true`

Return type:

```ts
type WhisperTranscriptLine = {
  start: string;
  end: string;
  speech: string;
};
```

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

## Notes

- `transcribe()` executes `whisper-cli` as a subprocess.
- This wrapper exposes only part of `whisper.cpp` CLI options.
- For advanced flags and behavior, see upstream docs:
  - <https://github.com/ggml-org/whisper.cpp>
  - <https://github.com/ggml-org/whisper.cpp/tree/master/examples/cli>

## Troubleshooting

### `Command not found: make`

Install `make` and build tools on your system.

### Model download failed

Install at least one of `curl`, `wget`, `wget2` and check network/proxy settings.

### GPU device option error

Do not set `gpuDevice` when `gpu` is `false`.

## License

[MIT](./LICENSE)
