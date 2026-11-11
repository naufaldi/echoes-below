import os
import bpy,os,json,math
from mathutils import Vector
r=os.path.join(os.environ['ECHO_ROGUE_WORKDIR'],'archer-motion-prototype-v6c');os.makedirs(r+'/views',exist_ok=True)
for clip,fr in [('Attack_Ranged',18),('Attack_Melee',15),('Idle',0),('Walk',9)]:
 bpy.ops.wm.open_mainfile(filepath=r+'/'+clip+'-roundtrip.blend');s=bpy.context.scene;s.frame_set(fr);bpy.context.view_layer.update();c=s.camera;t=Vector((0,0,.44));c.data.ortho_scale=1.15
 for name,d in [('front',(0,-2,.25)),('side',(-2,0,.25)),('oblique',(-1,-1,.35)),('game',(1,-1.5,1.3))]:
  c.location=t+Vector(d);c.rotation_euler=(t-c.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=r+'/views/'+clip+'-'+name+'.png';bpy.ops.render.render(write_still=True)
 if clip=='Attack_Ranged':
  arm=bpy.data.objects['PROTOTYPE_partial_right_arm'];w=bpy.data.objects['Bowstring_Prototype'];bow=bpy.data.objects['Weapon_Main'];ps=[w.matrix_world@v.co for v in w.data.vertices];mid=(min(p.z for p in ps)+max(p.z for p in ps))/2;sub=[p for p in ps if abs(p.z-mid)<.01];chord=sum(sub,Vector())/len(sub);ps=[bow.matrix_world@v.co for v in bow.data.vertices];sub=[p for p in ps if .405<p.z<.435];grip=sum(sub,Vector())/len(sub);h=arm.pose.bones['Hand_R'];nock=arm.matrix_world@h.head.lerp(h.tail,.48);g=grip-chord;d=nock-chord;g.z=0;d.z=0;report={'planarBowGripVsPullAngleDegrees':math.degrees(g.angle(d)),'restString':list(chord),'grip':list(grip),'nock':list(nock),'arrowRest':list(bpy.data.objects['Arrow_Release'].matrix_world.translation)};json.dump(report,open(r+'/bow-alignment.json','w'),indent=2)
