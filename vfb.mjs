import {snapshot,snapshotAt} from './vfb-snapshot.mjs';
// Public VFBquery API: https://www.virtualflybrain.org/docs/apis/vfbquery/
export const VFB_BASE='https://v3-cached.virtualflybrain.org';
const ID=/^(FBbt_\d{8}|VFB_[A-Za-z0-9]{8})$/;
const plain=value=>typeof value==='string'?value.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').slice(0,12000):'';
export function recordURL(id){if(!ID.test(id))throw new Error('Invalid VFB identifier');return `${VFB_BASE}/get_term_info?id=${encodeURIComponent(id)}`}
export function normalizeTerm(data,expectedId,now=Date.now()){
 if(!data||data.Id!==expectedId||!ID.test(data.Id)||typeof data.Name!=='string')throw new Error('VFB returned an unexpected record');
 const citations=(Array.isArray(data.Publications)?data.Publications:[]).slice(0,30).filter(p=>/^FBrf\d+$/.test(p.short_form)).map(p=>({title:plain(p.title),url:`https://flybase.org/reports/${p.short_form}`}));
 return {id:data.Id,name:plain(data.Name),description:plain(data.Meta?.Description),relationships:plain(data.Meta?.Relationships),citations,source:recordURL(data.Id),retrievedAt:now};
}
export class VFBClient{
 constructor({fetcher=globalThis.fetch,now=()=>Date.now(),ttl=86400000,localProxy=typeof location!=='undefined'&&['localhost','127.0.0.1'].includes(location.hostname)}={}){this.localProxy=localProxy;this.fetcher=fetcher;this.now=now;this.ttl=ttl;this.cache=new Map();this.pending=new Map()}
 async request(path){
  const cached=this.cache.get(path);if(cached&&this.now()-cached.at<this.ttl)return structuredClone(cached.data);
  if(this.pending.has(path))return structuredClone(await this.pending.get(path));
  const request=(async()=>{const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),30000);
   try{const response=await this.fetcher(this.localProxy?'./api/vfb?'+path.split('?')[1]:VFB_BASE+path,{signal:controller.signal,credentials:'omit'});if(!response.ok)throw new Error('VFB is temporarily unavailable');const data=await response.json();if(this.cache.size>=64)this.cache.delete(this.cache.keys().next().value);this.cache.set(path,{data,at:this.now()});return data}finally{clearTimeout(timeout);this.pending.delete(path)}
  })();this.pending.set(path,request);return structuredClone(await request);
 }
 async search(query){
  if(typeof query!=='string'||!query.trim()||query.length>160)throw new Error('Enter a search of 1–160 characters');
  const data=await this.request('/search?'+new URLSearchParams({query:query.trim(),limit:'8'}));
  if(Array.isArray(data)&&this.localProxy)return data;
  if(!Array.isArray(data.rows))throw new Error('Unexpected VFB search response');
  return data.rows.filter(r=>ID.test(r.short_form)).slice(0,8).map(r=>({id:r.short_form,name:plain(r.original_label||r.label)}));
 }
 async term(id){recordURL(id);const path='/get_term_info?'+new URLSearchParams({id});
  try{const data=await this.request(path);if(this.localProxy&&data.id===id)return data;return normalizeTerm(data,id,this.cache.get(path)?.at??this.now())}
  catch(error){const fallback=snapshot.find(r=>r.Id===id);if(!fallback)throw error;return {...normalizeTerm(fallback,id,snapshotAt),fallback:true}}
 }

}
export class ResearchNotebook{
 constructor(storage){this.storage=storage;this.records=[];try{const saved=JSON.parse(storage?.getItem('flylab-vfb-notebook-v1')||'[]');if(Array.isArray(saved))this.records=saved.slice(0,40).filter(r=>ID.test(r?.id)&&typeof r.name==='string'&&typeof r.description==='string'&&Number.isFinite(r.retrievedAt)).map(r=>({...r,source:recordURL(r.id),citations:Array.isArray(r.citations)?r.citations.filter(c=>typeof c.title==='string'&&/^https:\/\/flybase\.org\/reports\/FBrf\d+$/.test(c.url)):[]}))}catch{}}
 save(record){const next=[structuredClone(record),...this.records.filter(r=>r.id!==record.id)].slice(0,40);this.storage?.setItem('flylab-vfb-notebook-v1',JSON.stringify(next));this.records=next}
}
