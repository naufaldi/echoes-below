import os
import bpy,os,json
from mathutils import Vector
r=os.path.join(os.environ['ECHO_ROGUE_WORKDIR'],'archer-motion-prototype-v6c');os.makedirs(r+'/frames',exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene;s.render.fps=30
bpy.ops.import_scene.gltf(filepath=r+'/elf-rogue-weapon-fix.glb')
print('ACTIONS',[(a.name,len(a.fcurves)) for a in bpy.data.actions]);s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='FLAT';s.display.shading.color_type='TEXTURE';s.display.shading.show_cavity=False;s.display.shading.show_shadows=False;s.display.shading.background_type='WORLD';s.world=bpy.data.worlds.new('Neutral');s.world.color=(.5,.5,.5);s.view_settings.view_transform='Standard';s.render.resolution_x=700;s.render.resolution_y=700;s.render.resolution_percentage=100
bpy.ops.object.camera_add();c=bpy.context.object;s.camera=c;c.data.type='ORTHO';c.data.ortho_scale=1.12;t=Vector((0,0,.44));c.location=t+Vector((-1,-1,.35));c.rotation_euler=(t-c.location).to_track_quat('-Z','Y').to_euler()

records=[]
for clip in ['Attack_Ranged','Idle','Walk','Attack_Melee','Hit','Dodge','Death','Use_Item']:
 t=Vector((0,.30,.22)) if clip=='Death' else Vector((0,0,.44));c.location=t+Vector((-1,-1,.35));c.rotation_euler=(t-c.location).to_track_quat('-Z','Y').to_euler();c.data.ortho_scale=1.35 if clip=='Death' else 1.12
 for o in list(s.objects)+[o.data.shape_keys for o in s.objects if o.type=='MESH' and o.data.shape_keys]:
  if not o.animation_data:continue
  for tr in o.animation_data.nla_tracks:tr.mute=True
  action=next((st.action for tr in o.animation_data.nla_tracks if tr.name==clip for st in tr.strips),None);o.animation_data.action=action
 os.makedirs(r+'/'+clip,exist_ok=True)
 for fr in range(0, (18 if clip=='Hit' else 24 if clip=='Dodge' else 30)+1,3):
  s.frame_set(fr);bpy.context.view_layer.update();s.render.filepath=r+'/'+clip+'/'+str(fr//3).zfill(4)+'.png';bpy.ops.render.render(write_still=True)
  ch=bpy.data.objects['Elf_Rogue_Static_Grip'];ev=ch.evaluated_get(bpy.context.evaluated_depsgraph_get());me=ev.to_mesh();zs=[(ev.matrix_world@v.co).z for v in me.vertices];records.append({'clip':clip,'frame':fr,'bodyMinZ':min(zs),'bodyMaxZ':max(zs)});ev.to_mesh_clear()
 s.frame_start=0;s.frame_end=18 if clip=='Hit' else 24 if clip=='Dodge' else 30;bpy.ops.wm.save_as_mainfile(filepath=r+'/'+clip+'-roundtrip.blend')
json.dump(records,open(r+'/roundtrip-body-bounds.json','w'),indent=2)
