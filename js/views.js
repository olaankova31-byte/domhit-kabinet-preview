/* Экраны: главная, шаблоны, чек-листы, материалы, обучение. */
(function(){
  const {esc:e,$,$$,icon,state,save,toast,copy,uid}=DH;
  const app=()=>$('#app');
  const head=(eye,title,sub,right='')=>`<div class="page-head"><div><span class="eyebrow">${e(eye)}</span><h1 style="margin-top:12px">${e(title)}</h1>${sub?`<p>${e(sub)}</p>`:''}</div>${right}</div>`;
  const lessonsAll=()=>DH.tracks.flatMap(t=>t.lessons);
  const dealProgress=d=>{
    const cl=DH.checklists.find(c=>c.id===d.type);if(!cl)return {done:0,total:0,pct:0};
    const total=cl.stages.reduce((a,s)=>a+s.items.length,0);
    const done=Object.values(d.checked||{}).filter(Boolean).length;
    return {done,total,pct:total?Math.round(done/total*100):0};
  };

  /* ---------- главная ---------- */
  DH.views={};
  DH.views.home=function(){
    const p=DH.profile();
    const firstName=p&&!p.isSample&&p.name?p.name.split(/\s+/)[0]:'';
    const readCount=state.read.filter(id=>lessonsAll().includes(id)).length;
    const active=state.deals.filter(d=>dealProgress(d).pct<100).slice(0,4);
    app().innerHTML=`
      <section class="dash-hero">
        <span class="eyebrow">Кабинет риелтора ДомХит</span>
        <h1><span>${firstName?'Здравствуйте, '+e(firstName)+',':'Рабочее место риелтора,'}</span><span class="l2">${firstName?'всё для работы в одном месте':'всё под рукой'}</span></h1>
        <p>Тексты для клиентов, шаги сделки, материалы агентства, обучение и личная презентация. Единый стиль для всех специалистов.</p>
      </section>
      <section class="tiles" aria-label="Разделы">
        ${DH.sections.map(s=>`<a class="tile" href="#/${s.id}"><span class="tile-ico">${icon(s.icon)}</span><span><b>${e(s.full)}</b><span class="muted">${e(s.desc)}</span></span></a>`).join('')}
      </section>
      <section class="dash-cols">
        <div class="card">
          <h2 class="sec">Мои сделки</h2>
          ${active.length?`<div>${active.map(d=>{const g=dealProgress(d);return `<a class="row-link" href="#/checklists" data-open-deal="${e(d.id)}"><b>${e(d.title)}</b><span class="muted num">${g.done} из ${g.total}</span><span class="progress"><i style="width:${g.pct}%"></i></span></a>`;}).join('')}</div>`
            :`<p class="muted">Пока нет сделок. Начните чек-лист, и прогресс появится здесь.</p>`}
          <a class="btn btn-soft btn-sm" style="justify-self:start" href="#/checklists">${icon('i-plus')}Новая сделка</a>
        </div>
        <div class="card">
          <h2 class="sec">Моё обучение</h2>
          <div class="row-link" style="border-top:0"><b>Пройдено материалов</b><span class="muted num">${readCount} из ${lessonsAll().length}</span><span class="progress"><i style="width:${Math.round(readCount/lessonsAll().length*100)}%"></i></span></div>
          <a class="btn btn-soft btn-sm" style="justify-self:start" href="#/learning">Продолжить обучение${icon('i-arrow')}</a>
        </div>
      </section>`;
    $$('[data-open-deal]',app()).forEach(a=>a.addEventListener('click',()=>{state.activeDeal=a.dataset.openDeal;save();}));
  };

  /* ---------- шаблоны сообщений ---------- */
  let tGroup='Все',tQuery='',tActive=null;
  const allTemplates=()=>[...state.customTemplates.map(t=>Object.assign({},t,{g:'Мои шаблоны',own:true})),...DH.templates];
  const varsOf=t=>[...new Set([...t.matchAll(/\{([а-яё]+)\}/gi)].map(m=>m[1]))].filter(v=>v!=='риелтор'&&v!=='телефон');

  function renderBubble(t){
    const text=DH.fillProfile(t.text);
    let html=e(text);
    varsOf(t.text).forEach(v=>{
      const val=(state.vals[v]||'').trim();
      html=html.split('{'+v+'}').join(val?e(val):`<mark>${e(DH.varLabels[v]||v)}</mark>`);
    });
    return html;
  }
  function finalText(t){
    let text=DH.fillProfile(t.text);
    varsOf(t.text).forEach(v=>{const val=(state.vals[v]||'').trim();text=text.split('{'+v+'}').join(val||'___');});
    return text;
  }

  DH.views.templates=function(){
    const groups=['Все','Избранное',...(state.customTemplates.length?['Мои шаблоны']:[]),...DH.templateGroups];
    app().innerHTML=head('Шаблоны сообщений','Готовые тексты для клиентов','Выберите шаблон, подставьте данные и отправьте. Имя и телефон берутся из вашей презентации.',
      `<button class="btn btn-dark" type="button" id="tNew">${icon('i-plus')}Свой шаблон</button>`)+`
      <div class="search"><svg aria-hidden="true"><use href="#i-search"/></svg><input class="input" id="tSearch" type="search" placeholder="Поиск по шаблонам" value="${e(tQuery)}" aria-label="Поиск по шаблонам"></div>
      <div class="chips" id="tGroups">${groups.map(g=>`<button class="chip" type="button" aria-pressed="${g===tGroup}" data-g="${e(g)}">${e(g)}</button>`).join('')}</div>
      <div class="split"><div class="t-grid" id="tList"></div><aside class="side card" id="tSide"></aside></div>`;
    drawList();drawSide();
    $('#tSearch').addEventListener('input',ev=>{tQuery=ev.target.value;drawList();});
    $('#tGroups').addEventListener('click',ev=>{
      const b=ev.target.closest('[data-g]');if(!b)return;tGroup=b.dataset.g;
      $$('#tGroups .chip').forEach(x=>x.setAttribute('aria-pressed',x===b));drawList();
    });
    $('#tNew').addEventListener('click',()=>{tActive='__new';drawSide();drawList();$('#tSide').scrollIntoView({block:'nearest'});});
  };
  function drawList(){
    const q=tQuery.trim().toLowerCase();
    const list=allTemplates().filter(t=>
      (tGroup==='Все'||(tGroup==='Избранное'?state.favs.includes(t.id):t.g===tGroup))&&
      (!q||(t.title+' '+t.text).toLowerCase().includes(q)));
    const box=$('#tList');
    box.innerHTML=list.length?list.map(t=>`
      <div class="t-card ${t.id===tActive?'on':''}" role="button" tabindex="0" data-t="${e(t.id)}">
        <button class="star" type="button" data-star="${e(t.id)}" aria-pressed="${state.favs.includes(t.id)}" aria-label="В избранное"><svg aria-hidden="true"><use href="#i-star"/></svg></button>
        <span class="tag gray">${e(t.g)}</span><b>${e(t.title)}</b><p>${e(t.text)}</p>
      </div>`).join(''):`<div class="empty" style="grid-column:1/-1">${tGroup==='Избранное'?'Отмечайте шаблоны звёздочкой, и они появятся здесь.':'Ничего не нашлось. Попробуйте другое слово.'}</div>`;
    box.onclick=ev=>{
      const s=ev.target.closest('[data-star]');
      if(s){
        const id=s.dataset.star,i=state.favs.indexOf(id);
        if(i<0)state.favs.push(id);else state.favs.splice(i,1);
        save();drawList();return;
      }
      const c=ev.target.closest('[data-t]');
      if(c){tActive=c.dataset.t;drawSide();drawList();if(innerWidth<1180)$('#tSide').scrollIntoView({behavior:'smooth',block:'start'});}
    };
    box.onkeydown=ev=>{
      if((ev.key==='Enter'||ev.key===' ')&&ev.target.matches('[data-t]')){ev.preventDefault();ev.target.click();}
    };
  }
  function drawSide(){
    const side=$('#tSide');
    if(tActive==='__new'){
      side.innerHTML=`<h3>Новый шаблон</h3>
        <div class="field"><label for="ntTitle">Название</label><input class="input" id="ntTitle" placeholder="Например: приглашение на показ"></div>
        <div class="field"><label for="ntText">Текст</label><textarea class="input" id="ntText" rows="7" placeholder="Здравствуйте, {клиент}! ..."></textarea></div>
        <p class="muted" style="font-size:13px">Подстановки: {клиент}, {объект}, {адрес}, {цена}, {дата}, {время}, {ссылка}, {риелтор}, {телефон}</p>
        <div class="side-actions"><button class="btn btn-primary" type="button" id="ntSave">Сохранить</button><button class="btn btn-soft" type="button" id="ntCancel">Отмена</button></div>`;
      $('#ntSave').onclick=()=>{
        const title=$('#ntTitle').value.trim(),text=$('#ntText').value.trim();
        if(!title||!text){toast('Заполните название и текст');return;}
        const t={id:'c'+uid(),title,text};state.customTemplates.unshift(t);save();
        tActive=t.id;tGroup='Мои шаблоны';DH.views.templates();toast('Шаблон сохранён');
      };
      $('#ntCancel').onclick=()=>{tActive=null;drawSide();drawList();};
      return;
    }
    const t=allTemplates().find(x=>x.id===tActive);
    if(!t){side.innerHTML=`<h3>Выберите шаблон</h3><p class="muted">Здесь появится текст и поля для данных клиента.</p>`;return;}
    const vars=varsOf(t.text);
    side.innerHTML=`<span class="tag gray">${e(t.g)}</span><h3>${e(t.title)}</h3>
      ${vars.length?`<div class="vars">${vars.map(v=>`<div class="field" ${v==='документы'?'style="grid-column:1/-1"':''}><label for="v-${e(v)}">${e(DH.varLabels[v]||v)}</label>${v==='документы'?`<textarea class="input" rows="3" id="v-${e(v)}" data-v="${e(v)}">${e(state.vals[v]||'')}</textarea>`:`<input class="input" id="v-${e(v)}" data-v="${e(v)}" value="${e(state.vals[v]||'')}">`}</div>`).join('')}</div>`:''}
      <div class="bubble" id="tPreview">${renderBubble(t)}</div>
      <div class="side-actions">
        <button class="btn btn-primary" type="button" id="tCopy">${icon('i-copy')}Скопировать</button>
        <a class="btn btn-soft" id="tWa" target="_blank" rel="noopener">${icon('i-wa')}WhatsApp</a>
        <a class="btn btn-soft" id="tTg" target="_blank" rel="noopener">${icon('i-tg')}Telegram</a>
      </div>
      ${t.own?`<button class="btn btn-soft btn-sm" style="justify-self:start" type="button" id="tDel">${icon('i-trash')}Удалить шаблон</button>`:''}`;
    const links=()=>{
      const txt=encodeURIComponent(finalText(t));
      $('#tWa').href='https://wa.me/?text='+txt;
      $('#tTg').href='https://t.me/share/url?url=&text='+txt;
    };
    links();
    $$('[data-v]',side).forEach(i=>i.addEventListener('input',()=>{state.vals[i.dataset.v]=i.value;save();$('#tPreview').innerHTML=renderBubble(t);links();}));
    $('#tCopy').onclick=()=>copy(finalText(t),'Текст скопирован');
    const del=$('#tDel');
    if(del)del.onclick=()=>{state.customTemplates=state.customTemplates.filter(x=>x.id!==t.id);DH.state.customTemplates=state.customTemplates;save();tActive=null;DH.views.templates();toast('Шаблон удалён');};
  }

  /* ---------- чек-листы ---------- */
  DH.views.checklists=function(){
    if(!state.deals.find(d=>d.id===state.activeDeal))state.activeDeal=state.deals[0]?state.deals[0].id:null;
    app().innerHTML=head('Чек-листы сделок','Шаги сделки под контролем','Заведите сделку и отмечайте шаги. Прогресс сохраняется на этом устройстве. Паспортные данные и другие документы клиента сюда не вносите.')+`
      <p class="note">Черновик для согласования: юрист ДомХит должен проверить шаги перед использованием в работе.</p>
      <div class="split left">
        <div style="display:grid;gap:12px">
          <form class="card" id="dNew" style="display:grid;gap:12px;padding:18px">
            <h3>Новая сделка</h3>
            <div class="field"><label for="dType">Тип</label><select class="input" id="dType">${DH.checklists.map(c=>`<option value="${e(c.id)}">${e(c.title)}</option>`).join('')}</select></div>
            <div class="field"><label for="dTitle">Название</label><input class="input" id="dTitle" placeholder="Например: Иванова, Демышева 10"></div>
            <button class="btn btn-primary" type="submit">${icon('i-plus')}Начать</button>
          </form>
          <div class="deals" id="dList"></div>
        </div>
        <div id="dBody" style="display:grid;gap:10px;min-width:0"></div>
      </div>`;
    $('#dNew').addEventListener('submit',ev=>{
      ev.preventDefault();
      const type=$('#dType').value,cl=DH.checklists.find(c=>c.id===type);
      const title=$('#dTitle').value.trim()||cl.title;
      const d={id:uid(),type,title,checked:{},created:Date.now()};
      state.deals.unshift(d);state.activeDeal=d.id;save();$('#dTitle').value='';drawDeals();
      $('#dBody').scrollIntoView({behavior:'smooth',block:'nearest'});
    });
    drawDeals();
  };
  function drawDeals(){
    const list=$('#dList');
    list.innerHTML=state.deals.map(d=>{
      const g=dealProgress(d),cl=DH.checklists.find(c=>c.id===d.type);
      return `<button class="deal ${d.id===state.activeDeal?'on':''}" type="button" data-d="${e(d.id)}"><b>${e(d.title)}</b><small>${e(cl?cl.title:'')} · ${g.done} из ${g.total}</small><span class="progress"><i style="width:${g.pct}%"></i></span></button>`;
    }).join('');
    list.onclick=ev=>{const b=ev.target.closest('[data-d]');if(b){state.activeDeal=b.dataset.d;save();drawDeals();}};
    const d=state.deals.find(x=>x.id===state.activeDeal),box=$('#dBody');
    if(!d){
      box.innerHTML=`<div style="display:grid;gap:10px"><h2 class="sec">Какие есть чек-листы</h2>${DH.checklists.map(c=>`<div class="card" style="padding:16px 20px"><h3>${e(c.title)}</h3><p class="muted">${e(c.desc)}, шагов: ${c.stages.reduce((a,s)=>a+s.items.length,0)}</p></div>`).join('')}</div>`;
      return;
    }
    const cl=DH.checklists.find(c=>c.id===d.type),g=dealProgress(d);
    box.innerHTML=`
      <div class="card" style="display:grid;gap:10px;padding:20px 22px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
          <div><span class="tag gray">${e(cl.title)}</span><h2 class="sec" style="margin-top:8px">${e(d.title)}</h2></div>
          <button class="icon-btn" type="button" id="dDel" aria-label="Удалить сделку">${icon('i-trash')}</button>
        </div>
        <div class="progress"><i id="dBar" style="width:${g.pct}%"></i></div>
        <span class="muted num" id="dCount">Выполнено ${g.done} из ${g.total}</span>
      </div>
      ${cl.stages.map((s,si)=>{
        const ids=s.items.map((_,ii)=>si+'-'+ii),done=ids.filter(id=>d.checked[id]).length;
        return `<details class="stage" ${done<ids.length?'open':''}><summary>${e(s.t)}<span class="num" data-stage="${si}">${done} из ${ids.length}</span></summary>
          ${s.items.map((it,ii)=>{const id=si+'-'+ii;return `<label class="task"><input type="checkbox" data-c="${id}" ${d.checked[id]?'checked':''}><div><b>${e(it.t)}</b>${it.h?`<small>${e(it.h)}</small>`:''}</div></label>`;}).join('')}
        </details>`;
      }).join('')}`;
    box.onchange=ev=>{
      const c=ev.target.closest('[data-c]');if(!c)return;
      if(c.checked)d.checked[c.dataset.c]=true;else delete d.checked[c.dataset.c];
      save();
      const n=dealProgress(d);$('#dBar').style.width=n.pct+'%';$('#dCount').textContent=`Выполнено ${n.done} из ${n.total}`;
      const si=c.dataset.c.split('-')[0],tot=cl.stages[si].items.length;
      const dn=Object.keys(d.checked).filter(k=>k.startsWith(si+'-')).length;
      $(`[data-stage="${si}"]`,box).textContent=`${dn} из ${tot}`;
      const it=$(`.deal[data-d="${d.id}"]`);
      if(it){$('small',it).textContent=`${cl.title} · ${n.done} из ${n.total}`;$('i',it).style.width=n.pct+'%';}
      if(n.pct===100)toast('Сделка завершена, поздравляем!');
    };
    $('#dDel').onclick=()=>{
      const btn=$('#dDel');
      if(btn.dataset.sure){state.deals=state.deals.filter(x=>x.id!==d.id);DH.state.deals=state.deals;state.activeDeal=null;save();drawDeals();toast('Сделка удалена');}
      else{btn.dataset.sure='1';toast('Нажмите ещё раз, чтобы удалить сделку');setTimeout(()=>{delete btn.dataset.sure;},3000);}
    };
  }

  /* ---------- материалы компании ---------- */
  DH.views.materials=function(){
    const photos=[['assets/sea.webp','Побережье, сток'],['assets/hero_poster.webp','Офис в Евпатории']];
    app().innerHTML=head('Материалы компании','Всё об агентстве в одном месте','Логотип, цвета, контакты, тексты и документы. Берите отсюда, чтобы у всех специалистов было одинаково.')+`
      <div class="mat-grid">
        <div class="card"><h3>Логотип</h3>
          <div class="logo-prev"><img src="assets/logo.svg" alt="Знак ДомХит"></div>
          <div class="side-actions"><a class="btn btn-soft btn-sm" href="assets/logo.svg" download="domhit-znak.svg">${icon('i-down')}Знак SVG</a><a class="btn btn-soft btn-sm" href="assets/logo_text.svg" download="domhit-nadpis.svg">${icon('i-down')}Надпись SVG</a></div>
        </div>
        <div class="card wide"><h3>Цвета и шрифт</h3>
          <div class="swatches">${DH.colors.map(c=>`<button class="swatch" type="button" data-hex="${c.hex}" style="background:${c.hex};color:${c.fg};${c.hex==='#F3F3F1'?'box-shadow:inset 0 0 0 1px var(--line)':''}"><b style="font-weight:500">${e(c.name)}</b><span class="num">${c.hex}</span></button>`).join('')}</div>
          <p class="muted" style="font-size:14px">Шрифт Onest: заголовки тонким начертанием, текст обычным. Нажмите на цвет, чтобы скопировать код.</p>
        </div>
        <div class="card wide"><h3>Контакты офисов</h3>
          <div class="offices">${DH.offices.map(o=>`<div class="off"><div><b>${e(o.city)}</b><small>${e(o.addr)}</small></div><span class="num tel-t">${e(o.tel)}</span><button class="icon-btn" type="button" data-copy="${e(o.city+', '+o.addr+', '+o.tel)}" aria-label="Скопировать контакты">${icon('i-copy')}</button></div>`).join('')}</div>
        </div>
        <div class="card"><h3>Цифры об агентстве</h3>
          <ul style="display:grid;gap:8px"><li><b style="font-weight:500">≈4 000</b> объектов в базе</li><li><b style="font-weight:500">5</b> офисов в трёх городах</li><li><b style="font-weight:500">100+</b> специалистов</li><li><b style="font-weight:500">С 2018</b> года на рынке Крыма</li></ul>
          <p class="muted" style="font-size:13px">Цифры взяты с сайта агентства.</p>
        </div>
        ${DH.companyTexts.map(t=>`<div class="card"><h3>${e(t.title)}</h3><div class="textblock">${e(DH.fillProfile(t.text))}</div><button class="btn btn-soft btn-sm" style="justify-self:start" type="button" data-copy="${e(DH.fillProfile(t.text))}">${icon('i-copy')}Скопировать</button></div>`).join('')}
        <div class="card"><h3>Фото для материалов</h3>
          <div class="photo-row">${photos.map(([src,alt])=>`<a href="${src}" download title="${e(alt)}"><img src="${src}" alt="${e(alt)}" loading="lazy"><span>${icon('i-down')}</span></a>`).join('')}</div>
          <p class="muted" style="font-size:13px">Перед внешним использованием проверьте права на фото.</p>
        </div>
        <div class="card wide"><h3>Документы</h3>
          <p class="muted" style="font-size:14px">Здесь будут актуальные бланки агентства. Файлы нужно получить от ДомХит.</p>
          <div>${DH.documents.map(d=>`<div class="doc"><span>${e(d)}</span><span class="tag warn">Нужен файл</span></div>`).join('')}</div>
        </div>
      </div>`;
    app().onclick=ev=>{
      const c=ev.target.closest('[data-copy]');if(c){copy(c.dataset.copy);return;}
      const s=ev.target.closest('[data-hex]');if(s)copy(s.dataset.hex,'Код цвета скопирован');
    };
  };

  /* ---------- обучение ---------- */
  let lQuery='',lCat='Все';
  DH.views.learning=function(){
    const cats=['Все',...new Set(DH.articles.map(a=>a.cat))];
    const titleOf=id=>(DH.articles.find(a=>a.id===id)||{}).title||id;
    app().innerHTML=head('Обучение и база знаний','Учитесь и находите ответы','Короткие материалы для работы с клиентом, документами и деньгами.')+`
      <section style="display:grid;gap:14px"><h2 class="sec">Курсы</h2>
        <div class="track-grid">${DH.tracks.map(t=>{
          const done=t.lessons.filter(l=>state.read.includes(l)).length;
          return `<div class="track"><span class="tag gray">${e(t.desc)}</span><h3>${e(t.title)}</h3>
            <div class="progress"><i style="width:${Math.round(done/t.lessons.length*100)}%"></i></div>
            <span class="muted num" style="font-size:13px">Пройдено ${done} из ${t.lessons.length}</span>
            <div>${t.lessons.map(l=>`<a class="lesson ${state.read.includes(l)?'done':''}" href="#/learning/${e(l)}"><i></i><span>${e(titleOf(l))}</span></a>`).join('')}</div></div>`;
        }).join('')}</div>
      </section>
      <section style="display:grid;gap:14px"><h2 class="sec">База знаний</h2>
        <div class="search"><svg aria-hidden="true"><use href="#i-search"/></svg><input class="input" id="lSearch" type="search" placeholder="Например: задаток, ИЖС, маткапитал" value="${e(lQuery)}" aria-label="Поиск по базе знаний"></div>
        <div class="chips" id="lCats">${cats.map(c=>`<button class="chip" type="button" aria-pressed="${c===lCat}" data-c="${e(c)}">${e(c)}</button>`).join('')}</div>
        <div class="art-grid" id="lList"></div>
      </section>`;
    const draw=()=>{
      const q=lQuery.trim().toLowerCase();
      const txt=a=>(a.title+' '+a.body.map(b=>[b.h,b.p,(b.ul||[]).join(' ')].join(' ')).join(' ')).toLowerCase();
      const list=DH.articles.filter(a=>(lCat==='Все'||a.cat===lCat)&&(!q||txt(a).includes(q)));
      $('#lList').innerHTML=list.length?list.map(a=>`<a class="art-card" href="#/learning/${e(a.id)}"><span class="tag">${e(a.cat)}</span><h3>${e(a.title)}</h3><span class="meta"><span>${a.min} мин</span>${state.read.includes(a.id)?'<span>Прочитано</span>':''}</span></a>`).join(''):`<div class="empty" style="grid-column:1/-1">Ничего не нашлось. Попробуйте другое слово.</div>`;
    };
    draw();
    $('#lSearch').addEventListener('input',ev=>{lQuery=ev.target.value;draw();});
    $('#lCats').addEventListener('click',ev=>{const b=ev.target.closest('[data-c]');if(!b)return;lCat=b.dataset.c;$$('#lCats .chip').forEach(x=>x.setAttribute('aria-pressed',x===b));draw();});
  };
  DH.views.article=function(id){
    const a=DH.articles.find(x=>x.id===id);
    if(!a){location.hash='#/learning';return;}
    const isRead=state.read.includes(a.id);
    app().innerHTML=`<article class="article">
      <a class="back" href="#/learning">${icon('i-left')}Обучение</a>
      <span class="tag">${e(a.cat)} · ${a.min} мин</span>
      <h1>${e(a.title)}</h1>
      ${a.legal?`<p class="note">Черновик: юрист ДомХит должен проверить этот материал. Правила меняются, в спорных случаях сразу подключайте юриста.</p>`:''}
      ${a.body.map(b=>`${b.h?`<h2>${e(b.h)}</h2>`:''}${b.p?`<p>${e(b.p)}</p>`:''}${b.ul?`<ul>${b.ul.map(i=>`<li><span>${e(i)}</span></li>`).join('')}</ul>`:''}`).join('')}
      <div class="side-actions" style="margin-top:8px"><button class="btn ${isRead?'btn-soft':'btn-primary'}" type="button" id="aRead">${isRead?'Отметить как непрочитанное':'Отметить как прочитанное'}</button></div>
    </article>`;
    $('#aRead').onclick=()=>{
      const i=state.read.indexOf(a.id);
      if(i<0){state.read.push(a.id);toast('Отмечено');}else state.read.splice(i,1);
      save();DH.views.article(id);
    };
  };
})();
