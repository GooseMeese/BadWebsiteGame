// toothfairy.js
(() => {
  const CART_KEY   = 'badSiteCart';
  const TF_ACTIVE  = 'tfActive';   // '1' = enabled (fairy can appear), '0' = disabled
  const TF_ACCUM   = 'tfAccum';    // accumulated seconds across pages
  const TF_LAST    = 'tfLast';     // last timestamp ms
  const TF_RESULT  = 'tfResult';   // 'success' | 'fail'
  const TF_SESSION = 'tfSessionInit';  // session flag (per browser tab session)

  // --- Reset per session (NEW) ---
  if (!sessionStorage.getItem(TF_SESSION)) {
    // re-enable the fairy and clear timers/results each new session
    localStorage.setItem(TF_ACTIVE, '1');
    localStorage.setItem(TF_ACCUM,  '0');
    localStorage.setItem(TF_LAST,   Date.now().toString());
    localStorage.removeItem(TF_RESULT);
    sessionStorage.setItem(TF_SESSION, '1');
  }

  // ensure defaults exist even if session block above didn’t run yet
  if (localStorage.getItem(TF_ACTIVE) === null) localStorage.setItem(TF_ACTIVE,'1');
  if (localStorage.getItem(TF_ACCUM)  === null) localStorage.setItem(TF_ACCUM,'0');
  if (localStorage.getItem(TF_LAST)   === null) localStorage.setItem(TF_LAST, Date.now().toString());

  function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY))||{} }catch{ return {} } }
  function setCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); }
  function totalCount(c){ return Object.values(c).reduce((a,b)=>a+b,0); }

  // Remove up to 5 random item units (spread across items)
  function stealFive() {
    const cart = getCart();
    const pile = [];
    Object.entries(cart).forEach(([id,qty])=>{ for(let i=0;i<qty;i++) pile.push(id); });
    const steals = Math.min(5, pile.length);
    for (let i=0;i<steals;i++) {
      const k = Math.floor(Math.random()*pile.length);
      const id = pile.splice(k,1)[0];
      cart[id] = (cart[id]||0) - 1;
      if (cart[id] <= 0) delete cart[id];
    }
    setCart(cart);
    // Let checkout cart renderer update if present
    document.dispatchEvent(new CustomEvent('cart:updated', {detail:{total:0, cart}}));
  }

  // Heist popup
  const modal      = document.getElementById('tfModal');
  const chaseBtn   = document.getElementById('tfChase');
  const ignoreBtn  = document.getElementById('tfIgnore');

  function showHeist() {
    if (!modal) return;
    modal.classList.remove('hidden'); modal.removeAttribute('aria-hidden');
  }
  function hideHeist() {
    if (!modal) return;
    modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true');
  }
  if (chaseBtn) chaseBtn.onclick  = () => { hideHeist(); window.location.href = 'tooth-fairy.html'; };
  if (ignoreBtn) ignoreBtn.onclick = () => { hideHeist(); };

  // Result popup (when returning from the game)
  const resModal  = document.getElementById('tfResultModal');
  const resText   = document.getElementById('tfResultText');
  const resClose  = document.getElementById('tfResultClose');
  function showResult(msg){
    if (!resModal) return;
    resText.textContent = msg;
    resModal.classList.remove('hidden'); resModal.removeAttribute('aria-hidden');
  }
  function hideResult(){
    if (!resModal) return;
    resModal.classList.add('hidden'); resModal.setAttribute('aria-hidden','true');
  }
  if (resClose) resClose.onclick = hideResult;

  // If we have a stored result, show it then clear
  const pending = localStorage.getItem(TF_RESULT);
  if (pending === 'success') {
    showResult('Congrats, that stinky biomass will no longer come after you!');
    localStorage.removeItem(TF_RESULT);
  } else if (pending === 'fail') {
    showResult('You let that creature get away, you disgust me');
    localStorage.removeItem(TF_RESULT);
  }

  // Accumulate active time across the two pages
  function tick() {
    if (localStorage.getItem(TF_ACTIVE) !== '1') { // disabled
      localStorage.setItem(TF_LAST, Date.now().toString());
      return;
    }
    const now  = Date.now();
    const last = parseInt(localStorage.getItem(TF_LAST) || now, 10);
    const deltaSec = Math.max(0, Math.round((now - last)/1000));
    localStorage.setItem(TF_LAST, now.toString());

    let accum = parseInt(localStorage.getItem(TF_ACCUM) || '0', 10);
    accum += deltaSec;
    // When a cumulative minute passes, steal and popup (and keep remainder)
    while (accum >= 60) {
      accum -= 60;
      stealFive();
      showHeist();
    }
    localStorage.setItem(TF_ACCUM, String(accum));
  }

  // Run on load and every second; also on focus/visibility change
  tick();
  setInterval(tick, 1000);
  document.addEventListener('visibilitychange', () => { localStorage.setItem(TF_LAST, Date.now().toString()); });
  window.addEventListener('focus', () => { localStorage.setItem(TF_LAST, Date.now().toString()); });
})();