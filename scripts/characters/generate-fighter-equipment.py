"""Build original modular equipment for the archived Tripo Fighter direction.

blender --background --python scripts/characters/generate-fighter-equipment.py
Optional -- --render renders the exported GLBs, not the authoring geometry.
The Fighter body/rig is deliberately not recreated from reference screenshots.
"""
import math
from pathlib import Path
import sys

import bpy
import bmesh
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/characters/elf-fighter-equipment-v1'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, color, metal=0.0, roughness=0.65):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Metallic'].default_value = metal
    shader.inputs['Roughness'].default_value = roughness
    return mat


steel = material('Steel', (0.34, 0.36, 0.38), 0.55, 0.42)
edge = material('Steel_Edge', (0.53, 0.55, 0.56), 0.6, 0.35)
leather = material('Leather', (0.105, 0.070, 0.045))
accent = material('Accent', (0.86, 0.83, 0.76), 0.0, 0.85)


def mesh(name, verts, faces, mat):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.materials.append(mat)
    data.update()
    bm = bmesh.new()
    bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(data)
    bm.free()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return obj


def prism(name, outline, front, back, mat):
    # Outline is X/Z in Blender. Front is -Y (exports as glTF +Z).
    n = len(outline)
    verts = [(x, y, z) for y in (front, back) for x, z in outline]
    faces = [tuple(range(n)), tuple(range(n, 2*n))]
    faces += [(i, (i+1) % n, (i+1) % n+n, i+n) for i in range(n)]
    return mesh(name, verts, faces, mat)


def cylinder(name, radius, depth, location, mat, vertices=8, rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius,
                                      depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    if rotation:
        obj.rotation_euler = rotation
    obj.data.materials.append(mat)
    return obj


def join_export(objects, name, filename):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name
    bpy.context.scene.cursor.location = (0, 0, 0)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.export_scene.gltf(filepath=str(OUT / filename), export_format='GLB',
                              use_selection=True, export_yup=True,
                              export_animations=False, export_texcoords=False)
    return obj


# Grip at origin, blade along Blender +Z (glTF +Y). Diamond blade section.
verts = []
for height, width, thickness in [(0.10, 0.052, 0.014), (0.57, 0.038, 0.011)]:
    verts.extend([(-width, 0, height), (0, -thickness, height),
                  (width, 0, height), (0, thickness, height)])
verts.append((0, 0, 0.72))
faces = [(3, 2, 1, 0)]
faces += [(i, (i+1) % 4, (i+1) % 4+4, i+4) for i in range(4)]
faces += [(4+i, 4+(i+1) % 4, 8) for i in range(4)]
blade = mesh('blade', verts, faces, steel)
blade.data.materials.append(edge)
for poly in blade.data.polygons:
    poly.material_index = poly.index % 2
parts = [blade]
parts.append(prism('guard', [(-.145,.075),(-.15,.105),(-.07,.135),
                            (.07,.135),(.15,.105),(.145,.075),
                            (.06,.095),(-.06,.095)], -.026,.026,steel))
parts.append(cylinder('grip', .026, .17, (0,0,0), leather))
for z in [-.075,-.05,-.025,0,.025,.05,.075]:
    parts.append(cylinder('wrap', .028, .006, (0,0,z), leather))
parts.append(cylinder('pommel', .041, .045, (0,0,-.108), steel))
parts.append(cylinder('collar', .034, .022, (0,0,.084), edge))
join_export(parts, 'Weapon_Main', 'sword.glb')

# Rounded heater outline, steel border, light cloth panel, rear leather grip.
outline = [(-.19,.32),(-.26,.25),(-.25,-.04),(-.18,-.20),
           (0,-.33),(.18,-.20),(.25,-.04),(.26,.25),(.19,.32)]
parts = [prism('shield_body', outline, -.120, -.070, steel)]
inner = [(x*.84,z*.87) for x,z in outline]
parts.append(prism('cloth_panel', inner, -.126, -.121, accent))
# A broad steel boss and a low crest retain the steel/leather design vocabulary.
parts.append(cylinder('boss', .065, .025, (0,-.139,.045), steel,
                      rotation=(math.pi/2,0,0)))
parts.append(prism('crest', [(-.018,.26),(.018,.26),(.018,.105),
                            (0,.08),(-.018,.105)], -.136,-.127,edge))
parts.append(cylinder('grip', .022,.17,(0,0,0),leather))
for z in [-.10,.10]:
    parts.append(cylinder('grip_mount',.035,.100,(0,-.027,z),leather,
                          rotation=(math.pi/2,0,0)))
for x,z in [(-.205,.22),(.205,.22),(-.17,-.14),(.17,-.14),(0,-.285)]:
    parts.append(cylinder('rivet',.012,.013,(x,-.127,z),edge,
                          rotation=(math.pi/2,0,0)))
join_export(parts, 'Shield', 'shield.glb')

if '--render' in sys.argv:
    # Round trip the files and stage those actual exports for inspection.
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for filename, x in [('sword.glb',-.53),('shield.glb',0.02),('shield.glb',.68)]:
        bpy.ops.import_scene.gltf(filepath=str(OUT / filename))
        obj = bpy.context.selected_objects[0]
        obj.location = (x,0,.35 if filename=='sword.glb' else .55)
        if x > .6:
            obj.rotation_mode = 'XYZ'
            obj.rotation_euler.z = math.pi
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 64
    scene.cycles.use_denoising = False
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 800
    scene.render.resolution_percentage = 100
    scene.world = bpy.data.worlds.new('Studio')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.14,.14,.14,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = .65
    for location, power, size in [((-3,-4,5),450,4),((3,-1,3),250,3),((0,3,4),350,3)]:
        bpy.ops.object.light_add(type='AREA', location=location)
        light = bpy.context.object
        light.data.energy = power
        light.data.shape = 'DISK'
        light.data.size = size
        light.rotation_euler = (Vector((0,0,.5))-light.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(1.8,-5,2.3))
    camera = bpy.context.object
    camera.rotation_euler = (Vector((.1,0,.58))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = 2.0
    scene.camera = camera
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = str(OUT/'equipment-preview.png')
    bpy.ops.render.render(write_still=True)
