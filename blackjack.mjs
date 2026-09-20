// Six-deck, S17, double after split, four hands maximum; no insurance/surrender.
export const RULES={decks:6,baseBet:10,maxHands:4};
export const valueOf=c=>c.rank==='A'?11:['K','Q','J'].includes(c.rank)?10:Number(c.rank);
export function total(cards){let value=cards.reduce((n,c)=>n+valueOf(c),0),aces=cards.filter(c=>c.rank==='A').length;while(value>21&&aces){value-=10;aces--;}return {value,soft:aces>0,bust:value>21};}
export const natural=hand=>!hand.split&&hand.cards.length===2&&total(hand.cards).value===21;
export function legalActions(hand,count=1){if(hand.done||total(hand.cards).value>=21)return [];const actions=['hit','stand'];if(hand.cards.length===2&&!hand.splitAces)actions.push('double');if(hand.cards.length===2&&!hand.splitAces&&count<RULES.maxHands&&valueOf(hand.cards[0])===valueOf(hand.cards[1]))actions.push('split');return actions;}
// This function deliberately receives no dealer hole card or shoe state.
export function chooseAction(hand,upcard,count=1){
 const legal=legalActions(hand,count),{value,soft}=total(hand.cards),d=valueOf(upcard);let action='hit',why='Improve a low total';
 if(!legal.length)return {action:'stand',reason:'This hand is already complete.'};
 if(legal.includes('split')){
  const p=valueOf(hand.cards[0]);const split=p===11||p===8||(p===9&&[2,3,4,5,6,8,9].includes(d))||(p===7&&d<=7)||(p===6&&d<=6)||(p===4&&[5,6].includes(d))||([2,3].includes(p)&&d<=7);
  if(split)return {action:'split',reason:`Pair of ${hand.cards[0].rank}s against dealer ${upcard.rank}: build two separate hands.`};
 }
 if(soft){
  if(value>=19){action='stand';why='Keep a strong soft total';}
  else if(value===18){if(d>=3&&d<=6){action='double';why='Soft 18 can press a favorable dealer upcard';}else if([2,7,8].includes(d)){action='stand';why='Soft 18 is strong enough against this upcard';}else{action='hit';why='Soft 18 needs improvement against a strong dealer upcard';}}
  else if((value===17&&d>=3&&d<=6)||([15,16].includes(value)&&d>=4&&d<=6)||([13,14].includes(value)&&[5,6].includes(d))){action='double';why='The ace stays flexible against a weak dealer upcard';}
  else{action='hit';why='The ace can count as 1 if the next card is large';}
 }else{
  if(value>=17){action='stand';why='Keep a strong total instead of risking a bust';}
  else if((value>=13&&value<=16&&d<=6)||(value===12&&d>=4&&d<=6)){action='stand';why='Let the dealer draw against this weak upcard';}
  else if((value===11&&d!==11)||(value===10&&d<=9)||(value===9&&d>=3&&d<=6)){action='double';why='A favorable two-card total against this dealer upcard';}
  else{action='hit';why='Improve this total against the dealer upcard';}
 }
 if(action==='double'&&!legal.includes('double')){action=soft&&value===18?'stand':'hit';why+='; doubling is unavailable after a hit';}
 return {action,reason:`${soft?'Soft':'Hard'} ${value} against dealer ${upcard.rank}. ${why}.`};
}
function rng(seed){let x=seed>>>0||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
export function makeShoe(random){const shoe=[];for(let deck=0;deck<RULES.decks;deck++)for(const suit of ['♠','♥','♦','♣'])for(const rank of ['A','2','3','4','5','6','7','8','9','10','J','Q','K'])shoe.push({rank,suit,id:`${deck}-${suit}-${rank}`});for(let i=shoe.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shoe[i],shoe[j]]=[shoe[j],shoe[i]];}return shoe.map((c,i)=>({...c,id:`shoe-${i}`}));}
const hand=cards=>({cards,bet:RULES.baseBet,done:false,split:false,splitAces:false});
export class BlackjackGame {
 constructor(seed=1,shoe=null){this.random=rng(seed);this.shoe=shoe??makeShoe(this.random);this.time=0;this.phase='idle';this.wait=0;this.round=0;this.score=0;this.wins=0;this.losses=0;this.pushes=0;this.history=[];this.events=[];this.version=0;this.nextRound();}
 note(text){this.message=text;this.history.unshift(text);this.history.length=Math.min(18,this.history.length);this.version++;}
 draw(){if(!this.shoe.length)this.shoe=makeShoe(this.random);const c={...this.shoe.shift(),dealtAt:this.time};this.events.push({id:c.id,at:this.time});this.events=this.events.slice(-20);return c;}
 nextRound(){if(this.shoe.length<60&&this.round>0)this.shoe=makeShoe(this.random);this.round++;this.hands=[hand([])];this.dealer=[];this.active=0;this.revealed=false;this.decision=null;this.queue=[['player',0],['dealer'],['player',0],['dealer']];this.phase='dealing';this.wait=.65;this.note(`Round ${this.round}: dealer deals two cards each.`);}
 schedulePlayer(){
  while(this.active<this.hands.length){const h=this.hands[this.active];if(total(h.cards).value>=21)h.done=true;if(!h.done)break;this.active++;}
  if(this.active>=this.hands.length){this.phase='dealer';this.revealed=true;this.wait=1;this.decision=null;this.note('Dealer reveals the hole card.');return;}
  this.decision=chooseAction(this.hands[this.active],this.dealer[0],this.hands.length);this.phase='thinking';this.wait=3;this.note(`Hand ${this.active+1}: considering ${this.decision.action}. ${this.decision.reason}`);
 }
 act(action){
  if(this.phase!=='thinking'||!legalActions(this.hands[this.active],this.hands.length).includes(action))return false;
  const h=this.hands[this.active];this.lastAction=action;this.decision=null;this.note(`Fly chooses ${action.toUpperCase()} on hand ${this.active+1}.`);
  if(action==='stand'){h.done=true;this.schedulePlayer();}
  else if(action==='hit'){h.cards.push(this.draw());h.done=total(h.cards).value>=21;this.phase='after-card';this.wait=1;}
  else if(action==='double'){h.bet*=2;h.cards.push(this.draw());h.done=true;this.phase='after-card';this.wait=1;}
  else{
   const [a,b]=h.cards,aces=a.rank==='A',left={...hand([a]),split:true,splitAces:aces},right={...hand([b]),split:true,splitAces:aces};this.hands.splice(this.active,1,left,right);
   this.queue=[['player',this.active],['player',this.active+1]];this.phase='split-deal';this.wait=.7;
  }
  return true;
 }
 settle(){
  const d=total(this.dealer),dealerBJ=this.dealer.length===2&&d.value===21;let net=0;
  for(const h of this.hands){const p=total(h.cards);let gain;
   if(p.bust)gain=-h.bet;else if(dealerBJ)gain=natural(h)?0:-h.bet;else if(natural(h))gain=h.bet*1.5;else if(d.bust||p.value>d.value)gain=h.bet;else if(p.value===d.value)gain=0;else gain=-h.bet;
   h.gain=gain;h.result=gain>0?(natural(h)?'Blackjack':'Win'):gain===0?'Push':p.bust?'Bust':'Loss';h.done=true;net+=gain;if(gain>0)this.wins++;else if(gain<0)this.losses++;else this.pushes++;
  }
  this.score+=net;this.revealed=true;this.phase='result';this.wait=4;this.decision=null;this.note(`Round ${this.round}: ${this.hands.map((h,i)=>`hand ${i+1} ${h.result.toLowerCase()} (${h.gain>=0?'+':''}${h.gain})`).join(', ')}. Net ${net>=0?'+':''}${net} practice points.`);
 }
 tick(){
  if(this.phase==='dealing'||this.phase==='split-deal'){
   const [who,index]=this.queue.shift(),c=this.draw();if(who==='dealer')this.dealer.push(c);else this.hands[index].cards.push(c);this.version++;
   if(this.queue.length){this.wait=.65;return;}
   if(this.phase==='split-deal'){for(const h of this.hands)if(h.splitAces)h.done=true;this.schedulePlayer();}
   else if(total(this.dealer).value===21||natural(this.hands[0]))this.settle();else this.schedulePlayer();
  }else if(this.phase==='thinking')this.act(this.decision.action);
  else if(this.phase==='after-card')this.schedulePlayer();
  else if(this.phase==='dealer'){
   if(this.hands.some(h=>!total(h.cards).bust)&&total(this.dealer).value<17){this.dealer.push(this.draw());this.note('Dealer draws below 17.');this.wait=1.1;}else this.settle();
  }else if(this.phase==='result')this.nextRound();
 }
 advance(dt){let left=Math.max(0,Math.min(120,dt));while(left>1e-8){const n=Math.min(left,this.wait);this.time+=n;this.wait-=n;left-=n;if(this.wait<1e-8)this.tick();}}
 // Public data used by both scene and UI; the face-down card is genuinely omitted.
 publicState(){return {round:this.round,phase:this.phase,time:this.time,wait:this.wait,hands:this.hands,active:this.active,dealer:this.dealer.map((c,i)=>i===1&&!this.revealed?{id:c.id,hidden:true,dealtAt:c.dealtAt}:c),revealed:this.revealed,decision:this.decision,message:this.message,score:this.score,wins:this.wins,losses:this.losses,pushes:this.pushes,history:this.history,lastAction:this.lastAction};}
}
