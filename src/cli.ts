#!/usr/bin/env node

import { WhisperModelDownloader } from './downloader';

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'download':
      await new WhisperModelDownloader().runWithPrompt();
      return;

    case '--help':
    case '-h':
    case 'help':
      console.log('Usage: npx @choewy/whisper download or pnpx @choewy/whisper download');
      return;
  }

  throw new Error(`[@choewy/whisper] Unknown command "${command}". Usage: npx @choewy/whisper download`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
