import {VFBClient,ResearchNotebook} from './vfb.mjs';
const regions={central:'FBbt_00003632',mushroom:'FBbt_00003684',lateral:'FBbt_00007053',optic:'FBbt_00003701',antennal:'FBbt_00007401',sez:'FBbt_00110639',vnc:'FBbt_00004052'};
const $=id=>document.getElementById(id),client=new VFBClient();
let storage;try{storage=localStorage}catch{}
const notebook=new ResearchNotebook(storage);let version=0,current=null;
function el(tag,text){const e=document.createElement(tag);if(text)e.textContent=text;return e}
function link(text,url){const e=el('a',text);e.href=url;e.target='_blank';e.rel='noreferrer';return e}
function render(record,saved=false){
 current=record;const host=$('vfbRecord');host.replaceChildren(el('h4',record.name),el('small',record.id),el('p',record.description||'No description is supplied for this record.'));
 if(record.relationships)host.append(el('p',record.relationships));
 host.append(link('Read the VFB source record ↗',record.source));
 if(record.citations?.length){host.append(el('h5','Publications cited by VFB'));const list=el('ul');for(const citation of record.citations){const li=el('li');li.append(link(citation.title,citation.url));list.append(li)}host.append(list)}
 host.append(el('small',`${saved?'Saved record':'API record'} · retrieved ${new Date(record.retrievedAt).toLocaleString()}`));$('vfbSave').hidden=false;
}
function renderNotebook(){const host=$('vfbNotebook');host.replaceChildren();for(const record of notebook.records){const button=el('button',record.name);button.type='button';button.onclick=()=>{version++;render(record,true);$('vfbStatus').textContent='Opened saved research. It may differ from the latest source.'};host.append(button)}$('vfbCount').textContent=`${notebook.records.length} saved records`}
async function load(id){const ticket=++version;$('vfbStatus').textContent='Reading Virtual Fly Brain…';$('vfbSave').hidden=true;current=null;$('vfbRecord').replaceChildren();try{const record=await client.term(id);if(ticket!==version)return;render(record);$('vfbStatus').textContent=record.fallback?'Live VFB is unavailable. Showing a dated, verified source snapshot; see the retrieval time below.':'Source record loaded. These are anatomy facts, not measured activity from this fly.'}catch{if(ticket===version)$('vfbStatus').textContent='VFB could not be reached. Try again, or open a saved record below.'}}
$('vfbSearch').onsubmit=async event=>{event.preventDefault();const ticket=++version;$('vfbStatus').textContent='Searching Virtual Fly Brain…';$('vfbResults').replaceChildren();try{const records=await client.search($('vfbQuery').value);if(ticket!==version)return;for(const record of records){const button=el('button',record.name);button.type='button';button.onclick=()=>load(record.id);$('vfbResults').append(button)}$('vfbStatus').textContent=records.length?'Choose a record to read its anatomy and sources.':'No matching records. Try a region or neuron name.'}catch{if(ticket===version)$('vfbStatus').textContent='Search unavailable. Try again or read a saved record.'}};
$('vfbSave').onclick=()=>{if(!current)return;try{notebook.save(current);renderNotebook();$('vfbStatus').textContent='Research record saved on this device.'}catch{$('vfbStatus').textContent='Browser storage is unavailable or full. The source link is still available.'}};
$('vfbOpen').onclick=()=>load(regions[document.querySelector('[data-region].selected')?.dataset.region]||regions.mushroom);
renderNotebook();
