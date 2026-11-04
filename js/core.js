/* Общие помощники и хранилище. Всё хранится в браузере этого устройства. */
(function(){
  const KEY='domhit-cabinet-v1';
  const blank={profiles:[],activeProfile:null,favs:[],customTemplates:[],deals:[],activeDeal:null,read:[],vals:{}};
  let state;
  try{state=Object.assign({},blank,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){state=Object.assign({},blank);}

  DH.state=state;
  DH.save=function(){
    try{localStorage.setItem(KEY,JSON.stringify(state));return true;}
    catch(e){DH.toast('Не удалось сохранить: в браузере закончилось место. Попробуйте фото поменьше.');return false;}
  };

  DH.esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  DH.$=(s,r=document)=>r.querySelector(s);
  DH.$$=(s,r=document)=>[...r.querySelectorAll(s)];
  DH.uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  DH.icon=(id,cls='')=>`<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;

  let toastTimer;
  DH.toast=function(msg){
    const t=DH.$('#toast');t.textContent=msg;t.hidden=false;
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>{t.hidden=true;},2800);
  };
  DH.copy=async function(text,msg='Скопировано'){
    try{await navigator.clipboard.writeText(text);DH.toast(msg);}
    catch(e){
      const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.select();
      try{document.execCommand('copy');DH.toast(msg);}catch(_){DH.toast('Не удалось скопировать, выделите текст вручную');}
      ta.remove();
    }
  };

  /* Профили риелторов */
  DH.profile=function(){
    return state.profiles.find(p=>p.id===state.activeProfile)||null;
  };
  DH.ensureProfile=function(){
    if(!state.profiles.length){
      const p=JSON.parse(JSON.stringify(DH.sampleProfile));p.id=DH.uid();
      state.profiles.push(p);state.activeProfile=p.id;DH.save();
    }
    state.profiles.forEach(p=>{
      if(!p.isSample)return;
      if(p.dealsByYear==null)p.dealsByYear=DH.sampleProfile.dealsByYear;
      Object.assign(p,DH.sampleContacts);
    });
    if(!DH.profile()){state.activeProfile=state.profiles[0].id;DH.save();}
    return DH.profile();
  };

  /* Фото: уменьшаем до нужного размера и отдаём JPEG */
  DH.resizeImage=function(src,maxSide,quality){
    return new Promise((res,rej)=>{
      const img=new Image();
      img.onload=()=>{
        const k=Math.min(1,maxSide/Math.max(img.width,img.height));
        const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
        c.getContext('2d').drawImage(img,0,0,c.width,c.height);
        res(c.toDataURL('image/jpeg',quality));
      };
      img.onerror=()=>rej(new Error('Не удалось открыть изображение'));
      img.src=src;
    });
  };

  /* Ссылка для клиента: данные профиля сжаты и лежат прямо в адресе после #, на сервер не уходят */
  const b64u=bytes=>{let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
  const unb64u=str=>{const s=atob(str.replace(/-/g,'+').replace(/_/g,'/'));const a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a;};
  async function pipe(bytes,stream){return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());}
  DH.packProfile=async function(p,photoSide){
    /* Отметка образца остаётся в ссылке, чтобы метка была видна и получателю */
    const o=Object.assign({},p);delete o.id;
    o.photo=photoSide&&p.photo?await DH.resizeImage(p.photo,photoSide,.5):'';
    const raw=new TextEncoder().encode(JSON.stringify(o));
    return b64u(await pipe(raw,new CompressionStream('deflate-raw')));
  };
  DH.unpackProfile=async function(str){
    const raw=await pipe(unb64u(str),new DecompressionStream('deflate-raw'));
    const o=JSON.parse(new TextDecoder().decode(raw));
    if(o.photo&&!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(o.photo))o.photo='';
    return o;
  };

  /* Подстановка профиля в тексты */
  DH.fillProfile=function(text){
    const p=state.profiles.find(x=>x.id===state.activeProfile);
    return text.replace(/\{риелтор\}/g,p&&p.name||'{риелтор}').replace(/\{телефон\}/g,p&&p.phone||'{телефон}');
  };
})();
