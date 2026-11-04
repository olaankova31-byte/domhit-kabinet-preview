/* Конструктор презентации риелтора: форма слева, живые слайды справа. */
(function(){
  const {esc:e,$,$$,icon,state,save,toast,copy,uid}=DH;
  let cur=0,played=-1;

  const input=(key,label,ph='',attrs='')=>`<div class="field"><label for="f-${key}">${e(label)}</label><input class="input" id="f-${key}" data-k="${key}" placeholder="${e(ph)}" ${attrs}></div>`;
  const area=(key,label,rows=3,ph='')=>`<div class="field"><label for="f-${key}">${e(label)}</label><textarea class="input" id="f-${key}" data-k="${key}" rows="${rows}" placeholder="${e(ph)}"></textarea></div>`;
  const fold=(n,title,body,open)=>`<details class="fold" data-slide="${n-1}" ${open?'open':''}><summary><i>${n}</i>${e(title)}${icon('i-right')}</summary><div class="fold-body">${body}</div></details>`;

  function get(p,key){return key.split('.').reduce((o,k)=>o==null?'':o[k],p);}
  function set(p,key,v){const parts=key.split('.');let o=p;for(let i=0;i<parts.length-1;i++)o=o[parts[i]];o[parts[parts.length-1]]=v;}

  DH.views.presentation=function(){
    const p=DH.ensureProfile();
    played=-1;
    const beginner=p.level==='new';
    if(beginner&&!p.team)p.team=JSON.parse(JSON.stringify(DH.teamDefault));
    $('#app').innerHTML=`
      <div class="page-head"><div><span class="eyebrow">Персональная презентация</span><h1 style="margin-top:12px">Презентация риелтора</h1><p>Единый стиль, ваши данные. Заполните форму, слайды обновляются сразу. Для клиента: онлайн по ссылке или PDF.</p></div></div>
      <div class="pres">
        <div class="pres-form">
          <div class="profile-bar">
            <select class="input" id="pSel" aria-label="Выбор риелтора">${state.profiles.map(x=>`<option value="${e(x.id)}" ${x.id===p.id?'selected':''}>${e(x.name||'Без имени')}${x.isSample?' (образец)':''}</option>`).join('')}</select>
            <button class="icon-btn" type="button" id="pAdd" aria-label="Добавить риелтора" title="Добавить риелтора">${icon('i-plus')}</button>
            <button class="icon-btn" type="button" id="pDel" aria-label="Удалить профиль" title="Удалить профиль">${icon('i-trash')}</button>
          </div>
          <div class="field"><span class="lbl">Для кого презентация</span><div class="pick-chips" id="pLevel">
            <button class="chip" type="button" data-l="pro" aria-pressed="${!beginner}">Опытный специалист</button>
            <button class="chip" type="button" data-l="new" aria-pressed="${beginner}">Начинающий</button>
          </div><p class="muted" style="font-size:13px;margin-top:8px">${beginner?'Упор на команду агентства и проверку объекта. Личные цифры сделок на слайдах не показываются.':'Упор на личный опыт: сделки, годы работы и кейсы.'}</p></div>
          ${p.isSample?`<p class="note">Это образец с вымышленными данными. Замените их на свои: фото, цифры и кейсы должны быть настоящими.</p>`:''}
          ${fold(1,'Знакомство',`
            <div class="photo-pick"><div class="ph" id="pPhotoPrev"></div><div style="display:grid;gap:8px;justify-items:start">
              <label class="btn btn-soft btn-sm" for="pPhoto" style="cursor:pointer">${icon('i-plus')}Загрузить фото</label>
              <input id="pPhoto" type="file" accept="image/*" hidden>
              <button class="btn btn-soft btn-sm" type="button" id="pPhotoDel">Убрать фото</button>
            </div></div>
            ${input('name','Имя и фамилия')}
            ${input('role','Должность')}
            ${area('tagline','Коротко о себе: одно предложение',2)}`,true)}
          ${fold(2,'Специализация',`
            <div class="field"><span class="lbl">С чем работаете</span><div class="pick-chips" id="pSpecs">${DH.specs.map(s=>`<button class="chip" type="button" data-s="${s.id}" aria-pressed="${(p.specs||[]).includes(s.id)}">${e(s.t)}</button>`).join('')}</div></div>
            ${input('areas','Районы и города')}`)}
          ${beginner?fold(3,'Команда',`
            <p class="muted" style="font-size:13px">Оставьте только тех, кто действительно помогает вам в сделках. Если кто-то не нужен, очистите его название.</p>
            ${[0,1,2].map(i=>`<div class="sub-card"><h4>Кто ${i+1}</h4>${input(`team.${i}.t`,'Кто это')}${area(`team.${i}.d`,'Чем помогает',2)}</div>`).join('')}
            ${input('achievements.0','Обучение или навык 1')}${input('achievements.1','Обучение или навык 2')}${input('achievements.2','Обучение или навык 3')}`):fold(3,'Опыт',`
            <div class="two">${input('years','Лет в недвижимости','','inputmode="numeric"')}${input('deals','Проведённых сделок','','inputmode="numeric"')}</div>
            ${input('dealsByYear','Сделки по годам (необязательно)','2024: 14, 2025: 18, 2026: 22')}
            <p class="muted" style="font-size:13px">Из этих цифр строится график. Пишите только настоящие. Если оставить пустым, графика не будет.</p>
            <div class="two">${input('third','Третья цифра (необязательно)')}${input('thirdLabel','Подпись к ней')}</div>
            ${input('achievements.0','Достижение или компетенция 1')}${input('achievements.1','Достижение или компетенция 2')}${input('achievements.2','Достижение или компетенция 3')}`)}
          ${fold(4,'Подход к работе',[0,1,2,3].map(i=>`<div class="sub-card"><h4>Шаг ${i+1}</h4>${input(`approach.${i}.t`,'Название')}${area(`approach.${i}.d`,'Что делаете',2)}</div>`).join(''))}
          ${beginner?fold(5,'Проверка объекта',`
            <p class="muted" style="font-size:13px">Список проверки общий для всех. Если уже есть своя сделка, опишите её: она появится рядом со списком. Нет сделки, оставьте пустым.</p>
            <div class="sub-card"><h4>Моя сделка</h4>${input('cases.0.title','Заголовок')}${area('cases.0.task','Задача',2)}${area('cases.0.done','Что сделали',2)}${input('cases.0.result','Результат')}</div>`):fold(5,'Кейсы',[0,1].map(i=>`<div class="sub-card"><h4>Кейс ${i+1}</h4>${input(`cases.${i}.title`,'Заголовок')}${area(`cases.${i}.task`,'Задача',2)}${area(`cases.${i}.done`,'Что сделали',2)}${input(`cases.${i}.result`,'Результат')}</div>`).join(''))}
          ${fold(6,'Компания',`${area('why','Почему работаете в «ДомХит»',4)}<p class="muted" style="font-size:13px">Цифры об агентстве на слайде общие для всех и берутся из материалов компании.</p>`)}
          ${fold(7,'Контакты',`
            ${input('phone','Телефон','+7 (978) ...','inputmode="tel"')}
            <div class="two">${input('whatsapp','WhatsApp, номер','79781234567','inputmode="tel"')}${input('telegram','Telegram, ник','@ivanov')}</div>
            ${input('email','Почта','','inputmode="email"')}
            ${input('office','Офис')}
            ${input('link','Ссылка для QR-кода','https://...','inputmode="url"')}
            <p class="muted" style="font-size:13px">Если оставить ссылку пустой, QR-код сохранит ваш контакт в телефон клиента.</p>`)}
        </div>
        <div class="pres-view">
          <div class="main-slide" id="pMain"></div>
          <div class="thumbs" id="pThumbs"></div>
          <div class="view-actions">
            <button class="btn btn-primary" type="button" id="pOpen">${icon('i-expand')}Смотреть на весь экран</button>
            <button class="btn btn-dark" type="button" id="pPdf">${icon('i-down')}Скачать PDF</button>
            <button class="btn btn-white" type="button" id="pLink">${icon('i-link')}Ссылка для клиента</button>
          </div>
          <p class="muted" style="font-size:13px" id="pHint">В окне печати выберите «Сохранить как PDF». Страницы получатся в формате слайдов 16:9.</p>
        </div>
      </div>`;
    fill(p);draw(p);bind(p);
  };

  function fill(p){
    $$('[data-k]').forEach(i=>{i.value=get(p,i.dataset.k)??'';});
    drawPhoto(p);
  }
  function drawPhoto(p){
    const ph=$('#pPhotoPrev');
    if(p.photo){ph.style.backgroundImage=`url('${p.photo}')`;ph.textContent='';}
    else{ph.style.backgroundImage='';ph.textContent=String(p.name||'?').trim().charAt(0).toUpperCase();}
    $('#pPhotoDel').hidden=!p.photo;
  }
  function draw(p){
    $('#pMain').innerHTML=DH.slideHtml(p,cur);
    $('#pThumbs').innerHTML=DH.slideTitles(p).map((t,i)=>`<button class="thumb ${i===cur?'on':''}" type="button" data-i="${i}" aria-label="Слайд ${i+1}: ${e(t)}">${DH.slideHtml(p,i)}</button>`).join('');
    /* Оживляем только при переходе на другой слайд, а не при каждой букве в форме */
    if(played!==cur){played=cur;DH.playSlide($('#pMain .slide'));}
  }
  let timer;
  function update(p){clearTimeout(timer);timer=setTimeout(()=>{save();draw(p);},140);}

  function bind(p){
    const form=$('.pres-form');
    form.addEventListener('input',ev=>{
      const k=ev.target.dataset&&ev.target.dataset.k;if(!k)return;
      set(p,k,ev.target.value);
      if(p.isSample)delete p.isSample;
      if(k==='name'){const o=$(`#pSel option[value="${p.id}"]`);if(o)o.textContent=p.name||'Без имени';drawPhoto(p);}
      update(p);
    });
    form.addEventListener('toggle',ev=>{
      if(ev.target.matches('details.fold')&&ev.target.open){cur=+ev.target.dataset.slide;draw(p);}
    },true);
    $('#pThumbs').addEventListener('click',ev=>{const b=ev.target.closest('[data-i]');if(b){cur=+b.dataset.i;draw(p);}});
    /* Переключение варианта не стирает данные: цифры и кейсы опытного остаются в профиле */
    $('#pLevel').addEventListener('click',ev=>{
      const b=ev.target.closest('[data-l]');if(!b||b.dataset.l===(p.level||'pro'))return;
      p.level=b.dataset.l;save();cur=0;DH.views.presentation();
    });
    $('#pSpecs').addEventListener('click',ev=>{
      const b=ev.target.closest('[data-s]');if(!b)return;
      const on=b.getAttribute('aria-pressed')==='true';
      if(on&&p.specs.length===1){toast('Оставьте хотя бы одно направление');return;}
      b.setAttribute('aria-pressed',!on);
      p.specs=on?p.specs.filter(x=>x!==b.dataset.s):[...p.specs,b.dataset.s];
      if(p.isSample)delete p.isSample;
      cur=1;update(p);
    });
    $('#pPhoto').addEventListener('change',async ev=>{
      const f=ev.target.files[0];if(!f)return;
      if(!f.type.startsWith('image/')){toast('Нужна картинка: JPG или PNG');return;}
      try{
        const url=URL.createObjectURL(f);
        p.photo=await DH.resizeImage(url,900,.82);URL.revokeObjectURL(url);
        if(p.isSample)delete p.isSample;
        if(save()){drawPhoto(p);cur=0;draw(p);toast('Фото добавлено');}
      }catch(err){toast(err.message);}
      ev.target.value='';
    });
    $('#pPhotoDel').onclick=()=>{p.photo='';save();drawPhoto(p);draw(p);};
    $('#pSel').onchange=ev=>{state.activeProfile=ev.target.value;save();cur=0;DH.views.presentation();};
    $('#pAdd').onclick=()=>{
      const n=JSON.parse(JSON.stringify(DH.sampleProfile));
      Object.assign(n,{id:uid(),isSample:false,name:'',tagline:'',photo:'',years:'',deals:'',dealsByYear:'',third:'',thirdLabel:'',areas:'',phone:'',whatsapp:'',telegram:'',email:'',link:'',office:'',
        achievements:['','',''],cases:[{title:'',task:'',done:'',result:''},{title:'',task:'',done:'',result:''}]});
      delete n.isSample;
      n.level=p.level||'pro';
      state.profiles.push(n);state.activeProfile=n.id;save();cur=0;DH.views.presentation();$('#f-name').focus();
      toast('Новый профиль создан');
    };
    $('#pDel').onclick=()=>{
      const btn=$('#pDel');
      if(!btn.dataset.sure){btn.dataset.sure='1';toast('Нажмите ещё раз, чтобы удалить профиль');setTimeout(()=>{delete btn.dataset.sure;},3000);return;}
      state.profiles=state.profiles.filter(x=>x.id!==p.id);DH.state.profiles=state.profiles;state.activeProfile=null;save();cur=0;DH.views.presentation();
    };
    $('#pOpen').onclick=()=>DH.openDeck(p,{start:cur});
    $('#pPdf').onclick=()=>DH.printDeck(p);
    $('#pLink').onclick=async()=>{
      try{
        /* Telegram не принимает сообщения длиннее 4096 знаков: подбираем размер фото под этот предел */
        const base=location.href.split('#')[0];
        let url='',side=0;
        for(side of [150,110,84,0]){
          url=base+'#/p/'+await DH.packProfile(p,side);
          if(url.length<=3900)break;
        }
        await copy(url,'Ссылка скопирована');
        const note=!p.photo||side===150?'':side?' Фото в ссылке уменьшено, в PDF оно в полном качестве.':' Фото не поместилось в ссылку, оно есть только в PDF.';
        $('#pHint').textContent=`Ссылка скопирована, можно отправлять клиенту.${note}`;
      }catch(err){toast('Этот браузер не умеет создавать ссылку. Обновите его или отправьте PDF.');}
    };
  }
})();
