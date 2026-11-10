from pathlib import Path
import hashlib, json, subprocess
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
EQ = ROOT / 'output/equipment/elf-fighter-v1'
CHAR = ROOT / 'output/characters/elf-fighter-v1'
FONT = '/System/Library/Fonts/Supplemental/Arial.ttf'
BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
scenes = [
    (EQ/'assembly-tripo-v1/studio-equipped-preview.png', 'Dari aset terpisah,', 'jadi satu elf fighter.', 'Karakter + sword + shield', 'HASIL DI TRIPO STUDIO', 5),
    (CHAR/'elf-fighter-front.png', 'Elf-nya udah ada.', 'Sekarang equipment-nya.', 'Mulai dari karakter berarmor.', 'GAMBAR REFERENSI', 5),
    (EQ/'sword-reference-v1.png', 'Bikin gambar', 'sword-nya dulu.', 'Gambar referensi jadi input Tripo.', 'GAMBAR REFERENSI', 5),
    (EQ/'sword-textured-front.png', 'Lalu jadi', 'aset 3D di Tripo.', 'Sword dengan bentuk dan teksturnya.', 'SCREENSHOT TRIPO STUDIO', 5),
    (EQ/'shield/03-studio-front.png', 'Shield-nya', 'juga udah siap.', 'Tiga aset. Satu karakter fighter.', 'SCREENSHOT TRIPO STUDIO', 5),
    (EQ/'assembly-tripo-v1/inspection-proof.png', 'Masuk AI 3D Lab.', 'Minta pasang equipment.', 'Sword di kanan. Shield di kiri.', 'BUKTI INSTRUKSI / INSPEKSI', 6),
    (EQ/'assembly-tripo-v1/studio-equipped-preview.png', 'Dan ini', 'hasil gabungannya.', 'Eksperimen combine: 155 kredit.', 'HASIL DI TRIPO STUDIO', 5),
    (EQ/'assembly-tripo-v1/studio-equipped-preview.png', 'Next: rapihin grip', 'dan animasi di Blender.', 'Masih prototype. Lanjut buat game.', 'ECHOES BELOW / WORK IN PROGRESS', 5),
]

def run(args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL)

for i, (source, title, title2, caption, label, duration) in enumerate(scenes):
    overlay = Image.new('RGBA', (1080,1920), (0,0,0,0))
    d = ImageDraw.Draw(overlay)
    def text(x,y,s,size,color='#F5F3EB',bold=False):
        d.text((x,y),s,font=ImageFont.truetype(BOLD if bold else FONT,size),fill=color)
    text(72,100,'ECHOES BELOW',27,'#CAB67C',True)
    text(72,192,title,64,bold=True)
    text(72,270,title2,64,bold=True)
    d.rounded_rectangle((72,389,1008,395),radius=3,fill='#CAB67C')
    text(72,1420,label,25,'#CAB67C',True)
    text(72,1490,caption,38)
    text(72,1600,'Codex + Tripo 3D',29,'#A7ABA8')
    text(900,1600,f'{i+1:02d} / 08',26,'#A7ABA8')
    for n in range(8):
        x=72+n*118
        d.rounded_rectangle((x,1700,x+100,1705),radius=2,fill='#CAB67C' if n<=i else '#353A38')
    card=HERE/f'caption-{i+1:02d}.png';overlay.save(card)
    filters=(
        '[0:v]scale=960:960:force_original_aspect_ratio=decrease,'
        'pad=960:960:(ow-iw)/2:(oh-ih)/2:color=0x121816,'
        'zoompan=z=1+0.00012*on:x=iw/2-iw/zoom/2:y=ih/2-ih/zoom/2:d=1:s=960x960:fps=30,'
        'pad=1080:1920:60:430:color=0x121816[base];'
        '[base][1:v]overlay=0:0,fade=t=in:st=0:d=0.25,'
        f'fade=t=out:st={duration-0.25}:d=0.25,format=yuv420p[v]'
    )
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-loop','1','-framerate','30','-i',str(source),'-loop','1','-i',str(card),'-filter_complex',filters,'-map','[v]','-t',str(duration),'-r','30','-c:v','libx264','-preset','veryfast','-crf','19','-threads','2',str(HERE/f'scene-{i+1:02d}.mp4')])
    print('Rendered scene',i+1,flush=True)

(HERE/'timeline.txt').write_text(''.join(f"file 'scene-{i+1:02d}.mp4'\n" for i in range(len(scenes))))
final=HERE/'elf-fighter-tripo-process-vertical-41s.mp4'
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(HERE/'timeline.txt'),'-c','copy','-movflags','+faststart',str(final)])
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss','32','-i',str(final),'-frames:v','1',str(HERE/'preview.jpg')])
(HERE/'README.md').write_text('''# Tripo process showcase v1

41-second vertical MP4, 1080x1920, 30fps, H.264. Silent, with Indonesian captions. This is an edited screenshot/reference montage with camera zoom, not a screen recording of assembly or animated model playback.

Sources are the original reference images and Tripo screenshots named in render.py. The inspection screenshot proves instructions and the inspection stage; it is not labelled as completed assembly. The equipped Studio screenshot shows the result. 155 credits covers inspection plus assembly. The result remains a prototype with grip and animation limitations.

No paid generation, public upload, game integration, or new Blender work was performed. Original assets are unchanged. Reproduce with Python/Pillow and ffmpeg using render.py. The caption PNGs are original typography overlays. All output files and source hashes are inventoried in manifest.json.
''')
rows=[]
for p in sorted(HERE.iterdir()):
    if p.is_file() and p.name!='manifest.json':
        rows.append({'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
sources=[{'file':str(s[0].relative_to(ROOT)),'sha256':hashlib.sha256(s[0].read_bytes()).hexdigest()} for s in scenes]
(HERE/'manifest.json').write_text(json.dumps({'files':rows,'sources':sources},indent=2)+'\n')
print(final,flush=True)
