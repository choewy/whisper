# @choewy/whisper

## install

```zsh
npm i @choewy/whisper
```

```zsh
pnpm i @choewy/whisper
```

## download

```zsh
npx @choewy/whisper download
```

```zsh
pnpx @choewy/whisper download
```

```bash
| Model     | Disk   | RAM      |
|-----------|--------|----------|
| tiny      |  75 MB | ~ 390 MB |
| tiny.en   |  75 MB | ~ 390 MB |
| base      | 142 MB | ~ 500 MB |
| base.en   | 142 MB | ~ 500 MB |
| small     | 466 MB | ~ 1.0 GB |
| small.en  | 466 MB | ~ 1.0 GB |
| medium    | 1.5 GB | ~ 2.6 GB |
| medium.en | 1.5 GB | ~ 2.6 GB |
| large     | 2.9 GB | ~ 4.7 GB |
| large-v1  | 2.9 GB | ~ 4.7 GB |

[@choewy/whisper] Enter model name (e.g. 'base.en') or 'cancel' to exit
(ENTER for base.en):
```

## usage

```ts
const whisper = new Whisper({ model: 'small', gpu: false, flashAttention: false });
await whisper.initialize();
```

```ts
const result = await whisper.transcribe('./audio.wav', { language: 'auto' });

console.log(result);
```

```json
[
  {
    "start": "00:00:03.880",
    "end": "00:00:09.400",
    "speech": "세 형제가 세상의 끝이라 불리던 그림자 강 앞에 도착했다."
  }
]
```
