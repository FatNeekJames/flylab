from importlib.machinery import SourceFileLoader
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
rpc=SourceFileLoader('vfb','scripts/vfb-probe.py').load_module().rpc
names=['adult central complex','adult mushroom body','adult lateral horn','adult optic lobe','adult antennal lobe','adult subesophageal zone','adult ventral nerve cord']
def query(name):return name,rpc('tools/call',{'name':'search_terms','arguments':{'query':name,'filter_types':['anatomy'],'rows':3,'minimize_results':True}})
results=dict(ThreadPoolExecutor(7).map(query,names));Path('data/vfb-search.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
for name,result in results.items(): print(name,json.dumps(result)[:3500])
