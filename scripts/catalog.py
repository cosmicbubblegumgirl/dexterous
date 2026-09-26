import urllib.request,csv,io,json,concurrent.futures,pathlib
p=pathlib.Path(__file__).resolve().parent.parent;cache=p/'.cache';cache.mkdir(exist_ok=True)
base='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/'
def read(n):
 f=cache/n
 if not f.exists(): f.write_bytes(urllib.request.urlopen(base+n,timeout=60).read())
 return list(csv.DictReader(io.StringIO(f.read_text())))
names=['pokemon.csv','pokemon_species.csv','pokemon_types.csv','types.csv','pokemon_stats.csv']
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex: datasets=dict(zip(names,ex.map(read,names)))
types={r['id']:r['identifier'] for r in datasets['types.csv']};pt={};stats={}
for r in datasets['pokemon_types.csv']:pt.setdefault(r['pokemon_id'],[]).append(types[r['type_id']])
for r in datasets['pokemon_stats.csv']:stats.setdefault(r['pokemon_id'],[]).append(int(r['base_stat']))
species={r['id']:r for r in datasets['pokemon_species.csv']}
rows=[]
for r in datasets['pokemon.csv']:
 if r['is_default']!='1':continue
 s=species[r['species_id']]
 rows.append(dict(id=int(r['id']),name=r['identifier'],types=pt.get(r['id'],[]),gen=int(s['generation_id']),legendary=s['is_legendary']=='1',mythical=s['is_mythical']=='1',height=int(r['height'])/10,weight=int(r['weight'])/10,stats=stats[r['id']],chain=int(s['evolution_chain_id']),base=s['evolves_from_species_id']=='',parent=int(s['evolves_from_species_id'] or 0)))
(p/'data/catalog.json').write_text(json.dumps(rows,separators=(',',':')))
print('Catalog species:',len(rows))
