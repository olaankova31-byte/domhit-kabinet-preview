/* Семь слайдов презентации риелтора. Вход — профиль, выход — HTML. Все поля экранируются. */
(function(){
  const e=DH.esc;
  const initials=n=>String(n||'').trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
  const bg=p=>p.photo&&/^data:image\//.test(p.photo)?`style="background-image:url('${p.photo}')"`:'';
  const brand=`<span class="s-brand"><svg aria-hidden="true"><use href="#i-mark"/></svg>ДомХит</span>`;
  const foot=p=>`<div class="s-foot">${brand}<span>${e(p.name)}${p.phone?' · '+e(p.phone):''}</span></div>`;
  const head=(eye,title)=>`<span class="s-eyebrow">${e(eye)}</span><h2>${e(title)}</h2>`;

  const hasCases=p=>(p.cases||[]).some(c=>c.title&&c.title.trim());
  function qrTarget(p){
    if(p.link)return p.link;
    return ['BEGIN:VCARD','VERSION:3.0','FN:'+p.name,'ORG:ДомХит','TEL:'+p.phone,p.email?'EMAIL:'+p.email:'','END:VCARD'].filter(Boolean).join('\n');
  }
  function qrSvg(p){
    try{
      qrcode.stringToBytes=qrcode.stringToBytesFuncs['UTF-8'];
      const q=qrcode(0,'M');q.addData(qrTarget(p),'Byte');q.make();
      return q.createSvgTag({cellSize:4,margin:0,scalable:true});
    }catch(err){return '';}
  }
  const waLink=v=>'https://wa.me/'+String(v).replace(/\D/g,'');
  const tgLink=v=>'https://t.me/'+String(v).replace(/^@/,'').replace(/^https?:\/\/t\.me\//,'');

  /* Сделки по годам из строки вида «2023: 14, 2024: 18». Меньше двух лет — графика нет. */
  function yearBars(v){
    const m=new Map();
    for(const r of String(v||'').matchAll(/(\d{4})[\s:\-–—]+(\d+)/g))m.set(r[1],+r[2]);
    const rows=[...m].sort((x,y)=>x[0]-y[0]).slice(-8);
    return rows.length>1&&rows.some(r=>r[1]>0)?rows:null;
  }
  function chart(rows){
    const max=Math.max(...rows.map(r=>r[1]));
    return `<div class="chart" role="img" aria-label="Сделки по годам: ${e(rows.map(r=>r[0]+' — '+r[1]).join(', '))}">${rows.map((r,i)=>`<div class="bar ${i===rows.length-1?'last':''}" style="--v:${Math.round(r[1]/max*84)};--d:${i}"><div class="col"><i></i><em class="num">${r[1]}</em></div><span class="num">${e(r[0])}</span></div>`).join('')}</div>`;
  }
  const firstNum=v=>{const m=String(v||'').match(/\d[\d\s]*/);return m?parseInt(m[0].replace(/\s/g,''),10):0;};
  /* Кольцо только там, где у цифры есть шкала: проценты или оценка до 5. Остальное показываем просто числом. */
  function ringValue(p){
    const t=String(p.third||'').trim();
    if(/^\d{1,3}([.,]\d+)?\s*%$/.test(t))return Math.min(100,parseFloat(t.replace(',','.')));
    if(/^[0-5]([.,]\d+)?$/.test(t)&&/оцен|рейтинг/i.test(p.thirdLabel||''))return parseFloat(t.replace(',','.'))*20;
    return null;
  }

  /* Карта Крыма: контур и города по настоящим координатам, число офисов из материалов компании */
  const geo=(lon,lat)=>[(lon-32.3)*71,(46.25-lat)*100];
  const coast=[[33.67,46.1],[33.76,46.03],[33.98,45.86],[34.3,45.8],[34.62,45.6],[34.98,45.42],[35.33,45.31],[35.75,45.44],[36.1,45.47],[36.35,45.46],[36.62,45.39],[36.5,45.25],[36.45,45.09],[36.1,45.02],[35.75,45.02],[35.42,45.1],[35.38,45.0],[35.15,44.93],[34.95,44.83],[34.6,44.76],[34.42,44.65],[34.28,44.53],[34.05,44.43],[33.75,44.39],[33.55,44.5],[33.38,44.58],[33.52,44.72],[33.56,44.93],[33.38,45.13],[33.25,45.17],[32.98,45.34],[32.55,45.33],[32.5,45.42],[32.72,45.53],[32.98,45.62],[33.25,45.84],[33.56,45.93],[33.6,46.05]].map(c=>geo(c[0],c[1]));
  const coastPath=(()=>{
    const mid=(u,v)=>[(u[0]+v[0])/2,(u[1]+v[1])/2],n=coast.length,fx=c=>c[0].toFixed(1)+' '+c[1].toFixed(1);
    let d='M'+fx(mid(coast[n-1],coast[0]));
    coast.forEach((c,i)=>{d+='Q'+fx(c)+' '+fx(mid(c,coast[(i+1)%n]));});
    return d+'Z';
  })();
  const cityGeo={'Евпатория':[33.37,45.19,'end'],'Симферополь':[34.1,44.95,'start'],'Севастополь':[33.52,44.6,'end']};
  const officesWord=n=>n%10===1&&n%100!==11?'офис':n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?'офиса':'офисов';
  function crimeaMap(){
    const count={};DH.offices.forEach(o=>{count[o.city]=(count[o.city]||0)+1;});
    const pts=Object.keys(count).filter(c=>cityGeo[c]).map(c=>({c,n:count[c],xy:geo(cityGeo[c][0],cityGeo[c][1]),anchor:cityGeo[c][2]}));
    const hub=pts.find(x=>x.c==='Симферополь')||pts[0];
    return `<svg class="map" viewBox="0 0 320 195" role="img" aria-label="${e('Офисы: '+pts.map(x=>x.c+' — '+x.n).join(', '))}">
      <path class="land" d="${coastPath}" pathLength="1"/>
      ${pts.filter(x=>x!==hub).map(x=>`<line class="link" x1="${hub.xy[0].toFixed(1)}" y1="${hub.xy[1].toFixed(1)}" x2="${x.xy[0].toFixed(1)}" y2="${x.xy[1].toFixed(1)}"/>`).join('')}
      ${pts.map((x,i)=>{
        const [cx,cy]=x.xy.map(v=>+v.toFixed(1)),dx=x.anchor==='end'?-9:9;
        return `<g class="pin" style="--d:${i}"><circle class="pulse" cx="${cx}" cy="${cy}" r="${3+x.n}"/><circle class="dot" cx="${cx}" cy="${cy}" r="${2.4+x.n*.6}"/>
        <text x="${cx+dx}" y="${cy-1}" text-anchor="${x.anchor}"><tspan class="c">${e(x.c)}</tspan><tspan class="n" x="${cx+dx}" dy="11">${x.n} ${officesWord(x.n)}</tspan></text></g>`;
      }).join('')}
    </svg>`;
  }

  const isNew=p=>p.level==='new';
  const tick=`<span class="tick"><svg aria-hidden="true"><use href="#i-check"/></svg></span>`;
  const teamIcons=['i-folder','i-home','i-chat'];

  /* Слайды начинающего: вместо личного опыта — команда, вместо кейсов — как проверяем объект */
  const altSlides={
    2:p=>{
      const team=(p.team||DH.teamDefault).filter(m=>m.t);
      const skills=(p.achievements||[]).filter(Boolean);
      return `<div class="s">${head('Команда','Вы работаете не только со мной')}
      <div class="s-body team ${skills.length?'':'no-ach'}" style="--n:${team.length||1}">
        ${team.map((m,i)=>`<div class="member rise" style="--d:${i+1}"><span class="ico"><svg aria-hidden="true"><use href="#${teamIcons[i%3]}"/></svg></span><div><b>${e(m.t)}</b><span>${e(m.d)}</span></div></div>`).join('')}
        <div class="team-band rise" style="--d:${team.length+1}">
          <div><b class="num" data-count>100+</b><span>специалистов в команде</span></div>
          <div><b class="num" data-count>${DH.offices.length}</b><span>офисов в трёх городах Крыма</span></div>
          <div><b class="num" data-count>≈4 000</b><span>объектов в базе</span></div>
        </div>
        ${skills.length?`<div class="ach rise" style="--d:${team.length+2}"><h3>Моё обучение и навыки</h3><ul>${skills.map((a,i)=>`<li class="rise" style="--d:${team.length+3+i}">${tick}${e(a)}</li>`).join('')}</ul></div>`:''}
      </div>${foot(p)}</div>`;
    },
    4:p=>{
      const c=(p.cases||[]).find(x=>x.title&&x.title.trim());
      return `<div class="s">${head('Безопасность сделки','Как мы проверяем объект')}
      <div class="s-body check ${c?'with-case':''}">
        <ul class="check-list">${DH.checkItems.map((t,i)=>`<li class="rise" style="--d:${i+1}">${tick}<span>${e(t)}</span></li>`).join('')}</ul>
        ${c?`<div class="case rise" style="--d:9"><span class="s-eyebrow">Из моей практики</span><h3>${e(c.title)}</h3>
          <dl><div><dt>Задача</dt><dd>${e(c.task)}</dd></div><div><dt>Что сделали</dt><dd>${e(c.done)}</dd></div></dl>
          ${c.result?`<div class="res">${tick}${e(c.result)}</div>`:''}</div>`:''}
      </div>${foot(p)}</div>`;
    }
  };

  const slides=[
    p=>{
      /* У начинающего на первом экране цифры агентства, и подпись прямо говорит, что они не личные */
      const nums=isNew(p)?[['≈4 000','объектов в базе'],['100+','специалистов в команде'],['с 2018','года на рынке Крыма']]:[[p.years,'лет в недвижимости'],[p.deals,'проведённых сделок'],[p.third,p.thirdLabel]].filter(n=>n[0]);
      return `<div class="s s1"><i class="kb"></i>
      <div class="in">
        <span class="s-brand"><svg aria-hidden="true" style="color:#fff"><use href="#i-mark"/></svg>ДомХит</span>
        <div class="hero">
          <span class="s-eyebrow">Ваш специалист по недвижимости в Крыму</span>
          <h1 class="${String(p.name||'').length>24?'long':''}">${e(p.name)}</h1>
          <p class="role rise" style="--d:2">${e(p.role)}</p>
          ${p.tagline?`<p class="tagline rise" style="--d:3">${e(p.tagline)}</p>`:''}
          ${isNew(p)?`<p class="hero-note rise" style="--d:4">Со мной работает команда «ДомХит»</p>`:''}
          ${nums.length?`<div class="hero-nums ${isNew(p)?'with-note':''}">${nums.map((n,i)=>`<div class="rise" style="--d:${4+i}"><b class="num" ${/^с /.test(n[0])?'':'data-count'}>${e(n[0])}</b><span>${e(n[1])}</span></div>`).join('')}</div>`:''}
        </div>
        <div class="pwrap rise" style="--d:2">
          <div class="portrait" ${bg(p)}>${p.photo?'':e(initials(p.name))}</div>
        </div>
      </div>
    </div>`;
    },

    p=>{
      const items=DH.specs.filter(s=>(p.specs||[]).includes(s.id));
      const areas=String(p.areas||'').split(/[,;]/).map(x=>x.trim()).filter(Boolean);
      return `<div class="s">${head('Специализация','С чем я работаю')}
      <div class="s-body spec-body">
        <div class="spec-grid" style="--cols:${items.length===4?2:Math.min(items.length,3)}">${items.map((s,i)=>`<div class="spec rise" style="--d:${i+1}"><svg class="ghost" aria-hidden="true"><use href="#${s.icon}"/></svg><span class="ico"><svg aria-hidden="true"><use href="#${s.icon}"/></svg></span><div><b>${e(s.t)}</b><span>${e(s.d)}</span></div></div>`).join('')}</div>
        ${areas.length?`<div class="areas rise" style="--d:${items.length+1}"><span class="lbl">Районы</span>${areas.map(a=>`<span class="area">${e(a)}</span>`).join('')}</div>`:''}
      </div>${foot(p)}</div>`;
    },

    p=>{
      const rows=yearBars(p.dealsByYear),ring=ringValue(p),ach=(p.achievements||[]).filter(Boolean);
      const y=firstNum(p.years),d=firstNum(p.deals),avg=y&&d?Math.round(d/y):0;
      return `<div class="s">${head('Опыт','Опыт в цифрах')}
      <div class="s-body exp ${p.third?'':'no-third'} ${ach.length?'':'no-ach'}">
        <div class="exp-card exp-deals rise" style="--d:1">
          <div class="exp-head"><b class="big num" data-count>${e(p.deals||'—')}</b><span>проведённых сделок${rows?'<br>и как они шли по годам':''}</span></div>
          ${rows?chart(rows):''}
        </div>
        <div class="exp-card exp-years rise" style="--d:2">
          <div><b class="big num" data-count>${e(p.years||'—')}</b><span>лет в недвижимости</span></div>
          ${avg?`<small class="num">В среднем около ${avg} ${avg%10===1&&avg%100!==11?'сделки':'сделок'} в год</small>`:''}
        </div>
        ${p.third?`<div class="exp-card exp-third rise" style="--d:3">${ring!=null?`<div class="ring"><svg viewBox="0 0 36 36" aria-hidden="true"><circle class="track" cx="18" cy="18" r="15.9" pathLength="100"/><circle class="val" cx="18" cy="18" r="15.9" pathLength="100" style="--p:${ring.toFixed(1)}"/></svg><b class="num" data-count>${e(p.third)}</b></div>`:`<b class="big num" data-count>${e(p.third)}</b>`}<span>${e(p.thirdLabel)}</span></div>`:''}
        ${ach.length?`<div class="ach rise" style="--d:4"><h3>Достижения и компетенции</h3>
          <ul>${ach.map((a,i)=>`<li class="rise" style="--d:${5+i}"><span class="tick"><svg aria-hidden="true"><use href="#i-check"/></svg></span>${e(a)}</li>`).join('')}</ul>
        </div>`:''}
      </div>${foot(p)}</div>`;
    },

    p=>`<div class="s">${head('Подход к работе','Что я беру на себя')}
      <div class="s-body steps"><span class="rail"><i></i></span>${(p.approach||[]).map((a,i)=>`<div class="step rise" style="--d:${i*2+1}"><span class="node num">${i+1}</span><div class="step-card"><span class="ghost-n num" aria-hidden="true">${i+1}</span><b>${e(a.t)}</b><p>${e(a.d)}</p></div></div>`).join('')}</div>
      ${foot(p)}</div>`,

    p=>`<div class="s">${head('Кейсы','Примеры из практики')}
      <div class="s-body cases">${!hasCases(p)?`<p class="muted" style="grid-column:1/-1;align-self:center;text-align:center;font-size:calc(var(--u) * 1.8)">Заполните кейсы в форме. Пока их нет, этого слайда не будет у клиента.</p>`:''}${(p.cases||[]).filter(c=>c.title).map((c,i)=>`<div class="case rise" style="--d:${i*2+1}"><span class="idx num">0${i+1}</span><h3>${e(c.title)}</h3>
        <dl><div><dt>Задача</dt><dd>${e(c.task)}</dd></div><div><dt>Что сделали</dt><dd>${e(c.done)}</dd></div></dl>
        ${c.result?`<div class="res rise" style="--d:${i*2+3}"><span class="tick"><svg aria-hidden="true"><use href="#i-check"/></svg></span>${e(c.result)}</div>`:''}</div>`).join('')}</div>
      ${foot(p)}</div>`,

    p=>`<div class="s s6"><div class="l">${head('Компания','Почему я работаю в «ДомХит»')}
        ${p.why?`<p class="why rise" style="--d:1">${e(p.why)}</p>`:''}
        <div class="facts">
          <div class="rise" style="--d:2"><b class="num" data-count>≈4 000</b><span>объектов в базе</span></div>
          <div class="rise" style="--d:3"><b class="num" data-count>${DH.offices.length}</b><span>офисов в трёх городах Крыма</span></div>
          <div class="rise" style="--d:4"><b class="num" data-count>100+</b><span>специалистов в команде</span></div>
          <div class="rise" style="--d:5"><b class="num">с 2018</b><span>года на рынке Крыма</span></div>
        </div>
        <div class="s-foot" style="right:auto;width:44%">${brand}</div>
      </div><div class="r"><div class="r-in"><span class="s-eyebrow">Где нас найти</span>${crimeaMap()}</div></div></div>`,

    p=>{
      const q=qrSvg(p);
      return `<div class="s s7">
      <svg class="marks" viewBox="0 0 94.7 94.2" aria-hidden="true"><path pathLength="1" d="M0,27.7v66.4h41.3c25.3,0,46-20.7,46-46V36.5L76.1,47v1.1C76.1,67.3,60.5,83,41.3,83H11.2V33.9l32.6-20.6l18.6,11.8l8.4-7.9L43.8,0L0,27.7z"/><polygon pathLength="1" points="94.7,20.8 86,11.7 44.3,50.8 34.5,40.3 25.3,48.9 43.8,68.6"/></svg>
      <span class="s-eyebrow">Контакты</span><h2>Обсудим вашу задачу</h2>
      <div class="grid">
        <div class="contact-list">
          <div class="who rise" style="--d:1"><span class="ava" ${bg(p)}>${p.photo?'':e(initials(p.name))}</span><div><b>${e(p.name)}</b><span>${e(p.office||p.role)}</span></div></div>
          ${p.phone?`<div class="tel num rise" style="--d:2">${e(p.phone)}</div>`:''}
          <div class="c-pills rise" style="--d:3">
            ${p.whatsapp?`<a class="c-pill" href="${e(waLink(p.whatsapp))}" target="_blank" rel="noopener">WhatsApp</a>`:''}
            ${p.telegram?`<a class="c-pill" href="${e(tgLink(p.telegram))}" target="_blank" rel="noopener">Telegram</a>`:''}
            ${p.email?`<a class="c-pill" href="mailto:${e(p.email)}">${e(p.email)}</a>`:''}
          </div>
        </div>
        ${q?`<div class="qr rise" style="--d:4">${q}<span>${p.link?'Наведите камеру, чтобы открыть ссылку':'Наведите камеру, чтобы сохранить контакт'}</span></div>`:''}
      </div>
      <div class="s-foot">${brand}</div></div>`;
    }
  ];

  /* Анимация. Без класса play слайд сразу в готовом виде: так он выглядит в миниатюрах и PDF. */
  const calm=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function countUp(el){
    const final=el.textContent,m=final.match(/^(\D*)(\d[\d\s]*)([.,]\d+)?(.*)$/);
    if(!m)return;
    const int=parseInt(m[2].replace(/\s/g,''),10),dec=m[3]?m[3].slice(1):'',sep=m[3]?m[3][0]:'';
    const target=int+(dec?+('0.'+dec):0),spaced=/\s/.test(m[2].trim());
    const t0=performance.now()+250,len=1300;
    const fmt=v=>{
      const whole=Math.floor(v),w=spaced?whole.toLocaleString('ru-RU'):String(whole);
      return m[1]+w+(dec?sep+(v-whole).toFixed(dec.length).slice(2):'')+m[4];
    };
    el.textContent=fmt(0);
    requestAnimationFrame(function tick(now){
      if(!el.isConnected)return;
      const x=Math.min(1,Math.max(0,(now-t0)/len));
      if(x>=1){el.textContent=final;return;}
      el.textContent=fmt(target*(1-Math.pow(1-x,3)));
      requestAnimationFrame(tick);
    });
  }
  DH.playSlide=function(slide){
    if(!slide||calm())return;
    slide.classList.remove('pending');slide.classList.add('play');
    DH.$$('[data-count]',slide).forEach(countUp);
  };

  DH.slideCount=slides.length;
  DH.slideHtml=(p,i)=>`<div class="slide">${((isNew(p)&&altSlides[i])||slides[i])(p)}${p.isSample?'<span class="s-sample">Образец, данные вымышленные</span>':''}</div>`;
  DH.activeSlides=p=>slides.map((_,i)=>i).filter(i=>i!==4||isNew(p)||hasCases(p));
  DH.allSlidesHtml=p=>DH.activeSlides(p).map(i=>DH.slideHtml(p,i)).join('');
  DH.slideTitles=p=>['Знакомство','Специализация',isNew(p)?'Команда':'Опыт','Подход',isNew(p)?'Проверка объекта':'Кейсы','Компания','Контакты'];

  /* Печать в PDF: складываем все слайды в отдельный контейнер */
  DH.printDeck=function(p){
    const prev=document.title;
    document.title='Презентация — '+(p.name||'риелтор');
    DH.$('#printRoot').innerHTML=DH.allSlidesHtml(p);
    window.addEventListener('afterprint',()=>{document.title=prev;},{once:true});
    setTimeout(()=>window.print(),120);
  };

  /* Просмотр на весь экран. client:true — режим для клиента по ссылке, без кнопки выхода в кабинет */
  DH.openDeck=function(p,{client=false,start=0}={}){
    const deck=DH.$('#deck');const list=DH.activeSlides(p);let i=Math.max(0,list.indexOf(start));
    const isFeed=()=>matchMedia('(max-width:640px) and (orientation:portrait)').matches;
    function draw(){
      deck.innerHTML=`
        <div class="deck-top">
          <div><b>${e(p.name)}</b><small>${e(p.role)}, «ДомХит»</small></div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-glass btn-sm" type="button" data-pdf>${DH.icon('i-down')}PDF</button>
            ${client?'':`<button class="icon-btn" type="button" data-close aria-label="Закрыть">${DH.icon('i-close')}</button>`}
          </div>
        </div>
        <div class="deck-stage"><div class="deck-slide ${isFeed()?'feed':''}">${isFeed()?DH.allSlidesHtml(p):DH.slideHtml(p,list[i])}</div></div>
        <div class="deck-bottom">
          <div class="nav-arrows" style="display:flex;gap:8px"><button class="icon-btn" type="button" data-prev aria-label="Назад">${DH.icon('i-left')}</button><button class="icon-btn" type="button" data-next aria-label="Вперёд">${DH.icon('i-right')}</button></div>
          <div class="deck-dots">${list.map((n,k)=>`<button type="button" class="${k===i?'on':''}" data-go="${k}" aria-label="${e(DH.slideTitles(p)[n])}"></button>`).join('')}</div>
        </div>`;
      startMotion();
    }
    /* На экране просмотра слайд оживает сразу, в ленте на телефоне — когда до него долистали */
    function startMotion(){
      if(deck._io){deck._io.disconnect();deck._io=null;}
      const all=DH.$$('.deck-slide .slide',deck);
      if(!isFeed()){DH.playSlide(all[0]);return;}
      if(calm()||!('IntersectionObserver' in window))return;
      all.forEach(s=>s.classList.add('pending'));
      deck._io=new IntersectionObserver(items=>items.forEach(it=>{
        if(it.isIntersecting){deck._io.unobserve(it.target);DH.playSlide(it.target);}
      }),{threshold:.12});
      all.forEach(s=>deck._io.observe(s));
    }
    function go(n){i=Math.max(0,Math.min(list.length-1,n));draw();}
    deck._click=ev=>{
      const t=ev.target.closest('button');if(!t)return;
      if(t.hasAttribute('data-prev'))go(i-1);
      else if(t.hasAttribute('data-next'))go(i+1);
      else if(t.dataset.go!=null)go(+t.dataset.go);
      else if(t.hasAttribute('data-pdf'))DH.printDeck(p);
      else if(t.hasAttribute('data-close'))close();
    };
    deck._key=ev=>{
      if(ev.key==='ArrowRight'||ev.key===' '){ev.preventDefault();go(i+1);}
      else if(ev.key==='ArrowLeft')go(i-1);
      else if(ev.key==='Escape'&&!client)close();
    };
    let sx=null;
    deck._ts=ev=>{sx=ev.touches[0].clientX;};
    deck._te=ev=>{if(sx==null||isFeed())return;const d=ev.changedTouches[0].clientX-sx;if(Math.abs(d)>50)go(i+(d<0?1:-1));sx=null;};
    /* На телефоне адресная строка при прокрутке меняет высоту окна: перерисовываем, только если сменился вид */
    let wasFeed=isFeed();
    deck._rs=()=>{if(isFeed()!==wasFeed){wasFeed=isFeed();draw();}};
    function close(){
      if(deck._io){deck._io.disconnect();deck._io=null;}
      deck.hidden=true;deck.innerHTML='';document.body.style.overflow='';
      deck.removeEventListener('click',deck._click);document.removeEventListener('keydown',deck._key);
      deck.removeEventListener('touchstart',deck._ts);deck.removeEventListener('touchend',deck._te);window.removeEventListener('resize',deck._rs);
    }
    draw();deck.hidden=false;document.body.style.overflow='hidden';
    deck.addEventListener('click',deck._click);document.addEventListener('keydown',deck._key);
    deck.addEventListener('touchstart',deck._ts,{passive:true});deck.addEventListener('touchend',deck._te,{passive:true});
    window.addEventListener('resize',deck._rs);
  };
})();
