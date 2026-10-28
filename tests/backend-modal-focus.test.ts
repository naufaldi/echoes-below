import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {tabStop,tabPosition} from '../client/modal-focus.js';
import {NARROW_QUERY} from '../client/narrow-layout.js';

// #97 The shared modal's Tab trap: wrap at the ends, let the browser step in between.
test('Tab wraps from the last control to the first, and Shift+Tab from the first to the last',()=>{
 assert.equal(tabStop(4,3,false),0);
 assert.equal(tabStop(4,0,true),3);
 assert.equal(tabStop(4,1,false),null);
 assert.equal(tabStop(4,2,true),null);
 assert.equal(tabStop(1,0,false),0);
});
test('a focused heading before every control: Tab goes on to the first, Shift+Tab wraps to the last',()=>{
 const heading=tabPosition(-1,0);
 assert.equal(tabStop(3,heading,false),null);
 assert.equal(tabStop(3,heading,true),2);
});
test('an element after every control wraps forward; one between controls lets the browser step',()=>{
 assert.equal(tabStop(3,tabPosition(-1,3),false),0);
 assert.equal(tabStop(3,tabPosition(-1,3),true),null);
 assert.equal(tabStop(3,tabPosition(-1,1),false),null);
 assert.equal(tabStop(3,tabPosition(-1,1),true),null);
});
test('a dialog with nothing tabbable keeps focus on itself',()=>{
 assert.equal(tabStop(0,-.5,false),-1);
 assert.equal(tabStop(0,-.5,true),-1);
});
test('the narrow layout breakpoint is the same in the stylesheet and the script',()=>{
 const width=NARROW_QUERY.match(/max-width: (\d+)px/)?.[1];
 assert.ok(width);
 const css=readFileSync(new URL('../client/style.css',import.meta.url),'utf8');
 assert.match(css,new RegExp(`@media\\(max-width:${width}px\\)\\{`));
});
