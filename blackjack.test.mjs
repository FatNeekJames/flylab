import test from 'node:test';
import assert from 'node:assert/strict';
import {BlackjackGame,total,chooseAction,legalActions,makeShoe,natural} from './blackjack.mjs';
const cards=ranks=>ranks.map((rank,i)=>({rank:String(rank),suit:'♠',id:`test-${i}`}));
const hand=ranks=>({cards:cards(ranks),bet:10,done:false,split:false,splitAces:false});
const game=ranks=>{const g=new BlackjackGame(7,cards(ranks));g.advance(2.601);return g;};

test('aces soften correctly, faces count ten, and multi-ace totals stay valid',()=>{assert.deepEqual(total(cards(['A','A',9])),{value:21,soft:true,bust:false});assert.deepEqual(total(cards(['A',6,'K'])),{value:17,soft:false,bust:false});assert.equal(total(cards(['K','Q',2])).bust,true);});
test('six-deck shoe contains 312 distinct cards',()=>{const shoe=makeShoe(()=>.42);assert.equal(shoe.length,312);assert.equal(new Set(shoe.map(c=>c.id)).size,312);assert.equal(shoe.filter(c=>c.rank==='A').length,24);});
test('dealing alternates player/dealer and keeps the hole card out of public state',()=>{const g=new BlackjackGame(1,cards([10,6,7,'K']));g.advance(.66);assert.equal(g.hands[0].cards.length,1);assert.equal(g.dealer.length,0);g.advance(2);assert.equal(g.phase,'thinking');assert.equal(g.publicState().dealer[1].hidden,true);assert.equal(g.publicState().dealer[1].rank,undefined);assert.equal(g.publicState().dealer[0].rank,'6');});
test('strategy selects hit, stand, double and split from the hand and upcard',()=>{
 for(const [ranks,up,action] of [[[10,6],10,'hit'],[[10,7],10,'stand'],[[5,6],6,'double'],[[8,8],10,'split'],[['A',7],9,'hit'],[['A',7],6,'double'],[['A',7],2,'stand'],[[5,6],'A','hit'],[[4,4],5,'split'],[[9,9],7,'stand'],[[10,10],6,'stand']])assert.equal(chooseAction(hand(ranks),cards([up])[0]).action,action,`${ranks} vs ${up}`);
 const h=hand(['A',3,4]);assert.equal(chooseAction(h,cards([6])[0]).action,'stand');assert.ok(!legalActions(h).includes('double'));
});
test('double draws exactly one card, doubles points, then ends the hand',()=>{const g=game([5,6,6,10,10,4]);assert.equal(g.act('double'),true);assert.equal(g.hands[0].bet,20);assert.equal(g.hands[0].cards.length,3);assert.equal(g.hands[0].done,true);assert.equal(g.act('hit'),false);g.advance(3.2);assert.equal(g.phase,'result');assert.equal(g.score,20);});
test('splitting creates independent hands and allows doubling after a split',()=>{const g=game([8,6,8,10,3,2,10,10,10]);assert.equal(g.act('split'),true);g.advance(1.36);assert.equal(g.hands.length,2);assert.deepEqual(g.hands.map(h=>h.cards.length),[2,2]);assert.ok(legalActions(g.hands[0],2).includes('double'));assert.equal(g.act('double'),true);g.advance(1.01);assert.equal(g.active,1);assert.equal(g.hands[0].bet,20);assert.equal(g.hands[1].bet,10);g.act('stand');g.advance(2.2);assert.equal(g.phase,'result');assert.equal(g.score,30);});
test('split aces receive one card each and split 21 is not a natural',()=>{const g=game(['A',9,'A',7,'K',10,4]);g.act('split');g.advance(1.36);assert.ok(g.hands.every(h=>h.done&&h.cards.length===2&&!natural(h)));assert.equal(g.phase,'dealer');g.advance(2.2);assert.equal(g.score,20);});
test('dealer stands on soft 17 and hits hard 16',()=>{const g=game([10,'A',8,6,10]);g.act('stand');g.advance(1.01);assert.equal(g.phase,'result');assert.equal(g.dealer.length,2);assert.equal(g.score,10);const h=game([10,10,8,6,2]);h.act('stand');h.advance(2.11);assert.equal(h.dealer.length,3);assert.equal(h.hands[0].result,'Push');});
test('naturals pay 3:2, dealer natural ends play before doubling, and naturals push',()=>{assert.equal(game(['A',9,'K',7]).score,15);const g=game([8,'A',8,'K']);assert.equal(g.phase,'result');assert.equal(g.act('split'),false);assert.equal(g.score,-10);assert.equal(game(['A','A','K','Q']).score,0);});
test('bust loses even when dealer would bust, and split capacity is enforced',()=>{const g=game([10,6,6,10,'K',10]);g.act('hit');g.advance(2.01);assert.equal(g.score,-10);assert.equal(g.dealer.length,2);assert.ok(!legalActions(hand([8,8]),4).includes('split'));assert.ok(!legalActions(hand([10,7])).includes('split'));});
test('fly plays legal complete rounds deterministically across different tick sizes',()=>{const a=new BlackjackGame(12345),b=new BlackjackGame(12345);a.advance(60);for(let i=0;i<600;i++)b.advance(.1);assert.equal(a.round,b.round);assert.equal(a.score,b.score);assert.deepEqual(a.hands.map(h=>h.cards.map(c=>c.id)),b.hands.map(h=>h.cards.map(c=>c.id)));assert.ok(a.wins+a.losses+a.pushes>=2);});

test('many seeded shoes finish rounds with valid hands and only legal fly decisions',()=>{
 for(let seed=1;seed<=100;seed++){const g=new BlackjackGame(seed);let settled=0;
  for(let tick=0;tick<1200;tick++){if(g.phase==='thinking')assert.ok(legalActions(g.hands[g.active],g.hands.length).includes(g.decision.action));g.advance(.1);assert.ok(g.hands.length<=4);if(g.phase==='result'){settled++;assert.ok(g.hands.every(h=>Number.isFinite(h.gain)&&h.done));}}
  assert.ok(settled>0);
 }
});
