const CART_KEY = 'badSiteCart';
const CATALOG = {
  soda:    {name:'Soda',    price: 2.98, img:'soda.jpg'},
  tree:    {name:'Tree',    price:43.99, img:'tree.jpg'},
  diamond: {name:'Diamond', price:43.99, img:'diamond.jpg'},
  keychain:{name:'Keychain',price: 1.25, img:'keychain.jpg'},
  flowers: {name:'flowers', price:22.49, img:'flowers.jpg'},
  gas:     {name:'gas',     price:103.00,img:'gas.jpg'}
};

function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY))||{} }catch{ return {} } }
function setCart(o){ localStorage.setItem(CART_KEY, JSON.stringify(o)); }
function countItems(o){ return Object.values(o).reduce((a,b)=>a+b,0); }

const badge = document.getElementById('cartBadge');
function refreshBadge(){ badge.textContent = countItems(getCart()); }
refreshBadge();

// --- gas popup wiring ---
const gasPopup = document.getElementById('gasPopup');
const gasMore  = document.getElementById('gasMore');
const gasNo    = document.getElementById('gasNo');
const jesus    = document.getElementById('jesusOverlay');

function showGasPopup(){
  gasPopup.classList.remove('hidden');
  gasPopup.removeAttribute('aria-hidden');
}
function hideGasPopup(){
  gasPopup.classList.add('hidden');
  gasPopup.setAttribute('aria-hidden','true');
}
function showJesus(){
  jesus.classList.remove('hidden');
  jesus.removeAttribute('aria-hidden');
  // fade in
  requestAnimationFrame(()=> jesus.classList.add('show'));
  // stay visible 10s, then fade out
  setTimeout(()=>{
    jesus.classList.remove('show');
    setTimeout(()=>{
      jesus.classList.add('hidden');
      jesus.setAttribute('aria-hidden','true');
    }, 900); // match CSS transition
  }, 10000);
}

gasMore.addEventListener('click', ()=>{ hideGasPopup(); showJesus(); });
gasNo  .addEventListener('click', ()=>{ hideGasPopup(); showJesus(); });

// --- product click handling ---
document.querySelectorAll('.card').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const id = btn.dataset.id;

    // Intercept GAS: show popup and DO NOT add to cart
    if (id === 'gas') {
      showGasPopup();
      return;
    }

    // Normal add-to-cart for other items
    const cart = getCart();
    cart[id] = (cart[id]||0)+1;
    setCart(cart);
    refreshBadge();
    badge.style.transform='scale(1.2)';
    setTimeout(()=>badge.style.transform='',120);
  });
});