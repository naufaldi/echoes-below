from pathlib import Path
import json,struct,copy
R=Path(__file__).resolve().parents[1]
def load(path):
 b=path.read_bytes(); ln=struct.unpack_from('<I',b,12)[0]; d=json.loads(b[20:20+ln]); start=20+ln; bl=struct.unpack_from('<I',b,start)[0]; return d,b[start+8:start+8+bl]
s, sb=load(R/'research/raw/UAL1_Standard.glb')
clips={'Idle_Loop':'Idle','Walk_Loop':'Walk','Jog_Fwd_Loop':'Run','Sword_Attack':'Attack','Hit_Chest':'Hit','Death01':'Death','Interact':'Interact','Idle_Talking_Loop':'Talk'}
for name in ['Imp','Puglin']:
 d,b=load(R/f'public/assets/quaternius/{name}.glb'); binary=bytearray(b); targets={n.get('name'):i for i,n in enumerate(d['nodes'])}; animations=[]; cache={}
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
   if node not in targets or path!='rotation':continue
   sm=anim['samplers'][ch['sampler']]; idx=len(out['samplers']);out['samplers'].append({'input':accessor(sm['input']),'output':accessor(sm['output']),'interpolation':sm.get('interpolation','LINEAR')});out['channels'].append({'sampler':idx,'target':{'node':targets[node],'path':path}})
  animations.append(out)
 d['animations']=animations
 while len(binary)%4:binary.append(0)
 d['buffers']=[{'byteLength':len(binary)}]; j=json.dumps(d,separators=(',',':')).encode();j+=b' '*((-len(j))%4)
 glb=struct.pack('<III',0x46546c67,2,12+8+len(j)+8+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary
 (R/f'public/assets/quaternius/{name}-animated.glb').write_bytes(glb)
 print(name,[(x['name'],len(x['channels'])) for x in animations],len(glb))
