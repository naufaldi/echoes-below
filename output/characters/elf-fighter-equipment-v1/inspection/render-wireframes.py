"""Render the archived GLB triangles without regenerating or changing the assets.

Requires Python 3 and Pillow. Camera angles rotate around the exported Y axis.
"""
import json
import math
from pathlib import Path
import struct

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent


def read_triangles(path):
    raw = path.read_bytes()
    magic, version, length = struct.unpack_from('<III', raw)
    assert (magic, version, length) == (0x46546C67, 2, len(raw))
    size, kind = struct.unpack_from('<II', raw, 12)
    assert kind == 0x4E4F534A
    doc = json.loads(raw[20:20 + size])
    binary = raw[28 + size:]
    assert len(doc['nodes']) == len(doc['meshes']) == 1
    node = doc['nodes'][0]
    assert node.get('translation', [0, 0, 0]) == [0, 0, 0]
    assert node.get('rotation', [0, 0, 0, 1]) == [0, 0, 0, 1]
    assert node.get('scale', [1, 1, 1]) == [1, 1, 1]

    def accessor(index):
        acc = doc['accessors'][index]
        view = doc['bufferViews'][acc['bufferView']]
        fmt = {5123: 'H', 5125: 'I', 5126: 'f'}[acc['componentType']]
        width = {'SCALAR': 1, 'VEC3': 3}[acc['type']]
        stride = view.get('byteStride', struct.calcsize('<' + fmt * width))
        offset = view.get('byteOffset', 0) + acc.get('byteOffset', 0)
        return [struct.unpack_from('<' + fmt * width, binary, offset + i * stride)
                for i in range(acc['count'])]

    triangles = []
    for primitive in doc['meshes'][0]['primitives']:
        assert primitive.get('mode', 4) == 4
        vertices = accessor(primitive['attributes']['POSITION'])
        indices = [i[0] for i in accessor(primitive['indices'])]
        assert len(indices) % 3 == 0
        triangles.extend([[vertices[i] for i in indices[start:start + 3]]
                          for start in range(0, len(indices), 3)])
    return triangles


if __name__ == '__main__':
    sheet = Image.new('RGB', (1600, 1100), '#f5f5f2')
    draw = ImageDraw.Draw(sheet)
    title = ImageFont.load_default(size=27)
    label = ImageFont.load_default(size=21)
    draw.text((35, 22), 'Historical Fighter props: actual exported geometry',
              font=title, fill='#202428')
    draw.text((35, 62), 'Local orthographic wireframe render | all triangle edges | not a Studio screenshot',
              font=label, fill='#44484c')
    for row, filename in enumerate(['sword.glb', 'shield.glb']):
        triangles = read_triangles(OUT / filename)
        points = [p for triangle in triangles for p in triangle]
        center_y = (min(p[1] for p in points) + max(p[1] for p in points)) / 2
        scale = 330 / (max(p[1] for p in points) - min(p[1] for p in points))
        top = 115 + row * 475
        draw.text((35, top), f'{filename}: 0 quads, {len(triangles)} triangles (GLB topology)',
                  font=label, fill='#202428')
        for column, angle in enumerate([0, 45, 90, 180]):
            radians = math.radians(angle)
            cx, cy = 200 + column * 400, top + 225

            def project(point):
                x, y, z = point
                return (cx + (x * math.cos(radians) - z * math.sin(radians)) * scale,
                        cy - (y - center_y) * scale)

            for triangle in triangles:
                projected = [project(p) for p in triangle]
                draw.line(projected + [projected[0]], fill='#234f64', width=1)
            draw.text((cx - 32, top + 415), f'{angle} deg', font=label, fill='#202428')
    draw.text((35, 1060), 'Front = +Z at 0 deg. Orthographic views share a scale within each asset row.',
              font=label, fill='#44484c')
    path = OUT / 'geometry-four-views.png'
    sheet.save(path)
    print(path)
