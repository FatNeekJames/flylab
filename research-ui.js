const $=id=>document.getElementById(id);
const local=['localhost','127.0.0.1'].includes(location.hostname);
const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e};
function sourceLink(source){const a=el('a',source.title||source.url);try{const u=new URL(source.url);if(!['https:','http:'].includes(u.protocol))return a;a.href=u.href;a.target='_blank';a.rel='noreferrer'}catch{}return a}
async function api(path,data){const r=await fetch('./api/'+path,{method:data===undefined?'GET':'POST',headers:{'X-FlyLab':'1',...(data===undefined?{}:{'Content-Type':'application/json'})},body:data===undefined?undefined:JSON.stringify(data)});const value=await r.json();if(!r.ok)throw Error(value.error||'Local research service unavailable');return value}
export class ResearchController{
 constructor(core,life){this.core=core;this.life=life;this.busy=false;this.state=null;this.selected=null;this.observed=null;this.activeId=null;this.signature='';this.autoPractice=false;
  for(const button of document.querySelectorAll('[data-research-tab]'))button.onclick=()=>{for(const b of document.querySelectorAll('[data-research-tab]')){b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',b===button)}for(const pane of document.querySelectorAll('[data-research-pane]'))pane.hidden=pane.dataset.researchPane!==button.dataset.researchTab};
  $('researchStart').onclick=()=>this.start();$('researchStop').onclick=()=>this.stop().catch(e=>this.message(e.message));$('researchRetry').onclick=async()=>{try{const active=this.state?.sessions.find(s=>['error','paused'].includes(s.status));if(active)await api('research/resume',{id:active.id});await this.tick()}catch(e){this.message(e.message)}};
  $('researchRecall').onsubmit=async event=>{event.preventDefault();try{const answer=await api('research/recall',{question:$('researchQuestion').value});const host=$('researchAnswer');host.replaceChildren(el('p',answer.answer));for(const source of answer.sources||[])host.append(sourceLink(source),el('br'));}catch(e){$('researchAnswer').textContent=e.message}};
  $('researchExport').onclick=()=>{if(!this.state)return;const blob=new Blob([JSON.stringify(this.state.sessions,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=el('a');a.href=url;a.download='flylab-research-journal.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
  $('mcConnect').onclick=()=>this.minecraft('connect',{port:Number($('mcPort').value)});$('mcDisconnect').onclick=()=>{this.autoPractice=false;$('mcAuto').checked=false;this.minecraft('disconnect',{})};$('mcPractice').onclick=()=>this.minecraft('practice',{});$('mcAuto').onchange=()=>this.autoPractice=$('mcAuto').checked;
  if(!local){this.message('Live research runs on your PC. Open the local FlyLab app to start a session.');$('researchLocal').hidden=false;for(const id of ['researchStart','researchStop','researchRetry','mcConnect','mcPractice','mcDisconnect','mcAuto','researchAsk'])$(id).disabled=true;return}
  this.timer=setInterval(()=>this.tick(),5000);this.ready=this.tick();
 }
 message(text){$('researchStatus').textContent=text}
 async start(){if(!this.life.owner||this.core.current){this.message('Finish or stop the current activity before starting a research hour.');return}this.core.selected='phd';this.core.setMode('manual');if(!this.core.start('phd')){this.message('The fly needs to recover before studying.');return}this.core.lastWall=Date.now();this.life.save();this.life.render();await this.tick()}
 async stop(){const active=this.state?.sessions.find(s=>['studying','researching','error','paused'].includes(s.status));if(active)await api('research/stop',{id:active.id});if(this.core.current?.id==='phd'){this.core.current=null;this.life.save();this.life.render()}this.activeId=null;this.observed=null;await this.tick()}
 async tick(){if(this.busy||!local)return;this.busy=true;try{
  let state=await api('research');const session=this.core.current;
  if(this.life.owner){
   const active=state.sessions.find(s=>['studying','researching','error','paused'].includes(s.status));
   if(session?.id==='phd'){
    if(active&&active.sessionKey!==session.uid){this.message('An earlier research session is saved. Stop it before starting another.');}
    else{const record=active||state.sessions.find(s=>s.sessionKey===session.uid)||await api('research/start',{topic:$('researchTopic').value,sessionKey:session.uid});this.observed=session;this.activeId=record.id;await api('research/progress',{id:record.id,elapsed:session.elapsed});}
   }else if(active){
    const finished=this.observed?.uid===active.sessionKey&&this.observed.elapsed>=this.observed.duration;
    const historical=this.core.history.some(h=>h.id==='phd'&&h.uid===active.sessionKey);
    if(finished||historical)await api('research/progress',{id:active.id,elapsed:3600});else await api('research/stop',{id:active.id});this.observed=null;
   }
  }
  state=await api('research');this.state=state;this.render();await this.renderMinecraft();
 }catch(e){this.message(e.message||'Local research service unavailable. Restart FlyLab to reconnect.')}finally{this.busy=false}}
 render(){const state=this.state,active=state.sessions.find(s=>['studying','researching','paused','error'].includes(s.status));
  this.message(active?`${active.topic} · ${Math.floor(active.elapsed/60)} / 60 study minutes · ${active.status}${active.error?' — '+active.error:''}`:`Ready for a research hour. ${state.learning.cards} notes in learned memory.`);
  $('researchBudget').textContent=`${state.budget.used}/${state.budget.limit} research checkpoints used today · ${state.learning.updates} classifier updates`;
  $('researchStart').disabled=!this.life.owner||!!this.core.current||!!active||!state.available;$('researchStop').disabled=!this.life.owner||!active;$('researchRetry').disabled=!this.life.owner; $('researchRetry').hidden=!['paused','error'].includes(active?.status);$('researchProgress').value=active?active.elapsed/3600:0;
  const signature=JSON.stringify(state.sessions.map(({elapsed,...s})=>s));if(signature===this.signature)return;this.signature=signature;
  const list=$('researchSessions');list.replaceChildren();for(const s of state.sessions){const b=el('button',`${s.topic} · ${s.lessons.length}/4 checkpoints · ${s.status}`);b.onclick=()=>{this.selected=s.id;this.renderEntry()};list.append(b)}if(!state.sessions.length)list.append(el('p','No research yet. Choose a topic or let the fly choose its next subject.'));this.renderEntry();
 }
 renderEntry(){const session=this.state.sessions.find(s=>s.id===this.selected)||this.state.sessions[0],host=$('researchEntry');host.replaceChildren();if(!session)return;
  host.append(el('h3',session.topic),el('p',`${new Date(session.startedAt).toLocaleString()} · ${Math.floor(session.elapsed/60)} study minutes · ${session.status}`));
  if(session.error)host.append(el('p',session.error));
  for(const [i,lesson] of session.lessons.entries()){
   const article=el('article');article.className='research-lesson';article.append(el('small',`CHECKPOINT ${i+1} · ${lesson.simMinute} MIN · ${lesson.model}`),el('h4',lesson.title),el('p',lesson.summary));
   const notes=el('ul');for(const note of lesson.notes){const li=el('li');li.append(el('b',note.concept),el('p',note.answer));for(const n of note.sourceNumbers){const source=lesson.sources[n-1];if(source){li.append(sourceLink({title:`[${n}] ${source.title}`,url:source.url}),el('br'))}}notes.append(li)}article.append(notes);
   article.append(el('h4',`Recall check: ${lesson.before.correct}/${lesson.before.total} before → ${lesson.after.correct}/${lesson.after.total} after`));const details=el('details');details.append(el('summary','See the questions, answers and mistakes'));for(const result of lesson.after.results){details.append(el('h5',`${result.correct?'✓':'✕'} ${result.question}`),el('p',`Fly’s recalled answer: ${result.answer}`));if(!result.correct)details.append(el('p',`Expected note: ${result.expected}`))}article.append(details);
   if(lesson.uncertainties.length)article.append(el('p','Still uncertain: '+lesson.uncertainties.join(' ')));article.append(el('p','Next question: '+lesson.nextQuestion));host.append(article);
  }
 }
 async minecraft(action,data){try{await api('minecraft/'+action,data);await this.renderMinecraft()}catch(e){$('mcStatus').textContent=e.message}}
 async renderMinecraft(){const s=await api('minecraft');$('mcStatus').textContent=`${s.status} · inventory: ${s.inventory?.map(i=>`${i.count} ${i.name}`).join(', ')||'empty'}`;$('mcConnect').disabled=!this.life.owner||s.connected||s.status==='connecting';$('mcPractice').disabled=!this.life.owner||!s.connected||s.busy;$('mcDisconnect').disabled=!s.connected&&s.status!=='connecting';$('mcLog').replaceChildren(...(s.log||[]).slice(0,12).map(x=>el('li',`${new Date(x.at).toLocaleTimeString()} — ${x.message}`)));$('mcSkills').textContent='Verified successes: '+(Object.entries(s.skills||{}).map(([k,v])=>`${k}: ${v}`).join(' · ')||'none yet');if(this.autoPractice&&this.life.owner&&s.connected&&!s.busy&&!s.inventory.some(i=>i.name==='crafting_table'))await api('minecraft/practice',{})}
}
