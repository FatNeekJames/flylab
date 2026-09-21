import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {parseEnv} from 'node:util';
import {ResearchProvider} from './research-provider.mjs';
import {ResearchService} from './research-service.mjs';
import {MinecraftService} from './minecraft-service.mjs';
import {VFBClient} from './vfb.mjs';
const vfb=new VFBClient();
const root=resolve('.');
const types={html:'text/html',js:'text/javascript',mjs:'text/javascript',css:'text/css',json:'application/json'};
// Explicit public assets only: never serve credentials, git metadata or server code.
const files=new Set(['index.html','app.js','bench.mjs','brain-view.js','engine.mjs','neural.mjs','style.css','core.mjs','adaptation.mjs','life-ui.js','activity-view.js','activity-motion.mjs','blackjack.mjs','blackjack-ui.js','blackjack-view.js','vfb.mjs','vfb-ui.js','vfb-snapshot.mjs','research-ui.js']);
export function publicAsset(pathname){
 let path;try{path=decodeURIComponent(pathname).replace(/^\//,'')}catch{return null}
 if(!path)path='index.html';
 if(files.has(path)||/^skills\/[a-z-]+\.mjs$/.test(path)||/^node_modules\/three\/build\/three\.(module|core)\.js$/.test(path))return path;
 return null;
}

function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(JSON.stringify(data))}
async function body(req){if(!req.headers['content-type']?.startsWith('application/json'))throw Error('JSON required');let text='';for await(const chunk of req){text+=chunk;if(text.length>8192)throw Error('Request too large')}return JSON.parse(text)}
export function makeServer({research,minecraft}={}){return createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/api/')){
  const expectedHosts=[`localhost:${req.socket.localPort}`,`127.0.0.1:${req.socket.localPort}`];
  if(!expectedHosts.includes(req.headers.host)|| (req.headers.origin&&!expectedHosts.map(h=>'http://'+h).includes(req.headers.origin))||req.headers['sec-fetch-site']==='cross-site'){json(res,403,{error:'Use the local FlyLab page to access this service.'});return}
  if(url.pathname==='/api/vfb'&&req.method==='GET'){
   const id=url.searchParams.get('id'),query=url.searchParams.get('query');const data=id?await vfb.term(id):await vfb.search(query);json(res,200,data);return;
  }
  if(req.headers['x-flylab']!=='1'){json(res,403,{error:'Open the local FlyLab app.'});return}
  if(req.method==='GET'&&url.pathname==='/api/research'){json(res,200,research?.view()||{available:false,sessions:[]});return}
  if(req.method==='GET'&&url.pathname==='/api/minecraft'){json(res,200,minecraft?.view()||{connected:false,status:'unavailable',log:[]});return}
  if(req.method==='POST'){
   const data=await body(req);
   if(url.pathname.startsWith('/api/research/')&&research){const action=url.pathname.split('/').pop();if(action==='recall'){if(typeof data.question!=='string'||data.question.length>500)throw Error('Enter a question of at most 500 characters.');const id=research.learner.predict(data.question);const card=research.learner.cards.find(c=>c.id===id);json(res,200,{answer:card?.answer||'No notes learned yet. Complete a research checkpoint first.',sources:card?.sources||[]})}else if(action==='start')json(res,200,await research.start(data));else if(action==='progress')json(res,200,await research.progress(data.id,data.elapsed));else if(action==='stop')json(res,200,await research.stop(data.id));else if(action==='resume')json(res,200,await research.resume(data.id));else json(res,404,{error:'Unknown action'});return}
   if(url.pathname.startsWith('/api/minecraft/')&&minecraft){const action=url.pathname.split('/').pop();if(action==='connect')json(res,200,await minecraft.connect(data.port));else if(action==='disconnect')json(res,200,minecraft.disconnect());else if(action==='practice'){if(!minecraft.bot?.entity||minecraft.busy)throw Error('Connect to Minecraft and wait for the current attempt.');void minecraft.practice();json(res,202,{started:true})}else json(res,404,{error:'Unknown action'});return}
  }
  json(res,404,{error:'Unknown API route'});return;
 }
 const path=publicAsset(url.pathname);
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return}
 if(!path){res.writeHead(404).end('Not found');return}
 try{const data=await readFile(resolve(root,path));res.writeHead(200,{'Content-Type':types[path.split('.').pop()]+'; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data)}catch{res.writeHead(404).end('Not found')}
 }catch(error){json(res,400,{error:String(error.message).slice(0,300)})}
})}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 let local={};try{local=parseEnv(await readFile('.env.local','utf8'))}catch{}
 const provider=new ResearchProvider({key:local.OPENAI_API_KEY||process.env.OPENAI_API_KEY,model:process.env.FLYLAB_MODEL||'gpt-5-mini'});
 const research=await new ResearchService({provider}).init();const minecraft=await new MinecraftService().init();
 const timer=setInterval(()=>research.work().catch(()=>console.error('Research save failed; check local disk space.')),2000);
 const port=Number(process.env.PORT)||5173;const server=makeServer({research,minecraft});server.listen(port,'127.0.0.1',()=>console.log(`FlyLab: http://localhost:${port}`));
 for(const event of ['SIGINT','SIGTERM'])process.on(event,()=>{clearInterval(timer);minecraft.disconnect();server.close(()=>process.exit())});
}
