import {writeFile} from 'node:fs/promises';
import {EXPEDITION} from '../shared/campaign.ts';
const map=EXPEDITION.map(({id,title,chapter,chapterName})=>({id,title,chapter,chapterName}));
await writeFile('shared/campaign-map.ts','// Generated public navigation metadata. Private clues/outcomes remain server-side.\nexport const CAMPAIGN_MAP = '+JSON.stringify(map,null,2)+' as const;\nexport function campaignRoom(id:string){return CAMPAIGN_MAP.find(room=>room.id===id);}\n');
