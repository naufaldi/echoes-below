import os
import json,struct,pathlib,copy
r=pathlib.Path(os.path.join(os.environ['ECHO_ROGUE_WORKDIR'],'archer-motion-prototype-v6c'))
def read(p):
 d=p.read_bytes();n=struct.unpack_from('<I',d,12)[0];return json.loads(d[20:20+n]),d[28+n:]
j,bb=read(r/'Attack_Ranged.glb');buf=bytearray(bb);j['animations']=[];nodemap={n.get('name'):i for i,n in enumerate(j['nodes'])}
def floats(v,kind):
 buf.extend(b'\0'*((-len(buf))%4));off=len(buf);raw=struct.pack('<'+'f'*len(v),*v);buf.extend(raw);bv=len(j['bufferViews']);j['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':len(raw)});a={'bufferView':bv,'componentType':5126,'count':2,'type':kind}
 if kind=='SCALAR':a.update({'min':[min(v)],'max':[max(v)]})
 i=len(j['accessors']);j['accessors'].append(a);return i
for name in ['Attack_Ranged','Idle','Walk','Attack_Melee','Hit','Dodge','Death','Use_Item']:
 src,data=read(r/(name+'.glb'));a={'name':name,'samplers':[],'channels':[]};acmap={};bvmap={}
 def acc(i):
  if i in acmap:return acmap[i]
  ac=copy.deepcopy(src['accessors'][i]);bv=ac.get('bufferView')
  if bv is not None:
   if bv not in bvmap:
    v=copy.deepcopy(src['bufferViews'][bv]);off=v.get('byteOffset',0);n=v['byteLength'];buf.extend(b'\0'*((-len(buf))%4));v['byteOffset']=len(buf);buf.extend(data[off:off+n]);v['buffer']=0;bvmap[bv]=len(j['bufferViews']);j['bufferViews'].append(v)
   ac['bufferView']=bvmap[bv]
  acmap[i]=len(j['accessors']);j['accessors'].append(ac);return acmap[i]
 for old in src.get('animations',[]):
  off=len(a['samplers'])
  for sam in old['samplers']:
   sm=copy.deepcopy(sam);sm['input']=acc(sm['input']);sm['output']=acc(sm['output']);a['samplers'].append(sm)
  for ch in old['channels']:
   c=copy.deepcopy(ch);c['sampler']+=off;c['target']['node']=nodemap[src['nodes'][c['target']['node']]['name']];a['channels'].append(c)
 for nm in ['Weapon_Main','Bowstring_Prototype','Weapon_Off','Arrow_Nocked_Prototype','Dagger_Sheath']:
  sn=next(n for n in src['nodes'] if n.get('name')==nm);ni=nodemap[nm]
  for prop,default,kind in [('translation',[0,0,0],'VEC3'),('rotation',[0,0,0,1],'VEC4'),('scale',[1,1,1],'VEC3')]:
   if any(c['target']['node']==ni and c['target']['path']==prop for c in a['channels']):continue
   vals=sn.get(prop,default);si=len(a['samplers']);a['samplers'].append({'input':floats([0, .6 if name=='Hit' else .8 if name=='Dodge' else 1],'SCALAR'),'output':floats(vals+vals,kind),'interpolation':'LINEAR'});a['channels'].append({'sampler':si,'target':{'node':ni,'path':prop}})
 j['animations'].append(a)
j['nodes'][nodemap['Arrow_Nocked_Prototype']]['scale']=[.00001]*3;j['buffers'][0]['byteLength']=len(buf);buf.extend(b'\0'*((-len(buf))%4));js=json.dumps(j,separators=(',',':')).encode();js+=b' '*((-len(js))%4);out=struct.pack('<4sII',b'glTF',2,28+len(js)+len(buf))+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(buf),b'BIN\0')+buf;(r/'elf-rogue-weapon-fix.glb').write_bytes(out);print([(a['name'],len(a['channels']))for a in j['animations']])
