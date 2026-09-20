// A small, seeded leaky integrate-and-fire illustration. No FlyWire edges or recordings.
export const REGIONS=[
 {id:'optic',name:'Optic lobes',short:'OL',count:112,color:'#459bdd',description:'Paired visual neuropils: lamina, medulla, lobula and lobula plate. These process visual information; they are not the eyes themselves.'},
 {id:'central',name:'Central complex',short:'CX',count:56,color:'#b89cf5',description:'Midline structures including the fan-shaped body, ellipsoid body and protocerebral bridge. Involved in orientation, navigation and action selection.'},
 {id:'mushroom',name:'Mushroom bodies',short:'MB',count:48,color:'#e1b473',description:'Paired calyces, peduncles and lobes support associative learning and memory. Their role is broader than a direct muscle command.'},
 {id:'antennal',name:'Antennal lobes',short:'AL',count:40,color:'#e183b0',description:'Paired glomerular structures processing olfactory input. This scene supplies no odor stimulus, so they retain background model activity.'},
 {id:'sez',name:'Subesophageal zone',short:'SEZ',count:48,color:'#6bddc1',description:'Ventral brain region associated with taste, mechanosensation and motor pathways. Schematic activity here is driven by game effort, not measured fly data.'},
 {id:'descending',name:'Descending pathways',short:'DN',count:32,color:'#e5e995',description:'Axons convey signals through the neck from brain regions to the ventral nerve cord. Drawn as a pathway, not a separate anatomical brain lobe.'},
 {id:'vnc',name:'Ventral nerve cord',short:'VNC',count:48,color:'#92dbae',description:'Outside the brain, in the body. Thoracic motor and premotor circuits coordinate leg movements and integrate proprioceptive feedback. The inset shows the three thoracic leg regions schematically.'}
];
export const MODEL_COUNT=REGIONS.reduce((n,r)=>n+r.count,0),BIN=.015,WINDOW=3,COLUMNS=200;
export class NeuralModel {
 constructor(seed=731){this.seed=seed;this.reset()}
 random(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/4294967296}
 reset(){this.seed=731;this.time=0;this.accumulator=0;this.cursor=0;this.filled=0;this.recent=[];this.spikes=0;this.active=0;this.neurons=[];this.population=new Float32Array(REGIONS.length);this.readout={press:0,lower:0,hold:0};this.raster=Array.from({length:COLUMNS},()=>new Uint8Array(MODEL_COUNT));REGIONS.forEach((r,g)=>{for(let i=0;i<r.count;i++)this.neurons.push({group:g,v:this.random()*.85,refractory:0,glow:0,gain:.75+this.random()*.5})})}
 step(dt,state){this.accumulator+=Math.min(.1,dt);while(this.accumulator>=BIN){this.accumulator-=BIN;this.tick(state)}}
 tick(s){this.time+=BIN;const effort=s.running?s.effort/100:0,press=s.running&&s.phase>=.5,lower=s.running&&s.phase<.5,hold=s.running&&s.stall>0;
  const old=this.population,drive=[.14+.10*effort,.13+.26*effort,.10,.10,.16+.48*effort,.09+.64*effort,.12+.8*effort];
  // Coarse directional coupling, chosen for this illustration, not anatomical synapse weights.
  drive[1]+=old[0]*.2;drive[4]+=old[6]*.12;drive[5]+=old[1]*.25+old[4]*.3;drive[6]+=old[5]*.4;
  const col=this.raster[this.cursor];col.fill(0);const pop=new Float32Array(REGIONS.length);let count=0;
  this.neurons.forEach((n,i)=>{n.glow*=.78;if(n.refractory>0){n.refractory-=BIN;return}const rhythm=1+.20*Math.sin(this.time*9+n.group*.7);const input=(drive[n.group]*rhythm*n.gain+this.random()*.30);n.v+=(-n.v+input*2.2)*(BIN/.045);if(this.random()<.035)n.v+=.70;if(n.v>=1){n.v=0;n.refractory=.025;n.glow=1;col[i]=1;pop[n.group]++;count++}});
  this.population=pop.map((v,g)=>v/REGIONS[g].count);this.spikes=count;this.recent.push(col.slice());if(this.recent.length>10)this.recent.shift();let active=0;for(let i=0;i<MODEL_COUNT;i++)if(this.recent.some(c=>c[i]))active++;this.active=active;
  const approach=(v,target)=>v+(target-v)*.16;this.readout.press=approach(this.readout.press,press&&!hold?effort:0);this.readout.lower=approach(this.readout.lower,lower?effort*.72:0);this.readout.hold=approach(this.readout.hold,hold?effort:(s.running?effort*.15:0));this.cursor=(this.cursor+1)%COLUMNS;this.filled=Math.min(COLUMNS,this.filled+1);
 }
}
