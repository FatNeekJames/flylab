import {BlackjackGame,total,legalActions} from './blackjack.mjs';
const $=id=>document.getElementById(id);
export class BlackjackController {
 constructor(core){
  this.core=core;this.key=null;this.game=null;this.lastVersion=-1;
  try{this.seed=Number(localStorage.getItem('flylab-blackjack-seed'))||crypto.getRandomValues(new Uint32Array(1))[0];localStorage.setItem('flylab-blackjack-seed',String(this.seed));}catch{this.seed=Date.now()>>>0;}
 }
 sync(){
  const session=this.core.current,active=session?.id==='blackjack';$('blackjackPanel').hidden=!active;
  if(!active){this.key=null;this.game=null;return null;}
  const key=`${session.start}:${this.core.completed}`;
  if(this.key!==key){this.key=key;this.game=new BlackjackGame(this.seed^(Math.round(session.start*1000)>>>0)^this.core.completed);this.lastVersion=-1;}
  this.game.advance(Math.max(0,session.elapsed/60-this.game.time));const state=this.game.publicState();
  $('bjPhase').textContent=state.phase==='thinking'?`Thinking · ${Math.ceil(state.wait)}s`:state.phase==='result'?'Round complete':state.phase==='dealer'?'Dealer plays':state.phase==='split-deal'?'Dealing split hands':'Dealing';
  if(this.lastVersion!==this.game.version){this.lastVersion=this.game.version;this.render(state);}
  return state;
 }
 card(card){const el=document.createElement('span');el.className='bj-card'+(card.hidden?' face-down':['♥','♦'].includes(card.suit)?' red':'');el.textContent=card.hidden?'?':`${card.rank}${card.suit}`;el.setAttribute('aria-label',card.hidden?'Face-down dealer card':`${card.rank} of ${{'♠':'spades','♥':'hearts','♦':'diamonds','♣':'clubs'}[card.suit]}`);return el;}
 render(s){
  $('bjRound').textContent=`Round ${s.round}`;$('bjDealerCards').replaceChildren(...s.dealer.map(c=>this.card(c)));
  $('bjDealerTotal').textContent=s.revealed?`Total ${total(s.dealer).value}`:s.dealer.length?`Showing ${s.dealer[0].rank} · hole card hidden`:'Waiting for cards';
  $('bjHands').replaceChildren(...s.hands.map((h,i)=>{const row=document.createElement('section');row.className='bj-hand'+(i===s.active&&s.phase==='thinking'?' current':'');const title=document.createElement('b');title.textContent=`Hand ${i+1} · ${total(h.cards).soft?'soft ':''}${total(h.cards).value}${h.result?' · '+h.result:''}`;const cards=document.createElement('div');cards.className='bj-cards';cards.append(...h.cards.map(c=>this.card(c)));const caption=document.createElement('small');caption.textContent=`${h.bet} points in play${h.split?' · split hand':''}${h.gain!==undefined?' · '+(h.gain>=0?'+':'')+h.gain+' result':''}`;row.append(title,cards,caption);return row;}));
  $('bjThought').textContent=s.decision?.reason??s.message;$('bjChoice').textContent=s.decision?`Considering ${s.decision.action.toUpperCase()}`:s.lastAction?`Last choice: ${s.lastAction.toUpperCase()}`:'Dealer is handing out cards';
  const legal=s.phase==='thinking'?legalActions(s.hands[s.active],s.hands.length):[];
  for(const el of document.querySelectorAll('[data-bj-action]')){const a=el.dataset.bjAction;el.classList.toggle('legal',legal.includes(a));el.classList.toggle('chosen',s.decision?.action===a);el.setAttribute('aria-label',`${a}: ${s.decision?.action===a?'fly choice':legal.includes(a)?'legal':'unavailable'}`);}
  $('bjScore').textContent=`${s.score>=0?'+':''}${s.score} points · ${s.wins} wins / ${s.losses} losses / ${s.pushes} pushes`;
  $('bjHistory').replaceChildren(...s.history.slice(0,6).map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
 }
}
