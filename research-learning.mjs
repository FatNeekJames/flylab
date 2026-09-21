// A small online linear classifier learns which stored note answers a question.
// The language model itself is not fine-tuned. Held-out questions never enter training.
const DIM=512;
const STOP=new Set('a an the is are was were how what why when which of to in on for and or it does do can this that with from'.split(' '));
export function features(text){const out=new Map();for(const word of text.toLowerCase().match(/[a-z0-9]{3,}/g)||[]){if(STOP.has(word))continue;let h=2166136261;for(const c of word)h=Math.imul(h^c.charCodeAt(0),16777619);const i=(h>>>0)%DIM;out.set(i,(out.get(i)||0)+1)}const norm=Math.hypot(...out.values())||1;return [...out].map(([i,n])=>[i,n/norm])}
export class NoteLearner{
 constructor(saved={}){this.cards=saved.cards||[];this.weights=saved.weights||{};this.updates=saved.updates||0}
 predict(question){if(!this.cards.length)return null;const x=features(question);return this.cards.map(c=>({id:c.id,score:x.reduce((sum,[i,n])=>sum+n*(this.weights[c.id]?.[i]||0),0)})).sort((a,b)=>b.score-a.score)[0]?.id}
 evaluate(cards){const results=cards.map(c=>{const predicted=this.predict(c.testQuestion);return {question:c.testQuestion,expected:c.answer,answer:this.cards.find(x=>x.id===predicted)?.answer||'No relevant note learned yet.',correct:predicted===c.id}});return {correct:results.filter(x=>x.correct).length,total:results.length,results}}
 train(cards){
  for(const card of cards){this.cards=this.cards.filter(c=>c.id!==card.id);this.cards.push(card);this.weights[card.id]??={}}
  while(this.cards.length>200){const old=this.cards.shift();delete this.weights[old.id]}
  // Replay older training examples to limit forgetting; never train on testQuestion.
  for(let epoch=0;epoch<35;epoch++)for(const card of this.cards){const x=features(card.concept+' '+card.question+' '+card.answer);const scores=this.cards.map(c=>x.reduce((s,[i,n])=>s+n*(this.weights[c.id]?.[i]||0),0));const max=Math.max(...scores);const exp=scores.map(s=>Math.exp(s-max));const sum=exp.reduce((a,b)=>a+b,0);
   this.cards.forEach((c,j)=>{const error=(c.id===card.id?1:0)-exp[j]/sum;for(const [i,n] of x)this.weights[c.id][i]=(this.weights[c.id][i]||0)+.3*error*n});this.updates++;
  }
 }
 serialize(){return {cards:this.cards,weights:this.weights,updates:this.updates}}
}
