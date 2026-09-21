import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {ActivityCore} from './core.mjs';
import {skills} from './skills/index.mjs';
test('journal mounts, renders notes, switches tabs and displays offline VFB fallback',async()=>{
 const dom=new JSDOM(await readFile('index.html','utf8'),{url:'http://localhost:5173/'});globalThis.document=dom.window.document;globalThis.location=dom.window.location;globalThis.localStorage=dom.window.localStorage;
 const state={available:true,sessions:[{id:'saved',sessionKey:'old',topic:'Quantum mechanics',startedAt:Date.now(),elapsed:3600,status:'complete',lessons:[{title:'Foundations',summary:'Sourced test note',model:'test',simMinute:0,notes:[{concept:'Superposition',answer:'Test explanation',sourceNumbers:[1]}],sources:[{title:'Primary source',url:'https://example.org'}],before:{correct:0,total:1},after:{correct:1,total:1,results:[{question:'Test question?',answer:'Test explanation',expected:'Test explanation',correct:true}]},uncertainties:[],nextQuestion:'What next?'}]}],learning:{cards:1,updates:35},budget:{used:1,limit:12}};
 const oldFetch=globalThis.fetch;globalThis.fetch=async url=>({ok:true,json:async()=>String(url).includes('minecraft')?{status:'disconnected',connected:false,log:[],skills:{},inventory:[]}:structuredClone(state)});
 const {ResearchController}=await import('./research-ui.js');const controller=new ResearchController(new ActivityCore(skills),{owner:true,save(){},render(){}});
 try{await controller.ready;assert.match(document.getElementById('researchEntry').textContent,/Quantum mechanics/);assert.equal(document.querySelector('#researchEntry a').href,'https://example.org/');assert.match(document.getElementById('researchEntry').textContent,/0\/1 before → 1\/1 after/);document.querySelector('[data-research-tab="minecraft"]').click();assert.equal(document.querySelector('[data-research-pane="study"]').hidden,true);assert.equal(document.querySelector('[data-research-pane="minecraft"]').hidden,false);
  globalThis.fetch=async()=>{throw Error('network unavailable')};await import('./vfb-ui.js');await document.getElementById('vfbOpen').onclick();assert.match(document.getElementById('vfbStatus').textContent,/dated, verified source snapshot/);assert.match(document.getElementById('vfbRecord').textContent,/adult mushroom body/);
 }finally{clearInterval(controller.timer);globalThis.fetch=oldFetch;dom.window.close()}
});
