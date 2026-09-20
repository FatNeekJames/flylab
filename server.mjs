import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root=resolve('.'),port=Number(process.env.PORT)||5173;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4'};
createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');let path=resolve(root,'.'+decodeURIComponent(url.pathname));if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return}if((await stat(path)).isDirectory())path=resolve(path,'index.html');const data=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data)}catch{res.writeHead(404).end('Not found')}}).listen(port,'127.0.0.1',()=>console.log(`FlyLab: http://localhost:${port}`));
