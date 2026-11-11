import os
import bpy,math,os,json
from mathutils import Vector,Matrix
r=os.environ['ECHO_ROGUE_WORKDIR'];out=r+'/archer-motion-prototype-v6c';os.makedirs(out,exist_ok=True);bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene;s.render.fps=30;bpy.ops.import_scene.gltf(filepath=r+'/archer-motion-prototype-v5/elf-rogue-contract-prototype.glb');root=bpy.data.objects['Elf_Rogue_Prototype'];arm=bpy.data.objects['PROTOTYPE_partial_right_arm'];bow=bpy.data.objects['Weapon_Main'];dagger=bpy.data.objects['Weapon_Off'];wire=bpy.data.objects['Bowstring_Prototype'];arrow=bpy.data.objects['Arrow_Nocked_Prototype'];s.frame_set(18);bpy.context.view_layer.update()
# The former bow's rest-string/grip vector was almost perpendicular to the draw.
pts=[wire.matrix_world@v.co for v in wire.data.vertices];lo=min(p.z for p in pts);hi=max(p.z for p in pts);mid=(lo+hi)/2;ids=[i for i,p in enumerate(pts)if abs(p.z-mid)<.01];chord=sum((pts[i]for i in ids),Vector())/len(ids);bpts=[bow.matrix_world@v.co for v in bow.data.vertices];sel=[p for p in bpts if .405<p.z<.435];grip=sum(sel,Vector())/len(sel);hand=arm.pose.bones['Hand_R'];nock=arm.matrix_world@hand.head.lerp(hand.tail,.48);desired=(grip-nock);desired.z=0;g=grip-chord;g.z=0;angle=math.atan2(desired.y,desired.x)-math.atan2(g.y,g.x);rot=Matrix.Rotation(angle,3,'Z');transform=Matrix.Translation(grip)@rot.to_4x4()@Matrix.Translation(-grip)
for v in bow.data.vertices:v.co=bow.matrix_world.inverted()@(transform@(bow.matrix_world@v.co))
# Rebuild only bowstring deformation around the now-correct rest plane.
wire.shape_key_clear()
for v in wire.data.vertices:v.co=wire.matrix_world.inverted()@(transform@(wire.matrix_world@v.co))
wire.shape_key_add(name='Basis');axes=[]
for i,axis in enumerate('XYZ'):
 k=wire.shape_key_add(name='Draw_'+axis);k.slider_min=-1;k.slider_max=1
 for vi in ids:k.data[vi].co[i]+=[.08,.4,.1][i]
 axes.append(k)
restcentre=sum((wire.data.vertices[i].co for i in ids),Vector())/len(ids);bowbind=bow.matrix_world.copy();wirebind=wire.matrix_world.copy();restworld=wire.matrix_world@restcentre
# Arrow goes through the rest ABOVE the grip, not toward the old rest-string centre.
arrowrest=Vector((grip.x-.004,grip.y,.477));socket=bpy.data.objects['Arrow_Release'];socket.matrix_world=Matrix.Translation(arrowrest);socketlocal=bowbind.inverted()@arrowrest
for v in arrow.data.vertices:v.co.z*=1.45
# Shorten blade only, retain Tripo hilt and grip diameter.
oldD=dagger.matrix_world.copy();handle=Vector((-.1195474,.1230637,.3295964))
for v in dagger.data.vertices:
 p=oldD@v.co
 if p.z<.29:
  p.z=.29+.65*(p.z-.29);p.x=handle.x+.6*(p.x-handle.x);p.y=handle.y+.6*(p.y-handle.y)
 v.co=p-handle
hiphandle=Vector((.10,.19,.33));hipbind=arm.matrix_world@arm.pose.bones['Hips'].matrix
# Explicit modeled leather sheath with open rim, plus visible belt attachment.
verts=[];ring=[(1,.65),(.65,1),(-.65,1),(-1,.65),(-1,-.65),(-.65,-1),(.65,-1),(1,-.65)]
for z,wx,wy in [(-.055,.017,.040),(-.115,.015,.036),(-.190,.006,.009),(-.055,.0135,.035),(-.085,.0135,.034)]:
 for x,y in ring:verts.append((x*wx,y*wy,z))
faces=[]
for a,b in [(0,1),(1,2),(0,3),(3,4)]:
 for i in range(8):faces.append((a*8+i,a*8+(i+1)%8,b*8+(i+1)%8,b*8+i))
