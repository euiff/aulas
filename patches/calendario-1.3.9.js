/* Calendário e grade de impressão — CFC Top Instrutor 1.3.9 */
(function(){
  let cursor=today().slice(0,7)+'-01', selected=today();
  const parseISO=iso=>new Date(String(iso).slice(0,10)+'T12:00:00');
  const isoOf=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const oldRange=range,oldRender=render,oldSetTab=setTab;
  const monday=iso=>{const d=parseISO(iso);d.setDate(d.getDate()-(d.getDay()+6)%7);return isoOf(d)};
  range=function(){
    if(tab==='day')return [selected,selected,'Dia '+fmtDate(selected)];
    if(tab==='week')return [monday(selected),addDays(monday(selected),6),'Esta semana'];
    if(tab==='month'){const d=parseISO(cursor),first=isoOf(new Date(d.getFullYear(),d.getMonth(),1)),last=isoOf(new Date(d.getFullYear(),d.getMonth()+1,0));return [first,last,'Este mês']}
    return oldRange();
  };
  const card=document.createElement('section');card.className='cal19';card.innerHTML='<div class="cal19-head"><h2 id="cal19-title">Calendário</h2><div><button id="cal19-prev" type="button" aria-label="Mês anterior">‹</button><button id="cal19-next" type="button" aria-label="Próximo mês">›</button></div></div><div class="cal19-week"><b>S</b><b>T</b><b>Q</b><b>Q</b><b>S</b><b>S</b><b>D</b></div><div id="cal19-grid" class="cal19-grid"></div><p>Toque em um dia para ver os alunos e horários. Selecione Semana ou Mês para ver o período.</p>';
  const home=$('homeTab');home.insertBefore(card,home.firstChild);
  const choices=document.createElement('label');choices.className='cal19-choice';choices.textContent='Grade ';
  const scope=document.createElement('select');scope.id='cal19-scope';scope.innerHTML='<option value="week">Semana</option><option value="month">Mês</option>';choices.appendChild(scope);
  $('printBtn').parentElement.insertBefore(choices,$('printBtn'));
  function calendar(){
    if($('appScreen').hidden)return;
    const d=parseISO(cursor),year=d.getFullYear(),month=d.getMonth();
    $('cal19-title').textContent=d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    const counts={};
    myLessons().forEach(l=>{const x=String(l.start_at||'').slice(0,10);if(x.slice(0,7)===cursor.slice(0,7)&&l.status!=='cancelada'&&!isRequest(l))counts[x]=(counts[x]||0)+units(l)});
    const grid=$('cal19-grid');grid.replaceChildren();const offset=(new Date(year,month,1).getDay()+6)%7;
    for(let i=0;i<offset;i++){const v=document.createElement('span');grid.appendChild(v)}
    for(let n=1;n<=new Date(year,month+1,0).getDate();n++){
      const day=isoOf(new Date(year,month,n)),b=document.createElement('button');b.type='button';
      b.className='cal19-day'+(day===selected?' selected':'')+(day===today()?' today':'');
      const num=document.createElement('strong');num.textContent=n;b.appendChild(num);
      if(counts[day]){const sm=document.createElement('small');sm.textContent=counts[day]+' aula'+(counts[day]>1?'s':'');b.appendChild(sm)}
      b.setAttribute('aria-label',fmtDate(day)+', '+(counts[day]||0)+' aulas');b.setAttribute('aria-pressed',String(day===selected));
      b.onclick=()=>{selected=day;oldSetTab('day')};grid.appendChild(b);
    }
  }
  function shift(months){const d=parseISO(cursor);d.setMonth(d.getMonth()+months);cursor=isoOf(new Date(d.getFullYear(),d.getMonth(),1));scope.value='month';oldSetTab('month')}
  $('cal19-prev').onclick=()=>shift(-1);$('cal19-next').onclick=()=>shift(1);
  setTab=function(t){if(t==='today'){selected=today();cursor=selected.slice(0,7)+'-01'}if(t==='tomorrow'){selected=addDays(today(),1);cursor=selected.slice(0,7)+'-01'}if(t==='month')scope.value='month';if(t==='week')scope.value='week';oldSetTab(t)};
  render=function(){oldRender();if(['today','tomorrow','week','month','day'].includes(tab))calendar()};
  const sheet=$('printSheet'),table=sheet.querySelector('table');
  if(table)table.remove();const pages=document.createElement('div');pages.id='cal19-print';sheet.insertBefore(pages,sheet.querySelector('footer'));
  function starts(){if(scope.value==='week')return [monday(tab==='day'?selected:range()[0])];
    const first=cursor.slice(0,7)+'-01',d=parseISO(first),last=isoOf(new Date(d.getFullYear(),d.getMonth()+1,0)),out=[];
    for(let s=monday(first);s<=last;s=addDays(s,7)){out.push(s);if(out.length===6)break}return out;
  }
  function dayCard(iso,label){
    const lessons=myLessons().filter(l=>String(l.start_at).slice(0,10)===iso&&l.status!=='cancelada'&&!isRequest(l));
    const entries=lessons.map(l=>'<div class="cal19-entry"><b>'+esc(fmtTime(l.start_at))+'</b><span>'+esc(l.student_name||'Aluno')+(units(l)===2?' • 2 aulas':'')+'</span></div>').join('');
    return '<section class="cal19-printday"><h3>'+label+' <small>'+fmtDate(iso)+'</small></h3>'+(entries||'<p>Sem aulas</p>')+'</section>';
  }
  buildPrintAgenda=function(){
    $('printCfc').textContent=conn.cfc_name||state.branding?.name||'CFC Top';
    $('printInstructor').textContent='Instrutor: '+(conn.instructor_name||'');
    $('printPeriod').textContent=scope.value==='month'?'Mês '+cursor.slice(0,7):'Grade semanal';
    $('printGenerated').textContent='Emitido: '+new Date().toLocaleString('pt-BR');
    const names=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
    pages.innerHTML=starts().map(start=>{
       const cards=names.map((name,i)=>dayCard(addDays(start,i),name)).join('');
       const sun=addDays(start,6),sunday=myLessons().filter(l=>String(l.start_at).slice(0,10)===sun&&l.status!=='cancelada'&&!isRequest(l));
       const extra=sunday.length?'<p class="cal19-sunday">Domingo '+fmtDate(sun)+': '+sunday.map(l=>esc(fmtTime(l.start_at)+' '+l.student_name)).join(' • ')+'</p>':'';
       return '<article class="cal19-printpage"><h2>'+fmtDate(start)+' a '+fmtDate(addDays(start,6))+'</h2><div class="cal19-printgrid">'+cards+'</div>'+extra+'</article>';
    }).join('');
  };
  if(!$('appScreen').hidden)calendar();
})();