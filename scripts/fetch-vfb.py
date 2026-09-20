from importlib.machinery import SourceFileLoader
from pathlib import Path
import json
rpc=SourceFileLoader('vfb','scripts/vfb-probe.py').load_module().rpc
search=json.loads(Path('data/vfb-search.json').read_text());terms=[]
for name,resp in search.items():
 row=json.loads(resp['result']['content'][0]['text'])['results'][0]
 assert row['original_label']==name
 terms.append({'label':name,'id':row['short_form']})
result=rpc('tools/call',{'name':'get_term_info','arguments':{'id':[t['id'] for t in terms]}})
Path('data/vfb-term-info.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
Path('data/vfb-regions.json').write_text(json.dumps({'retrieved':'2026-09-20','source':'https://vfb3-mcp.virtualflybrain.org','method':'MCP search_terms exact label + get_term_info','terms':terms},indent=2),encoding='utf-8')
print(json.dumps(terms));print(json.dumps(result)[:1600])
