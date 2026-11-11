"""Inspect original binary FBX polygons and render orthographic evidence sheets."""
import struct,zlib,json,math,sys,hashlib
from pathlib import Path
from collections import Counter
from PIL import Image,ImageDraw,ImageFont

def read_fbx(path):
    data=path.read_bytes();assert data.startswith(b'Kaydara FBX Binary')
    version=struct.unpack_from('<I',data,23)[0];wide=version>=7500
    header='<QQQB' if wide else '<IIIB';hs=25 if wide else 13
    def prop(pos):
        typ=chr(data[pos]);pos+=1
        types={'Y':'h','C':'?','I':'i','F':'f','D':'d','L':'q'}
        if typ in types:
            fmt='<'+types[typ];return struct.unpack_from(fmt,data,pos)[0],pos+struct.calcsize(fmt)
        if typ in 'fdlibc':
            count,encoding,size=struct.unpack_from('<III',data,pos);pos+=12
            raw=data[pos:pos+size];raw=zlib.decompress(raw) if encoding else raw
            fmt={'f':'f','d':'d','l':'q','i':'i','b':'b','c':'b'}[typ]
            return list(struct.unpack('<'+str(count)+fmt,raw)),pos+size
        if typ in 'SR':
            size=struct.unpack_from('<I',data,pos)[0];pos+=4;raw=data[pos:pos+size]
            return (raw.decode(errors='replace') if typ=='S' else raw),pos+size
        raise ValueError(typ)
    def node(pos):
        end,count,plen,nlen=struct.unpack_from(header,data,pos)
        if not end:return None,pos+hs
        pos+=hs;name=data[pos:pos+nlen].decode();pos+=nlen;props=[]
        for _ in range(count):v,pos=prop(pos);props.append(v)
        children=[]
        while pos<end-hs:
            child,pos=node(pos)
            if child:children.append(child)
        return {'name':name,'props':props,'children':children},end
    nodes=[];pos=27
    while pos<len(data)-hs:
        n,pos=node(pos)
        if not n:break
        nodes.append(n)
    meshes=[]
    def walk(n):
        if n['name']=='Geometry':
            children={c['name']:c['props'] for c in n['children']}
            if 'Vertices' in children and 'PolygonVertexIndex' in children:
                a=children['Vertices'][0];verts=[a[i:i+3] for i in range(0,len(a),3)];faces=[];face=[]
                for index in children['PolygonVertexIndex'][0]:
                    face.append(-index-1 if index<0 else index)
                    if index<0:faces.append(face);face=[]
                meshes.append((verts,faces))
        for c in n['children']:walk(c)
    for n in nodes:walk(n)
    return meshes

def main():
    source=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
    meshes=read_fbx(source);assert meshes,'No FBX geometry found'
    vertices=[];faces=[]
    for vs,fs in meshes:
        offset=len(vertices);vertices.extend(vs);faces.extend([[i+offset for i in f] for f in fs])
    counts=Counter(map(len,faces))
    audit={'source':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'control_vertices':len(vertices),'polygons':len(faces),'quads':counts[4],'triangles':counts[3],'other_polygons':sum(v for k,v in counts.items() if k not in [3,4]),'triangulated':sum((k-2)*v for k,v in counts.items())}
    (out/'geometry-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
    # Tripo export vertex coordinates are Y-up, including the Blender preset.
    vertices=[(x,y,z) for x,y,z in vertices]
    lo=[min(v[a] for v in vertices) for a in range(3)];hi=[max(v[a] for v in vertices) for a in range(3)]
    center=[(a+b)/2 for a,b in zip(lo,hi)];vertices=[tuple(v[a]-center[a] for a in range(3)) for v in vertices]
    widths=[]
    for angle in [0,math.pi/4,math.pi/2,math.pi]:
        xs=[x*math.cos(angle)+z*math.sin(angle) for x,y,z in vertices]
        widths.append(max(xs)-min(xs))
    scale=min(820/(hi[1]-lo[1]),610/max(widths))
    im=Image.new('RGB',(2800,1100),'#edf0f2');draw=ImageDraw.Draw(im)
    font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',23)
    for col,degrees in enumerate([0,45,90,180]):
        angle=math.radians(degrees);c,s=math.cos(angle),math.sin(angle)
        vs=[(x*c+z*s,y,-x*s+z*c) for x,y,z in vertices]
        for f in sorted(faces,key=lambda f:sum(vs[i][2] for i in f)/len(f)):
            points=[(col*700+350+vs[i][0]*scale,510-vs[i][1]*scale) for i in f]
            draw.polygon(points,fill='#c9cccf',outline='#5c6670',width=1)
        draw.text((col*700+280,30),f'{degrees} degrees',font=font,fill='#364453')
    draw.text((35,990),f"Actual Tripo FBX geometry | {audit['quads']} quads + {audit['triangles']} triangles | untextured",font=font,fill='#364453')
    draw.text((35,1030),'Local orthographic inspection render — not a Tripo Studio screenshot',font=font,fill='#647487')
    im.save(out/'geometry-four-views.png')
    print(json.dumps(audit))
if __name__=='__main__':main()
