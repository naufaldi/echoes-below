from pathlib import Path
import json,struct,copy
R=Path(__file__).resolve().parents[1]
def load(path):
 b=path.read_bytes(); ln=struct.unpack_from('<I',b,12)[0]; d=json.loads(b[20:20+ln]); start=20+ln; bl=struct.unpack_from('<I',b,start)[0]; return d,b[start+8:start+8+bl]
s, sb=load(R/'research/raw/UAL1_Standard.glb')
clips={'Idle_Loop':'Idle','Walk_Loop':'Walk','Jog_Fwd_Loop':'Run','Sword_Attack':'Attack','Hit_Chest':'Hit','Death01':'Death','Interact':'Interact','Idle_Talking_Loop':'Talk'}
for name in ['Imp','Puglin']:
 d,b=load(R/f'research/raw/unshipped/{name}.glb'); binary=bytearray(b); targets={n.get('name'):i for i,n in enumerate(d['nodes'])}; animations=[]; cache={}
 def accessor(i):
  if i in cache:return cache[i]
  a=copy.deepcopy(s['accessors'][i]); v=copy.deepcopy(s['bufferViews'][a['bufferView']]); start=v.get('byteOffset',0); raw=sb[start:start+v['byteLength']]
  while len(binary)%4:binary.append(0)
  v['buffer']=0;v['byteOffset']=len(binary);binary.extend(raw); a['bufferView']=len(d.setdefault('bufferViews',[]));d['bufferViews'].append(v)
  idx=len(d.setdefault('accessors',[]));d['accessors'].append(a);cache[i]=idx;return idx
 for anim in s['animations']:
  if anim['name'] not in clips:continue
  out={'name':clips[anim['name']],'channels':[],'samplers':[]}
  for ch in anim['channels']:
   node=s['nodes'][ch['target']['node']].get('name'); path=ch['target']['path']
   pelvis_fall=anim['name']=='Death01' and node=='pelvis' and path=='translation'
   if node not in targets or (path!='rotation' and not pelvis_fall):continue
   sm=anim['samplers'][ch['sampler']]
   output=accessor(sm['output'])
   if pelvis_fall:
    source_rest=s['nodes'][ch['target']['node']]['translation']; target_rest=d['nodes'][targets[node]]['translation']; ratio=target_rest[2]/source_rest[2]
    a=copy.deepcopy(s['accessors'][sm['output']]);v=s['bufferViews'][a['bufferView']]
    assert a['componentType']==5126 and a['type']=='VEC3' and not v.get('byteStride')
    values=struct.unpack_from('<'+'f'*(a['count']*3),sb,v.get('byteOffset',0)+a.get('byteOffset',0))
    rebased=[target_rest[i%3]+(value-source_rest[i%3])*ratio for i,value in enumerate(values)]
    # Imp's body proportions need a measured endpoint correction after pelvis retargeting.
    # Geometry audit: scripts/check-monster-ground.mjs. Blend from zero through the fall.
    clearance={'Imp':0.055892212042688336}.get(name,0)
    descent=max(0.001,source_rest[2]-values[-1])
    for i in range(2,len(rebased),3):rebased[i]+=clearance*max(0,min(1,(source_rest[2]-values[i])/descent))
    while len(binary)%4:binary.append(0)
    raw=struct.pack('<'+'f'*len(rebased),*rebased);view={'buffer':0,'byteOffset':len(binary),'byteLength':len(raw)};binary.extend(raw)
    a['bufferView']=len(d['bufferViews']);a['byteOffset']=0;a['min']=[min(rebased[i::3]) for i in range(3)];a['max']=[max(rebased[i::3]) for i in range(3)];d['bufferViews'].append(view)
    output=len(d['accessors']);d['accessors'].append(a)
   idx=len(out['samplers']);out['samplers'].append({'input':accessor(sm['input']),'output':output,'interpolation':sm.get('interpolation','LINEAR')});out['channels'].append({'sampler':idx,'target':{'node':targets[node],'path':path}})
  animations.append(out)
 d['animations']=animations
 while len(binary)%4:binary.append(0)
 d['buffers']=[{'byteLength':len(binary)}]; j=json.dumps(d,separators=(',',':')).encode();j+=b' '*((-len(j))%4)
 glb=struct.pack('<III',0x46546c67,2,12+8+len(j)+8+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary
 (R/(f'public/assets/quaternius/{name}-animated.glb' if name=='Imp' else f'research/raw/unshipped/{name}-animated.glb')).write_bytes(glb)
 print(name,[(x['name'],len(x['channels'])) for x in animations],len(glb))
