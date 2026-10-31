"""Local-only audio worker. JSONL on stdin/stdout; no microphones, URLs or files
supplied by the browser. Audio stays in memory and no transcript is logged."""
import base64
import io
import json
import os
import sys
import wave
import av

os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
from faster_whisper import WhisperModel
from piper import PiperVoice, SynthesisConfig

with open(sys.argv[1], encoding='utf-8-sig') as stream:
    config = json.load(stream)
whisper = None
voices = {}
for line in sys.stdin:
    if len(line) > 8 * 1024 * 1024:
        continue
    try:
        request = json.loads(line)
        if request['operation'] == 'transcribe':
            audio = base64.b64decode(request['audio'], validate=True)
            if len(audio) > 3 * 1024 * 1024:
                raise ValueError('audio demasiado grande')
            with av.open(io.BytesIO(audio), mode='r') as container:
                if container.duration and container.duration > 30 * av.time_base:
                    raise ValueError('audio demasiado largo')
            if whisper is None:
                whisper = WhisperModel(config['sttModel'], device='cpu', compute_type='int8', cpu_threads=4, local_files_only=True)
            segments, info = whisper.transcribe(io.BytesIO(audio), language='es', beam_size=3, vad_filter=True, condition_on_previous_text=False,
                initial_prompt='Conversación en español. Lina. Camilo. Santi. Cata. Vale. Nico. Pipe.')
            text = ' '.join(s.text.strip() for s in segments if s.no_speech_prob < .65).strip()
            result = {'text':text[:4000], 'language':'es', 'provider':'local-whisper'}
        elif request['operation'] == 'speak':
            key = request['voice']
            if key not in config['voices'] or len(request['text']) > 1800:
                raise ValueError('voz o texto no permitido')
            rate = float(request.get('rate', 1))
            if not .75 <= rate <= 1.25:
                raise ValueError('velocidad no permitida')
            if key not in voices:
                voices[key] = PiperVoice.load(config['voices'][key]['model'])
            output = io.BytesIO()
            with wave.open(output, 'wb') as wav:
                voices[key].synthesize_wav(request['text'], wav, syn_config=SynthesisConfig(length_scale=1/rate))
            result = {'audio':base64.b64encode(output.getvalue()).decode('ascii')}
        else:
            raise ValueError('operación no permitida')
        print(json.dumps({'id':request['id'], 'result':result}, ensure_ascii=False), flush=True)
    except Exception:
        # Never expose model paths, arbitrary exception text, audio or credentials.
        print(json.dumps({'id':locals().get('request',{}).get('id'), 'error':'No se pudo procesar el audio local.'}), flush=True)
