import {GameError,type Save,publicSave,sceneTitle,assertSaveVersion} from '../server/game.js';
export interface Statement{bind(...values:unknown[]):Statement;first<T=Record<string,unknown>>():Promise<T|null>;all<T=Record<string,unknown>>():Promise<{results:T[]}>;run():Promise<{meta:{changes:number}}>}
export interface Database{prepare(sql:string):Statement;batch(statements:Statement[]):Promise<unknown[]>}
export class Store{
 constructor(public db:Database,public owner:string){}
 async read(id:string){const row=await this.db.prepare('SELECT body FROM saves WHERE id=? AND owner=?').bind(id,this.owner).first<{body:string}>();if(!row)throw new GameError(404,'NOT_FOUND','That adventure is not available on this device.');const save=JSON.parse(row.body) as Save;assertSaveVersion(save);return save;}
 async create(s:Save){const checkpointId=crypto.randomUUID();s.checkpointIds.push({id:checkpointId,label:sceneTitle(s.sceneId)});await this.db.batch([this.db.prepare('INSERT INTO saves(id,owner,revision,body,updated_at) VALUES(?,?,?,?,?)').bind(s.id,this.owner,s.revision,JSON.stringify(s),s.updatedAt),this.db.prepare('INSERT INTO checkpoints(id,owner,save_id,body) VALUES(?,?,?,?)').bind(checkpointId,this.owner,s.id,JSON.stringify(s))]);return publicSave(s);}
 async duplicate(id:string,hash:string){const row=await this.db.prepare('SELECT hash,result FROM commands WHERE owner=? AND id=?').bind(this.owner,id).first<{hash:string;result:string}>();if(!row)return null;if(row.hash!==hash)throw new GameError(409,'COMMAND_REUSED','This action identifier already belongs to another request.');return JSON.parse(row.result);}
 async commit(before:Save,after:Save,commandId:string,hash:string){
  const checkpointId=after.sceneId!==before.sceneId?crypto.randomUUID():null;
  if(checkpointId)after.checkpointIds.push({id:checkpointId,label:sceneTitle(after.sceneId)});
  const result=publicSave(after),body=JSON.stringify(after);
  const statements=[this.db.prepare('INSERT INTO commands(owner,id,save_id,hash,result) SELECT ?,?,?,?,? FROM saves WHERE id=? AND owner=? AND revision=? ON CONFLICT(owner,id) DO NOTHING').bind(this.owner,commandId,after.id,hash,JSON.stringify(result),before.id,this.owner,before.revision),this.db.prepare('UPDATE saves SET revision=?,body=?,updated_at=? WHERE id=? AND owner=? AND revision=? AND EXISTS(SELECT 1 FROM commands WHERE owner=? AND id=? AND hash=?)').bind(after.revision,body,after.updatedAt,after.id,this.owner,before.revision,this.owner,commandId,hash)];
  if(checkpointId)statements.push(this.db.prepare('INSERT INTO checkpoints(id,owner,save_id,body) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM commands WHERE owner=? AND id=? AND hash=? AND result=?)').bind(checkpointId,this.owner,after.id,body,this.owner,commandId,hash,JSON.stringify(result)));
  await this.db.batch(statements);
  const stored=await this.duplicate(commandId,hash);if(!stored)throw new GameError(409,'STALE_REVISION','Another choice landed first. Reload your adventure.');return stored;
 }
 /** caller has verified ownership by reading the save */
 async history(saveId:string){return (await this.db.prepare('SELECT id,speaker,player_text AS playerText,reply_text AS replyText,created_at AS createdAt FROM dialogues WHERE owner=? AND save_id=? ORDER BY created_at DESC LIMIT 50').bind(this.owner,saveId).all()).results.reverse();}
 /** caller has verified ownership by reading the save */
 async dialogue(saveId:string,speaker:string,playerText:string,text:string){const id=crypto.randomUUID(),createdAt=new Date().toISOString();await this.db.prepare('INSERT INTO dialogues(id,owner,save_id,speaker,player_text,reply_text,created_at) VALUES(?,?,?,?,?,?,?)').bind(id,this.owner,saveId,speaker,playerText,text,createdAt).run();return{id,speaker,text,source:'ai',createdAt};}
}
export async function hash(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
