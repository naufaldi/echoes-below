import os
import bpy,os
from mathutils import Vector
r=os.path.join(os.environ['ECHO_ROGUE_WORKDIR'],'archer-motion-prototype-v6c')
for clip in ['Attack_Ranged','Attack_Melee']:
 bpy.ops.wm.open_mainfile(filepath=r+'/'+clip+'-roundtrip.blend');s=bpy.context.scene;c=s.camera;t=Vector((0,0,.44));c.location=t+Vector((-2,0,.25));c.rotation_euler=(t-c.location).to_track_quat('-Z','Y').to_euler();c.data.ortho_scale=1.15;os.makedirs(r+'/side-motion/'+clip,exist_ok=True)
 for fr in range(31):
  s.frame_set(fr);s.render.filepath=r+'/side-motion/'+clip+'/'+str(fr).zfill(4)+'.png';bpy.ops.render.render(write_still=True)
