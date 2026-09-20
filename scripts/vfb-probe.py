import json,urllib.request
from pathlib import Path
URL='https://vfb3-mcp.virtualflybrain.org'
def rpc(method,params):
 req=urllib.request.Request(URL,data=json.dumps({'jsonrpc':'2.0','id':1,'method':method,'params':params}).encode(),headers={'Content-Type':'application/json','Accept':'application/json, text/event-stream'})
 with urllib.request.urlopen(req,timeout=40) as r:return json.load(r)
if __name__=='__main__':
 tools=rpc('tools/list',{})['result']['tools']
 print(json.dumps([t for t in tools if t['name']=='search_terms']))