faces.append(tuple(range(16,24)));mesh=bpy.data.meshes.new('Fitted leather sheath');mesh.from_pydata(verts,[],faces);mesh.update();sheath=bpy.data.objects.new('Dagger_Sheath',mesh);bpy.context.collection.objects.link(sheath);sheath.parent=root;mat=bpy.data.materials.new('Sheath_Leather');mat.diffuse_color=(.16,.075,.035,1);mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=mat.diffuse_color;bs.inputs['Roughness'].default_value=.9;mesh.materials.append(mat)
bpy.ops.mesh.primitive_cube_add(size=1);strap=bpy.context.object;strap.name='Sheath_Belt_Loop';strap.parent=root;strap.scale=(.012,.05,.018);strap.location=(-.022,-.025,-.055);strap.rotation_euler.x=math.radians(-45);strap.data.materials.append(mat);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);bpy.ops.object.select_all(action='DESELECT');strap.select_set(True);sheath.select_set(True);bpy.context.view_layer.objects.active=sheath;bpy.ops.object.join()
# Existing baked arm actions preserved; bake corrected equipment per clip.
oldids=[o for o in s.objects if o.animation_data and o not in [arrow,dagger,wire,sheath]];armtracks={t.name:st.action for t in arm.animation_data.nla_tracks for st in t.strips};bowtracks={t.name:st.action for t in bow.animation_data.nla_tracks for st in t.strips};wiretracks={t.name:st.action for t in wire.animation_data.nla_tracks for st in t.strips}if wire.animation_data else {};wire.animation_data_clear();dagger.animation_data_clear();arrow.animation_data_clear()
def fresh(o,name):o.animation_data_create();o.animation_data.action=bpy.data.actions.new(name);o.animation_data.action.use_fake_user=True
clips=[('Attack_Ranged',1),('Idle',1),('Walk',1),('Attack_Melee',1),('Hit',.6),('Dodge',.8),('Death',1),('Use_Item',1)]
for name,dur in clips:
 for o in oldids:
  for t in o.animation_data.nla_tracks:t.mute=True
  o.animation_data.action=next((st.action for t in o.animation_data.nla_tracks if t.name==name for st in t.strips),None)
 for o in [wire,dagger,arrow,sheath,wire.data.shape_keys]:fresh(o,name+'_'+o.name)
 for fr in range(round(dur*30)+1):
  s.frame_set(fr);bpy.context.view_layer.update()
  # String object follows bow rigid motion; morphs then move the nocking point.
  wire.matrix_world=bow.matrix_world@bowbind.inverted()@wirebind
  h=arm.pose.bones['Hand_R'];nock=arm.matrix_world@h.head.lerp(h.tail,.48)
  off=wire.matrix_world.inverted()@nock-restcentre if name=='Attack_Ranged' and fr<24 else Vector((0,0,0))
  for k,x,amp in zip(axes,off,[.08,.4,.1]):k.value=x/amp;k.keyframe_insert('value',frame=fr)
  target=bow.matrix_world@socketlocal;arrow.matrix_world=Matrix.Translation(nock)@(target-nock).to_track_quat('Z','Y').to_matrix().to_4x4();arrow.scale=(1,1,1)if name=='Attack_Ranged' and fr<24 else(.00001,)*3
  hipdelta=(arm.matrix_world@arm.pose.bones['Hips'].matrix)@hipbind.inverted();sheath.matrix_world=hipdelta@Matrix.Translation(hiphandle)
  if name=='Attack_Melee':dagger.matrix_world=Matrix.Translation(nock)@Matrix.Rotation(math.radians(-80),4,'X')
  else:dagger.matrix_world=hipdelta@Matrix.Translation(hiphandle)
  for ob in [wire,dagger,arrow,sheath]:
   ob.rotation_mode='QUATERNION'
   for prop in ['location','rotation_quaternion','scale']:ob.keyframe_insert(prop,frame=fr)
 s.frame_start=0;s.frame_end=round(dur*30);s.frame_set(0);bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=out+'/'+name+'.glb',use_selection=True,export_format='GLB',export_animations=True,export_animation_mode='SCENE',export_bake_animation=True,export_extras=True)
root['prototypeLimitations']='Corrected bow plane and arrow rest; shortened sheathed dagger; reaction/gait remain prototype pending visual/game QA';bpy.ops.wm.save_as_mainfile(filepath=out+'/elf-rogue-weapon-fix.blend');json.dump({'bowRotationDegrees':math.degrees(angle),'grip':list(grip),'oldStringRest':list(chord),'newStringRest':list(restworld),'arrowRest':list(arrowrest),'hipDaggerHandle':list(hiphandle),'bladeLengthFactor':.65,'arrowLengthFactor':1.45},open(out+'/weapon-change.json','w'),indent=2)
