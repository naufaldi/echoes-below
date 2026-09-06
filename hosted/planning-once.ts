import {GameError} from '../server/game.js';
import type {Store} from './db.js';
/** A durable claim prevents two Worker instances from buying the same decision. */
export async function planningOnce(store:Store,id:string,hash:string,produce:()=>Promise<Record<string,string>>){
 const claimed=await store.db.prepare('INSERT OR IGNORE INTO planning_requests(owner,id,hash,started_at) VALUES(?,?,?,?)').bind(store.owner,id,hash,Date.now()).run();
 if(!claimed.meta.changes){
  const row=await store.db.prepare('SELECT hash,started_at,result FROM planning_requests WHERE owner=? AND id=?').bind(store.owner,id).first<{hash:string;started_at:number;result:string|null}>();
  if(!row||row.hash!==hash)throw new GameError(409,'COMMAND_REUSED','This action identifier belongs to another request.');
  if(row.result!==null)return JSON.parse(row.result) as Record<string,string>;
  if(Date.now()-row.started_at<90000)throw new GameError(409,'AI_PENDING','This companion decision is still being prepared. Retry the same action shortly.');
  // A crashed producer may already have spent money. Never buy its decision again.
  return {};
 }
 let result:Record<string,string>={};
 try{result=await produce();return result;}
 finally{await store.db.prepare('UPDATE planning_requests SET result=? WHERE owner=? AND id=? AND hash=?').bind(JSON.stringify(result),store.owner,id,hash).run();}
}
