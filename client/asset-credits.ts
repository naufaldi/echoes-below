// #69 Credits, built from the asset manifests. scripts/generate-credits.mjs runs this over public/ at build time and writes asset-credits-data.ts; no imports, so Node can load it directly.
export type CreditSection='Characters'|'Props'|'Environments'|'Portraits'|'Music'|'Sound';
export const CREDIT_SECTIONS:CreditSection[]=['Characters','Props','Environments','Portraits','Music','Sound'];
export interface Credit {section:CreditSection;work:string;author:string;licence:string;licenceUrl?:string;source?:string;/** Required attribution line, verbatim from the manifest. */credit?:string;/** Public paths, e.g. assets/env/kaykit-dungeon/floor.glb. */files:string[];}
/** A manifest as read from disk: its public path (assets/<dir>/manifest.json) and parsed JSON. */
export interface ManifestSource {path:string;json:unknown;}
/** Shipped files no manifest lists, credited from the licence text bundled beside them. A test checks each licence file names the author and licence. */
export const LICENCE_FILE_CREDITS:(Credit&{licenceFile:string;mark:string})[]=[
 {section:'Characters',work:'KayKit Adventurers Character Pack (1.0)',author:'Kay Lousberg',licence:'CC0 1.0',licenceUrl:'https://creativecommons.org/publicdomain/zero/1.0/',source:'https://www.kaylousberg.com',licenceFile:'assets/kaykit/LICENSE.txt',mark:'Creative Commons Zero, CC0',files:['Barbarian.glb','Knight.glb','Mage.glb','Rogue_Hooded.glb'].map(f=>'assets/kaykit/'+f)},
 {section:'Characters',work:'Bestiary: Dungeon Monsters Kit (free)',author:'Quaternius',licence:'Quaternius Asset License 1.0',licenceUrl:'https://quaternius.com/license.html',source:'https://quaternius.com',licenceFile:'assets/quaternius/LICENSE-BESTIARY.txt',mark:'Quaternius Asset License (QAL) v1.0',files:['assets/quaternius/Imp-animated.glb']},
 {section:'Characters',work:'Character animations',author:'Quaternius',licence:'CC0 1.0',licenceUrl:'https://creativecommons.org/publicdomain/zero/1.0/',source:'https://quaternius.com',licenceFile:'assets/quaternius/LICENSE-ANIMATIONS.txt',mark:'CC0 1.0 Universal',files:['assets/quaternius/Imp-animated.glb']},
 {section:'Props',work:'Fantasy Props MegaKit (free)',author:'Quaternius',licence:'CC0 1.0',licenceUrl:'https://creativecommons.org/publicdomain/zero/1.0/',source:'https://quaternius.com',licenceFile:'assets/expansion/FantasyProps-License.txt',mark:'CC0 1.0 Universal',files:['Bed_Twin1','Bookcase_2','Cage_Small','Cauldron','Chain_Coil','Workbench'].flatMap(f=>[`assets/expansion/${f}.gltf`,`assets/expansion/${f}.bin`])},
];
/** Manifests without a pack title of their own. */
const WORKS:Record<string,string>={'assets/quaternius':'RPG Character Pack','assets/expansion':'Dungeon props (Poly Pizza)','assets/portraits':'Painted portraits'};
const SECTIONS:Record<string,CreditSection>={'assets/quaternius':'Characters','assets/kaykit':'Characters','assets/expansion':'Props','assets/portraits':'Portraits'};

/** One spelling per licence: CC0 variants become "CC0 1.0", CC-BY-4.0 becomes "CC BY 4.0"; anything else is kept. */
export const licenceLabel=(raw:string)=>/\bCC0\b/.test(raw)?'CC0 1.0':/^CC[- ]BY[- ]4\.0$/.test(raw)?'CC BY 4.0':raw;
/** "Kenney (www.kenney.nl)" and "Kenney" are one author. */
export const authorName=(raw:string)=>raw.replace(/\s*\([^)]*\)\s*$/,'').trim();
type Entry=Record<string,unknown>;
const text=(...values:unknown[])=>values.find((v):v is string=>typeof v==='string'&&!!v.trim());

/** Every file each manifest lists, as one credit per section, work, author and licence. Throws when an entry names no author or licence, so the build stops instead of shipping an uncredited file. */
export function buildCredits(manifests:ManifestSource[]):Credit[]{
 const credits:Credit[]=[];
 for(const {path,json} of [...manifests].sort((a,b)=>a.path.localeCompare(b.path))){
  const dir=path.replace(/\/manifest\.json$/,''),m=(Array.isArray(json)?{}:json) as Entry,entries=(Array.isArray(json)?json:Array.isArray(m.files)?m.files:[]) as Entry[];
  for(const e of entries){
   const name=text(e.file)??text(e.path)?.split('/').pop();if(!name)throw Error(`${path}: an entry names no file`);
   const file=`${dir}/${name}`,author=text(e.author,e.creator,m.author),licence=text(e.licence,e.license,m.licence,m.license);
   if(!author)throw Error(`${file}: no author in its manifest`);if(!licence)throw Error(`${file}: no licence in its manifest`);
   const audio=dir==='assets/audio',music=audio&&name.startsWith('music/');
   const section:CreditSection=dir.startsWith('assets/env/')?'Environments':audio?(music?'Music':'Sound'):SECTIONS[dir]??'Props';
   const work=text(m.title)??(audio?(name.startsWith('sfx/')?'Sound effects':text(e.title)):WORKS[dir])??dir;
   const by=authorName(author),into={section,work:work.startsWith(by+' ')?work.slice(by.length+1):work,author:by,licence:licenceLabel(licence),licenceUrl:text(e.licenceUrl,m.licenceUrl),source:audio?text(e.source):text(m.storePage,e.original),credit:text(e.credit)};
   const same=credits.find(c=>c.section===into.section&&c.work===into.work&&c.author===into.author&&c.licence===into.licence);
   // A group whose files come from different pages links none of them.
   if(same){same.files.push(file);if(into.credit)same.credit??=into.credit;if(same.source!==into.source)delete same.source;}else credits.push(Object.fromEntries(Object.entries({...into,files:[file]}).filter(([,v])=>v!==undefined)) as unknown as Credit);
  }
 }
 const fromLicences=LICENCE_FILE_CREDITS.map(({licenceFile:_l,mark:_m,...c})=>c);
 return CREDIT_SECTIONS.flatMap(section=>[...credits,...fromLicences].filter(c=>c.section===section));
}
/** Credits grouped for display: every section with at least one entry, in a fixed order. */
export const creditSections=(credits:Credit[])=>CREDIT_SECTIONS.map(section=>({section,credits:credits.filter(c=>c.section===section)})).filter(s=>s.credits.length);
