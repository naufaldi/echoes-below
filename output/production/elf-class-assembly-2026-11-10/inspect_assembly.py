"""Audit a downloaded Studio GLB and render its actual triangle geometry.

No assembly or model editing occurs here. Output images are local inspection
renders, distinct from direct Tripo Studio screenshots and Lab reports.
"""
import hashlib, io, json, math, struct, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

def load(path):
    data=path.read_bytes()
    assert data[:4]==b'glTF'
    size=struct.unpack_from('<I',data,12)[0]
    doc=json.loads(data[20:20+size]); binary=data[28+size:]
    def view(index):
        v=doc['bufferViews'][index]; start=v.get('byteOffset',0)
        return binary[start:start+v['byteLength']]
    def accessor(index):
        a=doc['accessors'][index]; v=doc['bufferViews'][a['bufferView']]
        fmt={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']]
        width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
        fmt='<'+fmt*width; stride=v.get('byteStride',struct.calcsize(fmt))
        raw=view(a['bufferView']); start=a.get('byteOffset',0)
        return [struct.unpack_from(fmt,raw,start+i*stride) for i in range(a['count'])]
    return doc,view,accessor

def main():
    source=Path(sys.argv[1]); out=source.parent
    doc,view,accessor=load(source)
    # Current Studio exports bake transforms. Refuse other scenes instead of
    # silently rendering them with their node transforms discarded.
    assert all(not any(k in n for k in ['matrix','translation','rotation','scale']) for n in doc['nodes']), 'Scene needs transform-aware rendering'
    vertices=[]; faces=[]; mesh_audit=[]
    for mesh in doc['meshes']:
        tris=0; count=0
        for p in mesh['primitives']:
            assert p.get('mode',4)==4
            pos=accessor(p['attributes']['POSITION']); indices=[v[0] for v in accessor(p['indices'])]
            offset=len(vertices); vertices.extend(pos)
            faces.extend(tuple(offset+i for i in indices[j:j+3]) for j in range(0,len(indices),3))
            tris+=len(indices)//3; count+=len(pos)
        mesh_audit.append({'name':mesh.get('name'),'triangles':tris,'vertices':count})
    images=[]
    for im in doc.get('images',[]):
        raw=view(im['bufferView']); img=Image.open(io.BytesIO(raw))
        images.append({'name':im.get('name'),'sha256':hashlib.sha256(raw).hexdigest(),'size':list(img.size)})
    audit={'file':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'triangles':len(faces),'vertices':len(vertices),'meshes':mesh_audit,'materials':len(doc.get('materials',[])),'images':images,'skins':len(doc.get('skins',[])),'animations':len(doc.get('animations',[])),'nodes':doc['nodes'],'provenance':'Downloaded Tripo Studio export, audited locally. Lab preservation report describes the pre-export assembly; Studio export may normalize, weld vertices and re-encode data.'}
    (out/'downloaded-glb-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
    # Studio re-export turns the original -Z-facing model to -X. Rotate only
    # the inspection camera basis; never write altered model data.
    vertices=[(z,y,-x) for x,y,z in vertices]
    lo=[min(v[a] for v in vertices) for a in range(3)]; hi=[max(v[a] for v in vertices) for a in range(3)]
    center=[(a+b)/2 for a,b in zip(lo,hi)]
    vertices=[tuple(v[a]-center[a] for a in range(3)) for v in vertices]
    angles=[0,45,90,180]
    views=[[(x*math.cos(math.radians(d))+z*math.sin(math.radians(d)),y,-x*math.sin(math.radians(d))+z*math.cos(math.radians(d))) for x,y,z in vertices] for d in angles]
    width=max(max(v[0] for v in vs)-min(v[0] for v in vs) for vs in views)
    scale=min(790/(hi[1]-lo[1]),630/width)
    im=Image.new('RGB',(2800,1100),'#edf0f2'); draw=ImageDraw.Draw(im)
    font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',23)
    for col,(degrees,vs) in enumerate(zip(angles,views)):
        for f in sorted(faces,key=lambda f:sum(vs[i][2] for i in f)/3):
            points=[(col*700+350+vs[i][0]*scale,510-vs[i][1]*scale) for i in f]
            draw.polygon(points,fill='#c9cccf',outline='#5c6670',width=1)
        draw.text((col*700+280,30),f'{degrees} degrees',font=font,fill='#364453')
    draw.text((35,990),f'Actual downloaded Tripo GLB geometry | {len(faces):,} triangles | untextured inspection',font=font,fill='#364453')
    draw.text((35,1030),'Local orthographic inspection render — not a Tripo Studio screenshot',font=font,fill='#647487')
    im.save(out/'geometry-four-views.png')
    print(json.dumps(audit))

if __name__=='__main__': main()
