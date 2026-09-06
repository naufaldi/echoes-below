export type AIMode='off'|'personal'|'sponsored';
let mode:AIMode='off';
export const getAIMode=()=>mode;
export function setAIMode(next:AIMode){mode=next;}
export function isPaidEndpoint(path:string,body?:unknown){return !!body&&(/\/dialogue$/.test(path)||/\/narrations\/.+\/audio$/.test(path)||path==='/api/transcriptions'||path==='/api/actions/preview'&&!(body as {actionId?:string}).actionId);}
