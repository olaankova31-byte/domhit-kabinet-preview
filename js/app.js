/* Навигация по разделам через адрес после #. */
(function(){
  const {$,icon,esc:e}=DH;
  const links=[{id:'',title:'Главная',icon:'i-home'},...DH.sections];
  $('#nav').innerHTML=DH.sections.map(s=>`<a href="#/${s.id}" data-id="${s.id}">${e(s.title)}</a>`).join('');
  $('#mbar').innerHTML=links.map(s=>`<a href="#/${s.id}" data-id="${s.id}">${icon(s.icon)}<span>${e(s.title)}</span></a>`).join('');

  async function route(){
    const parts=location.hash.replace(/^#\/?/,'').split('/');
    const sec=parts[0]||'';

    /* Ссылка для клиента: только презентация, без кабинета */
    if(sec==='p'&&parts[1]){
      $('#shell').hidden=true;
      try{
        const p=await DH.unpackProfile(parts[1]);
        document.title=(p.name||'Презентация')+' · ДомХит';
        DH.openDeck(p,{client:true});
      }catch(err){
        $('#deck').hidden=false;
        $('#deck').innerHTML=`<div style="grid-row:1/-1;display:grid;place-items:center;padding:24px;text-align:center"><p>Ссылка повреждена или обрезана. Попросите специалиста прислать её ещё раз.</p></div>`;
      }
      return;
    }

    document.querySelectorAll('#nav a,#mbar a').forEach(a=>a.classList.toggle('on',a.dataset.id===sec));
    $('#app').onclick=null;
    if(sec==='')DH.views.home();
    else if(sec==='learning'&&parts[1])DH.views.article(parts[1]);
    else if(DH.views[sec])DH.views[sec]();
    else{location.hash='#/';return;}
    window.scrollTo(0,0);
    $('#app').focus({preventScroll:true});
  }
  addEventListener('hashchange',route);
  DH.ensureProfile();
  route();
})();
