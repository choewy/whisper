# Whisper

## Requirements

- Python 3.13.x

## Create venv

### MacOS

```zsh
python3 -m venv .venv
source .venv/bin/activate
```

### Windows

```bash
python -m venv .venv
.venv\Scripts\activate.bat
```

## Install dependencies

```zsh
pip install -r requirements.txt
```

## Run

### CLI

```zsh
python src/cli.py \
  --audio example/audio.wav \
  --script ""
```

### FastAPI

```zsh
cd src && uvicorn app:app --reload && cd ..
```
