import { Whisper } from './whisper';

async function main() {
  const whisper = new Whisper({ model: 'small', gpu: false, flashAttention: false });
  await whisper.initialize();

  const result = await whisper.transcribe('./test/audio.wav', {
    language: 'auto',
    timestampSize: 30,
  });

  console.log(result);
}

void main();
