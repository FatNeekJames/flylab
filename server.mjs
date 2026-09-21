import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root=resolve('.');
const types={html:'text/html',js:'text/javascript',mjs:'text/javascript',css:'text/css',json:'application/json'};
// Explicit public assets only: never serve credentials, git metadata or server code.
const files=new Set(['index.html','app.js','bench.mjs','brain-view.js','engine.mjs','neural.mjs','style.css','core.mjs','adaptation.mjs','life-ui.js','activity-view.js','activity-motion.mjs','blackjack.mjs','blackjack-ui.js','blackjack-view.js','vfb.mjs','vfb-ui.js']);
export function publicAsset(pathname){
 let path;try{path=decodeURIComponent(pathname).replace(/^\//,'')}catch{return null}
 if(!path)path='index.html';
 if(files.has(path)||/^skills\/[a-z-]+\.mjs$/.test(path)||/^node_modules\/three\/build\/three\.(module|core)\.js$/.test(path))return path;
 return null;
}
export function makeServer(){return createServer(async(req,res)=>{
 const path=publicAsset(new URL(req.url,'http://localhost').pathname);
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return}
 if(!path){res.writeHead(404).end('Not found');return}
 try{const data=await readFile(resolve(root,path));res.writeHead(200,{'Content-Type':types[path.split('.').pop()]+'; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data)}catch{res.writeHead(404).end('Not found')}
})}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const port=Number(process.env.PORT)||5173;makeServer().listen(port,'127.0.0.1',()=>console.log(`FlyLab: http://localhost:${port}`))}
