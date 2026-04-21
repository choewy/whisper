import { WhisperModelDownloader } from './downloader';
import { WhisperModel } from './model';
import { Whisper } from './whisper';

async function main() {
  await new WhisperModelDownloader().run(WhisperModel.SMALL.name);
  const result = await new Whisper().transcribe('./audio.wav', {
    language: 'auto',
  });

  console.log(result);
}

void main();
