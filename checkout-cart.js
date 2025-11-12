const CART_KEY = 'badSiteCart';
const SESSION_INIT = 'badSiteCartInit';
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
function money(n){ return '$' + n.toFixed(2); }

// Empty cart on first open of this browser session
if (!sessionStorage.getItem(SESSION_INIT)) {
  setCart({});
  sessionStorage.setItem(SESSION_INIT, '1');
}


function renderCart(){
  const list = document.getElementById('cartItems');
  const totalEl = document.getElementById('totalAmount');
  if (!list || !totalEl) return;

  const cart = getCart();
  list.innerHTML = '';

  let total = 0;
  let distinct = 0;

  Object.entries(cart).forEach(([id, qty])=>{
    if (!qty) return;
    distinct++;
    const it = CATALOG[id];
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img src="${it.img}" alt="">
      <div class="name">${it.name} ${qty>1?`<span class="qty">${qty}x</span>`:''}</div>
      <div class="price">${money(it.price)}</div>
    `;
    list.appendChild(row);
    total += it.price * qty;
  });

  list.classList.toggle('messy', distinct > 2);
  totalEl.textContent = money(total);

  // let rules module know totals changed
  document.dispatchEvent(new CustomEvent('cart:updated', {detail:{total, cart}}));
}

document.addEventListener('DOMContentLoaded', ()=>{
  renderCart();

  // random remove button
  const btn = document.getElementById('removeRandom');
  if (btn) {
    btn.addEventListener('click', ()=>{
      const cart = getCart();
      const ids = Object.keys(cart).filter(k=>cart[k]>0);
      if (!ids.length) return;
      const pick = ids[Math.floor(Math.random()*ids.length)];
      cart[pick] -= 1;
      if (cart[pick] <= 0) delete cart[pick];
      setCart(cart);
      renderCart();
    });
  }
});

window.addEventListener('storage', renderCart);