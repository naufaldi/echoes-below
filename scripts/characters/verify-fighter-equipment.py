"""Verify the isolated equipment deliverables; does not certify the absent Fighter.

Run from any directory with Python 3. No third-party dependency required.
"""
import hashlib
import json
import math
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/characters/elf-fighter-equipment-v1'


def audit(filename, expected_name):
    path = OUT / filename
    raw = path.read_bytes()
    magic, version, length = struct.unpack_from('<III', raw)
    assert magic == 0x46546C67 and version == 2 and length == len(raw)
    size, kind = struct.unpack_from('<II', raw, 12)
    assert kind == 0x4E4F534A
    doc = json.loads(raw[20:20+size])
    binary_size, binary_kind = struct.unpack_from('<II', raw, 20+size)
    assert binary_kind == 0x004E4942
    binary = raw[28+size:]
    assert len(binary) == binary_size
    assert len(doc['nodes']) == len(doc['meshes']) == 1
    node = doc['nodes'][0]
    assert node['name'] == expected_name and node['mesh'] == 0
    assert node.get('translation', [0,0,0]) == [0,0,0]
    assert node.get('rotation', [0,0,0,1]) == [0,0,0,1]
    assert node.get('scale', [1,1,1]) == [1,1,1]
    assert not any(doc.get(k) for k in ['skins','animations','cameras','images','textures'])
    assert not any('uri' in b for b in doc['buffers'])
    assert not doc.get('extensionsRequired')

    def accessor(index):
        acc = doc['accessors'][index]
        view = doc['bufferViews'][acc['bufferView']]
        fmt = {5123:'H',5125:'I',5126:'f'}[acc['componentType']]
        width = {'SCALAR':1,'VEC3':3}[acc['type']]
        item_size = struct.calcsize('<'+fmt*width)
        stride = view.get('byteStride',item_size)
        offset = view.get('byteOffset',0) + acc.get('byteOffset',0)
        return [struct.unpack_from('<'+fmt*width,binary,offset+i*stride)
                for i in range(acc['count'])]

    triangles = 0
    positions = []
    for primitive in doc['meshes'][0]['primitives']:
        assert primitive.get('mode',4) == 4
        verts = accessor(primitive['attributes']['POSITION'])
        assert all(math.isfinite(v) for p in verts for v in p)
        indices = [i[0] for i in accessor(primitive['indices'])]
        assert len(indices) % 3 == 0
        for start in range(0,len(indices),3):
            a,b,c = [verts[i] for i in indices[start:start+3]]
            u = [b[i]-a[i] for i in range(3)]
            v = [c[i]-a[i] for i in range(3)]
            cross = [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
            assert sum(x*x for x in cross) > 1e-16, 'Degenerate triangle'
        triangles += len(indices)//3
        positions.extend(verts)
    assert triangles <= 1000 and len(raw) < 100_000
    bounds = [[min(p[i] for p in positions) for i in range(3)],
              [max(p[i] for p in positions) for i in range(3)]]
    assert all(bounds[0][i] < 0 < bounds[1][i] for i in range(3)), 'Grip must be inside bounds'
    names = [mat['name'] for mat in doc['materials']]
    if expected_name == 'Shield':
        assert 'Accent' in names
    return {'file':filename,'sha256':hashlib.sha256(raw).hexdigest(),
            'bytes':len(raw),'triangles':triangles,'meshes':1,
            'primitives':len(doc['meshes'][0]['primitives']),
            'skins':0,'joints':0,'animations':[], 'textures':0,
            'materials':names,'bounds_m':bounds,'node':expected_name}


if __name__ == '__main__':
    result = [audit('sword.glb','Weapon_Main'),audit('shield.glb','Shield')]
    manifest = json.loads((OUT/'manifest.json').read_text())
    for entry in manifest['files']:
        assert hashlib.sha256((OUT/entry['file']).read_bytes()).hexdigest() == entry['sha256'], entry['file']
    assert sum(x['triangles'] for x in result) <= 2000
    print(json.dumps(result,indent=2))
