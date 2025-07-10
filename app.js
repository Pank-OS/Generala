(() => {
  let lang = localStorage.getItem('generala_lang') || 'es';
  let players = JSON.parse(localStorage.getItem('generala_players') || '[]');
  let scores = JSON.parse(localStorage.getItem('generala_scores') || '{}');
  let currentTurn = parseInt(localStorage.getItem('generala_turn') || '0', 10) || 0;

  const qs = (sel, ctx=document) => ctx.querySelector(sel);
  const qsa = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];

  const appEl = qs('#app');

  function saveState(){
    localStorage.setItem('generala_lang', lang);
    localStorage.setItem('generala_players', JSON.stringify(players));
    localStorage.setItem('generala_scores', JSON.stringify(scores));
    localStorage.setItem('generala_turn', currentTurn);
  }

  function _(key){
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || key;
  }

  function goto(screen){
    qsa('.screen').forEach(s => s.classList.remove('active'));
    qs('#'+screen).classList.add('active');
    if(screen==='score') updateScoreBoard();
    if(screen==='menu') refreshPlayerRows();
    if(screen==='home') qs('#welcomeLabel').textContent = _('home_welcome');
  }

  /* ---------- Home Screen ---------- */
  const homeHtml = `
    <section id="home" class="screen active">
      <h1 id="welcomeLabel">${_( 'home_welcome' )}</h1>
      <button class="btn-dark" id="btnStart">${_('home_title')}</button>
      <button class="btn-dark" id="btnLang">${_('home_lang')}</button>
    </section>
  `;

  /* ---------- Language Screen ---------- */
  const langHtml = `
    <section id="lang" class="screen">
      <h2>${_('choose_language')}</h2>
      <div id="langGrid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;width:100%"></div>
      <button class="btn-dark" id="btnLangBack">${_('back_to_menu')}</button>
    </section>
  `;

  /* ---------- Menu Screen ---------- */
  const menuHtml = `
    <section id="menu" class="screen">
      <h2>${_('welcome')}</h2>
      <div id="playersWrap" style="width:100%;margin:10px 0"></div>
      <div>
        <button class="btn-dark" id="btnAdd">+</button>
        <button class="btn-dark" id="btnRemove">-</button>
      </div>
      <button class="btn-dark" id="btnNew">${_('new_game')}</button>
      <button class="btn-dark" id="btnLoad">${_('load_game')}</button>
      <button class="btn-dark" id="btnMenuBack">${_('back_to_menu')}</button>
    </section>
  `;

  /* ---------- Score Screen ---------- */
  const scoreHtml = `
    <section id="score" class="screen">
      <h2 id="turnLabel"></h2>
      <div id="scoreGrid" style="overflow:auto;width:100%"></div>
      <button class="btn-dark" id="btnScoreBack">${_('back_to_menu')}</button>
    </section>
  `;

  appEl.innerHTML = homeHtml + langHtml + menuHtml + scoreHtml;

  /* --- Populate language grid --- */
  const langGrid = qs('#langGrid');
  Object.entries(TRANSLATIONS).forEach(([code,obj])=>{
    const btn = document.createElement('button');
    btn.className = 'btn-dark';
    btn.textContent = code.toUpperCase();
    btn.onclick = ()=>{ lang=code; saveState(); location.reload(); };
    langGrid.appendChild(btn);
  });

  /* --- Player rows handling --- */
  function refreshPlayerRows(){
    const wrap = qs('#playersWrap');
    wrap.innerHTML = '';
    players.forEach((p,idx)=> wrap.appendChild(playerRow(idx)));
    if(players.length===0) { addPlayer(); addPlayer(); }
  }

  function playerRow(idx){
    const row = document.createElement('div');
    row.className='player-row';
    const inp = document.createElement('input');
    inp.placeholder = _('player_name_hint');
    inp.value = players[idx]?.name || '';
    inp.oninput = e => { players[idx].name = e.target.value; saveState(); };
    const sel = document.createElement('select');
    Object.entries(COLOR_NAMES[lang]).forEach(([key,val])=>{
      const opt=document.createElement('option'); opt.value=key; opt.textContent=val;
      sel.appendChild(opt);
    });
    sel.value = players[idx]?.color || 'red';
    sel.onchange = e => { players[idx].color = e.target.value; saveState(); };
    row.appendChild(inp); row.appendChild(sel);
    return row;
  }

  function addPlayer(){
    if(players.length>=10){ alert(_('max_players')); return;}
    players.push({name:'',color:Object.keys(COLOR_NAMES[lang])[players.length % 12]});
    saveState(); refreshPlayerRows();
  }
  function removePlayer(){
    if(players.length<=2){ alert(_('min_players')); return;}
    players.pop(); saveState(); refreshPlayerRows();
  }

  /* --- Scoreboard --- */
  function key(p,c){ return p+'-'+c; }
  function updateScoreBoard(){
    const gridDiv = qs('#scoreGrid');
    gridDiv.innerHTML='';
    const cats = CATEGORIES[lang];
    const rows = cats.length+1;
    const cols = players.length+1;
    gridDiv.style.display='grid';
    gridDiv.style.gridTemplateColumns=`repeat(${cols},1fr)`;
    // header
    gridDiv.appendChild(cell(_('category_header'),true));
    players.forEach(p=>gridDiv.appendChild(cell(p.name||'?')));
    // rows
    cats.concat(['Total']).forEach((cat,ridx)=>{
      gridDiv.appendChild(cell(cat,true));
      players.forEach((p,pidx)=>{
        const k = key(pidx,ridx);
        let val = scores[k]||0;
        const btn = document.createElement('button');
        btn.textContent = val;
        btn.className='score-btn';
        if(cat==='Total'){ btn.classList.add('total-cell'); btn.disabled=true; }
        else btn.onclick=()=>handleScoreClick(pidx,ridx,btn);
        gridDiv.appendChild(btn);
      });
    });
    updateTotals();
    qs('#turnLabel').textContent = `${_('turn_of')} ${players[currentTurn]?.name||'?'}`;
  }
  function cell(txt,header=false){
    const div=document.createElement('div'); div.textContent=txt;
    div.style.padding='6px'; div.style.textAlign='center';
    if(header) div.style.fontWeight='700';
    return div;
  }
  function handleScoreClick(pidx,ridx,btn){
    const opts = [0,5,10,15,20,25,30,35,40,45,50,100,'X'];
    const chosen = prompt(_('select_score')+` (${opts.join(', ')})`,btn.textContent);
    if(chosen===null) return;
    scores[key(pidx,ridx)] = chosen==='X'?'X':parseInt(chosen)||0;
    if(pidx===currentTurn){ currentTurn=(currentTurn+1)%players.length; }
    saveState(); updateScoreBoard();
  }
  function updateTotals(){
    const cats = CATEGORIES[lang];
    players.forEach((p,pidx)=>{
      let tot=0;
      cats.forEach((_,idx)=>{
        const v=scores[key(pidx,idx)];
        if(typeof v==='number') tot+=v;
      });
      scores[key(pidx,cats.length)]=tot;
      qsa('.total-cell')[pidx].textContent = tot;
    });
  }

  /* --- Event bindings --- */
  qs('#btnStart').onclick = ()=>goto('menu');
  qs('#btnLang').onclick = ()=>goto('lang');
  qs('#btnLangBack').onclick = ()=>goto('home');

  qs('#btnAdd').onclick = addPlayer;
  qs('#btnRemove').onclick = removePlayer;
  qs('#btnMenuBack').onclick = ()=>goto('home');

  qs('#btnNew').onclick = ()=>{ currentTurn=0; scores={}; saveState(); goto('score'); };
  qs('#btnLoad').onclick = ()=>{ if(Object.keys(scores).length===0) alert(_('no_saved_game')); else goto('score'); };

  qs('#btnScoreBack').onclick = ()=>goto('menu');

})();