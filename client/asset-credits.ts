// #69 Credits, built from the asset manifests. scripts/generate-credits.mjs runs this over public/ at build time and writes asset-credits-data.ts; no imports, so Node can load it directly.
export type CreditSection='Characters'|'Props'|'Environments'|'Portraits'|'Music'|'Sound';
export const CREDIT_SECTIONS:CreditSection[]=['Characters','Props','Environments','Portraits','Music','Sound'];
export interface Credit {section:CreditSection;work:string;author:string;licence:string;licenceUrl?:string;source?:string;/** Required attribution line, verbatim from the manifest. */credit?:string;/** Public paths, e.g. assets/env/kaykit-dungeon/floor.glb. */files:string[];}
/** A manifest as read from disk: its public path (assets/<dir>/manifest.json) and parsed JSON. */
export interface ManifestSource {path:string;json:unknown;}
/** Manifests without a pack title of their own; an entry's own work overrides it. */
const WORKS:Record<string,string>={'assets/quaternius':'RPG Character Pack','assets/expansion':'Dungeon props (Poly Pizza)','assets/portraits':'Painted portraits'};
const SECTIONS:Record<string,CreditSection>={'assets/quaternius':'Characters','assets/kaykit':'Characters','assets/expansion':'Props','assets/portraits':'Portraits'};

/** One spelling per licence: CC0 variants become "CC0 1.0", CC-BY-4.0 becomes "CC BY 4.0", QAL-1.0 is spelled out; anything else is kept. */
export const licenceLabel=(raw:string)=>/\bCC0\b/.test(raw)?'CC0 1.0':/^CC[- ]BY[- ]4\.0$/.test(raw)?'CC BY 4.0':raw==='QAL-1.0'?'Quaternius Asset License 1.0':raw;
/** "Kenney (www.kenney.nl)" and "Kenney" are one author. */
export const authorName=(raw:string)=>raw.replace(/\s*\([^)]*\)\s*$/,'').trim();
type Entry=Record<string,unknown>;
const text=(...values:unknown[])=>values.find((v):v is string=>typeof v==='string'&&!!v.trim());

/** Every file each manifest lists, as one credit per section, work, author and licence. Throws when an entry names no author or licence, so the build stops instead of shipping an uncredited file. */
export function buildCredits(manifests:ManifestSource[]):Credit[]{
 const credits:Credit[]=[];
 const add=(into:Omit<Credit,'files'>,file:string)=>{
  const same=credits.find(c=>c.section===into.section&&c.work===into.work&&c.author===into.author&&c.licence===into.licence);
  // A group whose files come from different pages links none of them.
  if(same){same.files.push(file);if(into.credit)same.credit??=into.credit;if(same.source!==into.source)delete same.source;}else credits.push(Object.fromEntries(Object.entries({...into,files:[file]}).filter(([,v])=>v!==undefined)) as unknown as Credit);
 };
 for(const {path,json} of [...manifests].sort((a,b)=>a.path.localeCompare(b.path))){
  const dir=path.replace(/\/manifest\.json$/,''),m=(Array.isArray(json)?{}:json) as Entry,entries=(Array.isArray(json)?json:Array.isArray(m.files)?m.files:[]) as Entry[];
  for(const e of entries){
   const name=text(e.file)??text(e.path)?.split('/').pop();if(!name)throw Error(`${path}: an entry names no file`);
   const file=`${dir}/${name}`,author=text(e.author,e.creator,m.author),licence=text(e.licence,e.license,m.licence,m.license);
   if(!author)throw Error(`${file}: no author in its manifest`);if(!licence)throw Error(`${file}: no licence in its manifest`);
   const audio=dir==='assets/audio',music=audio&&name.startsWith('music/');
   const section:CreditSection=dir.startsWith('assets/env/')?'Environments':audio?(music?'Music':'Sound'):SECTIONS[dir]??'Props';
   const work=text(e.work,m.title)??(audio?(name.startsWith('sfx/')?'Sound effects':text(e.title)):WORKS[dir])??dir;
   const by=authorName(author);add({section,work:work.startsWith(by+' ')?work.slice(by.length+1):work,author:by,licence:licenceLabel(licence),licenceUrl:text(e.licenceUrl,m.licenceUrl),source:audio?text(e.source):text(m.storePage,e.original),credit:text(e.credit)},file);
   // A file built from more than one work (Imp-animated.glb: a Bestiary model with animation-library clips) credits each.
   for(const part of (Array.isArray(e.includes)?e.includes:[]) as Entry[]){
    const partAuthor=text(part.author),partLicence=text(part.licence),partWork=text(part.work);if(!partAuthor||!partLicence||!partWork)throw Error(`${file}: an included work names no work, author or licence`);
    add({section,work:partWork,author:authorName(partAuthor),licence:licenceLabel(partLicence),licenceUrl:text(part.licenceUrl),source:text(part.original)},file);
   }
  }
 }
 return CREDIT_SECTIONS.flatMap(section=>credits.filter(c=>c.section===section));
}
/** Credits grouped for display: every section with at least one entry, in a fixed order. */
export const creditSections=(credits:Credit[])=>CREDIT_SECTIONS.map(section=>({section,credits:credits.filter(c=>c.section===section)})).filter(s=>s.credits.length);
