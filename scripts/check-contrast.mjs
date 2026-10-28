#!/usr/bin/env node
// WCAG 2 contrast for the shared iron/paper ramps, brass interaction and chapter accents.
// Read :root and every chapter block directly from CSS; measure translucent chrome against a white scene
// as well as its opaque base. Exits 1 when a required pair fails.
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../client/style.css',import.meta.url),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
const props=body=>Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+?)\s*(?:;|$)/g)].map(m=>[m[1],m[2]]));
const root=props(css.match(/:root\{([^}]*)\}/)[1]);
const chapters={title:{}};for(const m of css.matchAll(/\.app\[data-chapter=(\w+)\][^{]*\{([^}]*)\}/g))chapters[m[1]]=props(m[2]);
const parse=v=>{v=v.trim();let m=v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(m){const h=m[1].length===3?[...m[1]].map(c=>c+c).join(''):m[1];return[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)).concat(1);}
 m=v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[/,]\s*([\d.]+))?\s*\)$/);if(m)return[+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]];return null;};
const resolve=(name,scope)=>{let v=scope[name]??root[name];for(let i=0;v&&i<8;i++){const r=v.match(/^var\((--[\w-]+)\)$/);if(!r)break;v=scope[r[1]]??root[r[1]];}const c=v&&parse(v);if(!c)throw new Error(`${name} is not a plain colour: ${v}`);return c;};
const over=([r,g,b,a],[R,G,B])=>[r*a+R*(1-a),g*a+G*(1-a),b*a+B*(1-a),1];
const lum=([r,g,b])=>{const f=c=>(c/=255)<=.03928?c/12.92:((c+.055)/1.055)**2.4;return .2126*f(r)+.7152*f(g)+.0722*f(b);};
const ratio=(a,b)=>{const[x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return(x+.05)/(y+.05);};
const hex=c=>'#'+c.slice(0,3).map(n=>Math.round(n).toString(16).padStart(2,'0')).join('');
const stone=['--stone-0','--stone-1','--stone-2'],paper=['--paper-0','--paper-1','--paper-2'];
const rows=[];let failures=0;
const check=(group,fgName,fg,bgName,bg,need)=>{const solid=fg[3]<1?over(fg,bg):fg,r=ratio(solid,bg),ok=r>=need;if(!ok)failures++;rows.push([group,fgName,bgName,r.toFixed(2),need===4.5?'≥4.5 text':need===3?'≥3 UI/large':'info',ok?'pass':'FAIL']);};
const gold=resolve('--gold',{}),goldStrong=resolve('--gold-strong',{}),goldInk=resolve('--gold-ink',{});
for(const [chapter,scope] of Object.entries(chapters)){const on=s=>resolve(s,scope),stone1=on('--stone-1');
 // Chapter accent: the current room on the chapter strip (stone) and the chapter's own title and recap pages (paper), in small text.
 const accent=on('--chapter-accent'),strong=on('--chapter-accent-strong'),ink=on('--chapter-accent-ink');
 for(const s of stone){check(`accent · ${chapter}`,`accent ${hex(accent)}`,accent,`${s} ${hex(on(s))}`,on(s),4.5);}
 for(const s of paper){check(`accent · ${chapter}`,`accent ${hex(accent)}`,accent,s,on(s),4.5);check(`accent · ${chapter}`,`accent-strong ${hex(strong)}`,strong,s,on(s),4.5);}
 check(`accent · ${chapter}`,'accent-ink',ink,`accent fill ${hex(accent)}`,accent,4.5);
 // Brass: the same quiet interactive accent across every chapter.
 const mist=on('--chapter-mist'),mistStrong=on('--chapter-mist-strong'),mistInk=on('--chapter-mist-ink');
 for(const s of stone){check(`mist · ${chapter}`,`mist ${hex(mist)}`,mist,`${s} ${hex(on(s))}`,on(s),4.5);check(`mist · ${chapter}`,`mist-strong ${hex(mistStrong)}`,mistStrong,`${s} ${hex(on(s))}`,on(s),4.5);}
 check(`mist · ${chapter}`,'mist-ink',mistInk,`mist fill ${hex(mist)}`,mist,4.5);
 check(`mist · ${chapter}`,'text-primary',on('--text-primary'),'selected row (mist 20% on stone-1)',over([...mist.slice(0,3),.2],stone1),4.5);
 // HUD text on the chapter's stones, and the state colours on its panels.
 for(const t of ['--text-primary','--text-secondary','--text-muted'])for(const s of stone)check(`text on stone · ${chapter}`,t,on(t),`${s} ${hex(on(s))}`,on(s),4.5);
 for(const t of ['--ally','--enemy','--danger'])check(`state · ${chapter}`,t,on(t),`--stone-1 ${hex(stone1)}`,stone1,4.5);
 // Gold remains readable for dice and the framed primary control.
 for(const s of stone){check(`gold · ${chapter}`,'gold',gold,`${s} ${hex(on(s))}`,on(s),4.5);check(`gold · ${chapter}`,'gold-strong',goldStrong,`${s} ${hex(on(s))}`,on(s),4.5);}
 for(const t of ['--text-primary','--text-muted'])check(`brass · ${chapter}`,t,on(t),'hovered or chosen action (brass 16% on stone-2)',over([...mist.slice(0,3),.16],on('--stone-2')),4.5);}
// Dice on paper and the framed primary button.
for(const s of paper){check('gold','gold',gold,s,resolve(s,{}),4.5);check('gold','gold-strong',goldStrong,s,resolve(s,{}),4.5);}
check('gold','gold-ink',goldInk,'gold fill',gold,4.5);check('gold','gold-ink',goldInk,'gold-strong fill (hover)',goldStrong,4.5);
// Ink accent: eyebrows, headings and selected rows on story surfaces.
const inkAccent=resolve('--ink-accent',{}),inkAccentStrong=resolve('--ink-accent-strong',{});
for(const s of paper){check('ink accent','ink-accent',inkAccent,s,resolve(s,{}),4.5);check('ink accent','ink-accent-strong',inkAccentStrong,s,resolve(s,{}),4.5);}
check('ink accent','ink-accent-ink',resolve('--ink-accent-ink',{}),'ink accent fill',inkAccent,4.5);check('ink accent','ink',resolve('--ink',{}),'selected row (ink accent 20% on paper-1)',over([...inkAccent.slice(0,3),.2],resolve('--paper-1',{})),4.5);
for(const t of ['--ink','--ink-soft','--ink-faint'])for(const s of paper)check('ink on paper',t,resolve(t,{}),s,resolve(s,{}),4.5);
// Character name plates and state colours on paper (UI glyphs and short labels).
for(const t of ['--palette-ember','--palette-moss','--palette-moon'])for(const s of paper)check('name plate',t,resolve(t,{}),s,resolve(s,{}),4.5);
for(const t of ['--ally','--enemy','--danger'])check('state',t,resolve(t,{}),'--paper-1',resolve('--paper-1',{}),4.5);
for(const s of ['--primary-fill','--primary-hover','--primary-pressed'])check('primary','gold-strong',goldStrong,s,resolve(s,{}),4.5);
for(const [base,alpha] of [['--stone-0',.94],['--stone-1',.97]])for(const t of ['--text-primary','--text-secondary','--text-muted','--chapter-mist'])check('chrome over white',t,resolve(t,{}),base,over([...resolve(base,{}).slice(0,3),alpha],[255,255,255]),4.5);

const w=[0,1,2,3,4,5].map(i=>Math.max(...[['group','foreground','background','ratio','needs','result'],...rows].map(r=>String(r[i]).length)));
const line=r=>'| '+r.map((c,i)=>String(c).padEnd(w[i])).join(' | ')+' |';
console.log(line(['group','foreground','background','ratio','needs','result']));console.log('|'+w.map(n=>'-'.repeat(n+2)).join('|')+'|');for(const r of rows)console.log(line(r));
console.log(`\n${rows.length} pairs, ${failures} failing. Includes translucent chrome over a white scene.`);
process.exit(failures?1:0);
