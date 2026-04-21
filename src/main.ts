import { Whisper } from '@choewy/whisper';

async function main() {
  const whisper = new Whisper({
    model: 'small',
    gpu: false,
    flashAttention: false,
    debug: true,
  });

  await whisper.initialize();
  const result = await whisper.transcribe('./test/audio.wav', { language: 'auto' });
  console.log(result);
}

void main();
