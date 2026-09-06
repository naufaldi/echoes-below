import type {ActionOption,PublicSave} from '../shared/types';
export default function QuestJournal({save,onChoose}:{save:PublicSave;onChoose:(a:ActionOption)=>void}){
 if(!save.quests)return null;
 return <section className="quest-journal" aria-label="Quest progress"><h3>Quests</h3><p>Optional objectives can be left aside. Story XP is never awarded twice.</p>{['active','completed','missed','declined'].map(status=>{
  const quests=save.quests!.filter(q=>q.status===status);if(!quests.length)return null;
  return <div key={status}><h4>{status==='active'?'In progress':status==='missed'?'Opportunities passed':status==='declined'?'Left aside':'Completed'}</h4>{quests.map(q=>{
   const decline=save.actions.find(a=>a.id===`quest:decline:${q.id}`);
   return <details key={q.id} open={status==='active'}><summary>{q.title} <span>{q.kind==='main'?'Main story':'Optional'} · Chapter {q.chapter} · {q.steps.filter(s=>s.done).length}/{q.steps.length}</span></summary><ul>{q.steps.map((task,i)=><li key={i}>{task.done?'✓':'○'} {task.label}</li>)}</ul><small>{q.reward}</small>{decline&&<button onClick={()=>onChoose(decline)}>Leave this optional quest aside</button>}</details>;
  })}</div>;
 })}</section>;
}
