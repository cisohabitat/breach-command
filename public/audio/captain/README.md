# Incident Captain recordings

Fifty original fictional scripts, matching `lib/i18n/en/captain-voice.ts`.
Rendered offline using [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M),
an Apache-2.0 licensed model, via kokoro-onnx 0.6.1 (MIT).
Voice: `bm_george`, British English, speed 0.94. This is a synthetic stock voice,
not a recording or imitation of a real incident commander.

Model conversion: [kokoro-onnx model-files-v1.1](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1),
`kokoro-v1.0.int8.onnx` and `voices-v1.0.bin`.
FFmpeg loudness normalization: -18 LUFS, -2 dB true peak, LRA 7;
24 kHz mono MP3, 64 kb/s. No runtime model, dependency, account or service.

`manifest.json` records voice settings, scripts and source duration. Regenerate
affected clips whenever the corresponding English transcript changes.

With Python dependencies and FFmpeg installed, run:

```sh
python scripts/render-captain-voice.py --model /path/to/kokoro-v1.0.int8.onnx --voices /path/to/voices-v1.0.bin
```

Unchanged recordings are preserved. The generator limits clips to 20 seconds
and records the voice settings, exact transcript and duration in the manifest.
