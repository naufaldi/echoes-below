import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,readdirSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import ts from 'typescript';

/** #64 / #68, ROADMAP §6: system words never reach the player from the client's own strings, nor from an error the engine sends back. HUD "Autosaved" is status, not story, and does not match. */
const BANNED=/\b(engine|presentation|saved|server|AI charge|authored|recorded)\b/i;
/** Developer-only screens and figures: asset review, the portrait studio, the isolated model viewer and the `?debug` panel. */
const DEV_ONLY=new Set(['AssetReview.tsx','PortraitStudio.tsx','IsolatedAsset.tsx','DebugPanel.tsx']);
/** Attributes that never reach the player. Their values are class names, ids, keys and routes. */
const QUIET_ATTRS=new Set(['className','key','id','htmlFor','name','type','role','value','data-key','data-option','data-band','data-palette','data-side','data-chapter','data-drawer','data-anchor','src','href','rel','target','autoComplete']);

function files(dir:string):string[]{return readdirSync(dir).flatMap(f=>{const p=join(dir,f);return statSync(p).isDirectory()?files(p):/\.tsx?$/.test(f)?[p]:[];});}
/** Text a player can read: JSX text, and string or template text outside imports, quiet attributes, storage keys, selectors and routes. */
function playerStrings(path:string){
 const source=ts.createSourceFile(path,readFileSync(path,'utf8'),ts.ScriptTarget.Latest,true,path.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS),found:{line:number;text:string}[]=[];
 /** A literal compared against (`l.source==='authored'`) or matched in a `case` is a value, not text. */
 const compared=(node:ts.Node)=>{const p=node.parent;return !!p&&(ts.isCaseClause(p)||ts.isBinaryExpression(p)&&[ts.SyntaxKind.EqualsEqualsEqualsToken,ts.SyntaxKind.ExclamationEqualsEqualsToken,ts.SyntaxKind.EqualsEqualsToken,ts.SyntaxKind.ExclamationEqualsToken].includes(p.operatorToken.kind));};
 const quiet=(node:ts.Node)=>{if(compared(node))return true;for(let n:ts.Node|undefined=node.parent;n;n=n.parent){
  if(ts.isImportDeclaration(n)||ts.isExportDeclaration(n)||ts.isLiteralTypeNode(n))return true;
  if(ts.isJsxAttribute(n))return QUIET_ATTRS.has(n.name.getText(source));
  if(ts.isCallExpression(n)){const callee=n.expression.getText(source);if(/(getItem|setItem|removeItem|querySelector(All)?|closest|matches|api|fetch|addEventListener|removeEventListener|startsWith|endsWith|includes|test|match|exec|split|replace)$/.test(callee))return true;}
  if(ts.isBlock(n)||ts.isSourceFile(n))return false;}return false;};
 const visit=(node:ts.Node)=>{
  const text=ts.isJsxText(node)?node.getText(source):ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)?node.text:ts.isTemplateExpression(node)?[node.head.text,...node.templateSpans.map(s=>s.literal.text)].join(' '):null;
  if(text&&/[a-z]/i.test(text)&&!quiet(node))found.push({line:source.getLineAndCharacterOfPosition(node.getStart(source)).line+1,text:text.trim()});
  ts.forEachChild(node,visit);
 };
 visit(source);return found;
}

test('#64: no client string a player can read uses a system word',()=>{
 const hits=files('client').filter(p=>!DEV_ONLY.has(p.split('/').at(-1)!)).flatMap(p=>playerStrings(p).filter(s=>BANNED.test(s.text)).map(s=>`${p}:${s.line} ${s.text}`));
 assert.deepEqual(hits,[]);
});
test('#64: the scan catches a system word in JSX text, a title and a toast, and skips class names and keys',()=>{
 const dir=join(process.env.TMPDIR??'/tmp',`copy-scan-${process.pid}`);const p=join(dir,'Sample.tsx');
 mkdirSync(dir,{recursive:true});
 writeFileSync(p,`export const A=()=><p className="saved-adventures" title="Your game is saved">Continue saved adventure<span key="engine"/></p>;\nconst toast='The server is down.';localStorage.getItem('echoes-saved');if(log.source==='authored'){}`);
 const hits=playerStrings(p).filter(s=>BANNED.test(s.text)).map(s=>s.text);
 rmSync(dir,{recursive:true,force:true});
 assert.deepEqual(hits,['Your game is saved','Continue saved adventure','The server is down.']);
});

/** Every message a GameError or the error handler sends can surface in the player's error toast. */
function errorMessages(path:string){
 const source=ts.createSourceFile(path,readFileSync(path,'utf8'),ts.ScriptTarget.Latest,true),found:string[]=[];
 const strings=(node:ts.Node|undefined):string[]=>!node?[]:ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)?[node.text]:ts.isTemplateExpression(node)?[[node.head.text,...node.templateSpans.map(s=>s.literal.text)].join('…')]:ts.isConditionalExpression(node)?[...strings(node.whenTrue),...strings(node.whenFalse)]:ts.isParenthesizedExpression(node)?strings(node.expression):[];
 const visit=(node:ts.Node)=>{
  if(ts.isNewExpression(node)&&node.expression.getText(source)==='GameError')found.push(...strings(node.arguments?.[2]));
  if(ts.isPropertyAssignment(node)&&node.name.getText(source)==='message')found.push(...strings(node.initializer));
  ts.forEachChild(node,visit);
 };
 visit(source);return found.map(m=>`${path}: ${m}`);
}
test('#64: error messages from the local server and the hosted Worker use story-safe words',()=>{
 const messages=['server','hosted'].flatMap(d=>files(d)).filter(p=>!p.endsWith('dev-preview.ts')).flatMap(errorMessages);
 assert.ok(messages.length>30,'the scan finds the error messages');
 assert.deepEqual(messages.filter(m=>BANNED.test(m.slice(m.indexOf(': ')+2))),[]);
});
