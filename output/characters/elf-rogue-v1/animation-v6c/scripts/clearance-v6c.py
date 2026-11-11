import os
import bpy,json,math
from mathutils import Vector
from mathutils.bvhtree import BVHTree
r=os.path.join(os.environ['ECHO_ROGUE_WORKDIR'],'archer-motion-prototype-v6c');bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene;s.render.fps=30;bpy.ops.import_scene.gltf(filepath=r+'/elf-rogue-weapon-fix.glb')
ids=[o for o in s.objects if o.animation_data]+[o.data.shape_keys for o in s.objects if o.type=='MESH' and o.data.shape_keys and o.data.shape_keys.animation_data]
def select(clip):
 for o in ids:
  for t in o.animation_data.nla_tracks:t.mute=True
  o.animation_data.action=next((st.action for t in o.animation_data.nla_tracks if t.name==clip for st in t.strips),None)
def tree(o):
 ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ev.to_mesh();vs=[ev.matrix_world@v.co for v in m.vertices];polys=[list(p.vertices)for p in m.polygons];centres=[sum((vs[i]for i in f),Vector())/len(f)for f in polys];t=BVHTree.FromPolygons(vs,polys);ev.to_mesh_clear();return t,centres
out=[]
for clip in ['Idle','Walk','Attack_Ranged','Attack_Melee']:
 select(clip)
 for fr in [0,9,18,23,25,30]:
  s.frame_set(fr);bpy.context.view_layer.update();ct,cc=tree(bpy.data.objects['Elf_Rogue_Static_Grip']);row={'clip':clip,'frame':fr,'intersections':{}}
  for name in ['Weapon_Main','Weapon_Off','Bowstring_Prototype','Dagger_Sheath','Arrow_Nocked_Prototype']:
   o=bpy.data.objects[name]
   if max(o.scale)<.001:continue
   t,centres=tree(o);pairs=t.overlap(ct);row['intersections'][name]={'total':len(pairs),'faceAbove052':sum(cc[b].z>.52 for a,b in pairs),'bodyBelow027':sum(cc[b].z<.27 for a,b in pairs),'points':[list(cc[b])for a,b in pairs[:5]]}
  # Knife inside sheath should not pierce the sheath wall (mouth guard may touch).
  dt,dc=tree(bpy.data.objects['Weapon_Off']);st,sc=tree(bpy.data.objects['Dagger_Sheath']);row['daggerSheathSurfaceIntersections']=len(dt.overlap(st));out.append(row)
json.dump(out,open(r+'/clearance-audit.json','w'),indent=2)
for row in out:
 print(row['clip'],row['frame'],{n:(v['total'],v['faceAbove052'],v['bodyBelow027'])for n,v in row['intersections'].items()},'sheath',row['daggerSheathSurfaceIntersections'])
