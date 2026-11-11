import os
import pathlib,struct,json,hashlib
r=pathlib.Path(os.path.join(os.environ['ECHO_ROGUE_WORKDIR'],'archer-motion-prototype-v6c'))
for p in r.glob('*.glb'):
 b=p.read_bytes();n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);tail=b[20+n:]
 if len({json.dumps(t,sort_keys=True)for t in j['textures']})==1:
  j['textures']=j['textures'][:1]
  for m in j['materials']:
   if 'baseColorTexture'in m.get('pbrMetallicRoughness',{}):m['pbrMetallicRoughness']['baseColorTexture']['index']=0
 for node in j['nodes']:
  if node.get('name')=='Elf_Rogue_Prototype':node['extras']['prototypeLimitations']='Weapon plane/rest corrected and dagger fitted/sheath added. Motion polish and licence approval still required.'
 raw=json.dumps(j,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);p.write_bytes(struct.pack('<4sII',b'glTF',2,20+len(raw)+len(tail))+struct.pack('<I4s',len(raw),b'JSON')+raw+tail)
p=r/'elf-rogue-weapon-fix.glb';print(len(p.read_bytes()),hashlib.sha256(p.read_bytes()).hexdigest())
