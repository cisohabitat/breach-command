"""Build-time only: pip install kokoro-onnx==0.6.1 soundfile; install FFmpeg."""
import argparse
import json
import re
import subprocess
from pathlib import Path

import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--model', required=True, type=Path)
parser.add_argument('--voices', required=True, type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
out = root / 'public/audio/captain'
out.mkdir(parents=True, exist_ok=True)
catalogue = (root / 'lib/i18n/en/captain-voice.ts').read_text()
lines = dict(re.findall(r'"captainVoice\.([A-Za-z0-9]+)": "([^"]+)"', catalogue))
for control in ['captain', 'listen', 'skip', 'unavailable']:
    lines.pop(control, None)
settings = {'model': 'hexgrad/Kokoro-82M', 'voice': 'bm_george', 'speed': 0.94, 'language': 'en-gb'}
manifest_path = out / 'manifest.json'
previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
unchanged_settings = all(previous.get(key) == value for key, value in settings.items())
manifest = {**settings, 'clips': {}}
options = ort.SessionOptions()
options.intra_op_num_threads = 2
options.inter_op_num_threads = 1
session = ort.InferenceSession(str(args.model), sess_options=options, providers=['CPUExecutionProvider'])
engine = Kokoro.from_session(session, str(args.voices))
for cue, text in lines.items():
    old = previous.get('clips', {}).get(cue, {})
    target = out / (cue + '.mp3')
    if unchanged_settings and old.get('text') == text and target.exists():
        manifest['clips'][cue] = old
        continue
    samples, rate = engine.create(text, voice=settings['voice'], speed=settings['speed'], lang=settings['language'])
    # Keep intermediate WAVs outside the shipped audio directory.
    import tempfile
    with tempfile.TemporaryDirectory() as temporary:
        wav = Path(temporary) / 'clip.wav'
        sf.write(wav, samples, rate)
        subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', str(wav), '-af', 'loudnorm=I=-18:TP=-2:LRA=7', '-ar', '24000', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '64k', str(target)], check=True)
    duration = round(len(samples) / rate, 2)
    if duration >= 20:
        raise ValueError(f'{cue} is too long for a short Captain update: {duration}s')
    manifest['clips'][cue] = {'text': text, 'durationSeconds': duration}
    print(cue, duration, flush=True)
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
