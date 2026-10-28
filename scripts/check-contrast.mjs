#!/usr/bin/env node
// WCAG 2 contrast check for the identity tokens (#59). Reads the tokens from client/style.css (the :root block and the
// .app[data-chapter=…] blocks), so it cannot drift from the stylesheet. Glass surfaces are measured at their opaque base;
// the 3D scene behind them only ever darkens a 88–94% surface further. Exits 1 when a required pair fails.
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../client/style.css',import.meta.url),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
const props=body=>Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+?)\s*(?:;|$)/g)].map(m=>[m[1],m[2]]));
const root=props(css.match(/:root\{([^}]*)\}/)[1]);
const chapters={title:{}};for(const m of css.matchAll(/\.app\[data-chapter=(\w+)\]\{([^}]*)\}/g))chapters[m[1]]=props(m[2]);
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
// Chapter accents: they colour small labels (eyebrows, the current chapter, LEVEL), so they are held to body-text contrast on both surface families.
for(const [chapter,scope] of Object.entries(chapters)){const accent=resolve('--chapter-accent',scope),strong=resolve('--chapter-accent-strong',scope),ink=resolve('--chapter-accent-ink',scope);
 for(const s of [...stone,...paper]){check(`accent · ${chapter}`,`accent ${hex(accent)}`,accent,s,resolve(s,{}),4.5);check(`accent · ${chapter}`,`accent-strong ${hex(strong)}`,strong,s,resolve(s,{}),4.5);}
 check(`accent · ${chapter}`,'accent-ink',ink,`accent fill ${hex(accent)}`,accent,4.5);
 const tint=over([...accent.slice(0,3),.2],resolve('--stone-1',{}));check(`accent · ${chapter}`,'text-primary',resolve('--text-primary',{}),'selected row (accent 20% on stone-1)',tint,4.5);}
// Gold: dice, natural 20s, the primary call to action.
const gold=resolve('--gold',{}),goldStrong=resolve('--gold-strong',{}),goldInk=resolve('--gold-ink',{});
for(const s of [...stone,...paper]){check('gold','gold',gold,s,resolve(s,{}),4.5);check('gold','gold-strong',goldStrong,s,resolve(s,{}),4.5);}
check('gold','gold-ink',goldInk,'gold fill',gold,4.5);check('gold','gold-ink',goldInk,'gold-strong fill (hover)',goldStrong,4.5);
// Text tokens on every surface of their family.
for(const t of ['--text-primary','--text-secondary','--text-muted'])for(const s of stone)check('text on stone',t,resolve(t,{}),s,resolve(s,{}),4.5);
for(const t of ['--ink','--ink-soft','--ink-faint'])for(const s of paper)check('ink on paper',t,resolve(t,{}),s,resolve(s,{}),4.5);
// Character name plates and state colours (UI glyphs and short labels).
for(const t of ['--palette-ember','--palette-moss','--palette-moon'])for(const s of paper)check('name plate',t,resolve(t,{}),s,resolve(s,{}),4.5);
for(const t of ['--ally','--enemy','--danger'])for(const s of ['--stone-1','--paper-1'])check('state',t,resolve(t,{}),s,resolve(s,{}),3);
const w=[0,1,2,3,4,5].map(i=>Math.max(...[['group','foreground','background','ratio','needs','result'],...rows].map(r=>String(r[i]).length)));
const line=r=>'| '+r.map((c,i)=>String(c).padEnd(w[i])).join(' | ')+' |';
console.log(line(['group','foreground','background','ratio','needs','result']));console.log('|'+w.map(n=>'-'.repeat(n+2)).join('|')+'|');for(const r of rows)console.log(line(r));
console.log(`\n${rows.length} pairs, ${failures} failing. Glass surfaces measured at their opaque base.`);
process.exit(failures?1:0);
