"""Explicit setup only. Downloads public model files; runtime stays offline."""
import hashlib
import importlib.metadata
import json
from pathlib import Path
import sys
import urllib.request
from huggingface_hub import HfApi, snapshot_download

destination=Path(sys.argv[1]).resolve()
registry=Path(sys.argv[2]).resolve()
destination.mkdir(parents=True,exist_ok=True)
revision=HfApi().model_info('Systran/faster-whisper-base').sha
model=snapshot_download('Systran/faster-whisper-base',revision=revision,local_dir=destination/'whisper-base',allow_patterns=['config.json','model.bin','tokenizer.json','vocabulary.*'])
voice_revision=HfApi().model_info('rhasspy/piper-voices').sha
base=f'https://huggingface.co/rhasspy/piper-voices/resolve/{voice_revision}/'
with urllib.request.urlopen(base+'voices.json') as response:
    catalog=json.load(response)
voices={}
for key,model_key,name,language,timbre in [
    ('davefx','es_ES-davefx-medium','Davefx · español de España','es-ES','masculina'),
    ('daniela','es_AR-daniela-high','Daniela · español de Argentina','es-AR','femenina'),
]:
    folder=destination/key
    folder.mkdir(exist_ok=True)
    for relative,metadata in catalog[model_key]['files'].items():
        target=folder/Path(relative).name
        if not target.exists() or hashlib.md5(target.read_bytes()).hexdigest()!=metadata['md5_digest']:
            urllib.request.urlretrieve(base+relative,target)
        if hashlib.md5(target.read_bytes()).hexdigest()!=metadata['md5_digest']:
            raise RuntimeError('El modelo no coincide con el catálogo publicado')
    voices[key]={'model':str(folder/(model_key+'.onnx')),'name':name,'language':language,'timbre':timbre}
registry.parent.mkdir(parents=True,exist_ok=True)
registry.write_text(json.dumps({'python':sys.executable,'sttModel':str(model),'sttRevision':revision,'voiceRevision':voice_revision,'voices':voices,
    'packages':{package:importlib.metadata.version(package) for package in ['faster-whisper','piper-tts','ctranslate2','onnxruntime','av']}},ensure_ascii=False,indent=2),encoding='utf-8')
print('Modelos locales instalados: Whisper base, Davefx y Daniela. Sin credenciales ni API de pago.')
