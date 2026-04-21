import { WhisperModelDownloader } from './downloader';
import { WhisperModel } from './model';
import { Whisper } from './whisper';

async function main() {
  await new WhisperModelDownloader().run(WhisperModel.SMALL.name);
  const result = await new Whisper().transcribe('./audio.wav', {
    modelName: WhisperModel.SMALL.name,
    commandOptions: {
      useGpu: false,
      flashAttention: false,
      language: 'auto',
    },
  });

  console.log(result);
}

void main();
