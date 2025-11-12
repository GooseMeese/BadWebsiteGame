document.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s);

  // Inputs
  const fullName = $('#fullName');
  const street   = $('#street');
  const zip      = $('#zip');
  const city     = $('#city');
  const payBtn   = $('#goPayBtn');

  // disable all initially
  [fullName, street, zip, city].forEach(i => i && (i.disabled = true));
  if (payBtn) payBtn.disabled = true;

  const cartRules = [
    {
      el: $('#cart-rule-1'),
      check: ({cart}) => (cart.soda || 0) >= 1
    },
    {
      el: $('#cart-rule-2'),
      check: ({cart}) => (cart.tree || 0) <= 1
    },
    {
      el: $('#cart-rule-3'),
      check: ({cart}) => (cart.flowers || 0) >= 5
    },
    {
      el: $('#cart-rule-4'),
      check: ({cart}) => (cart.diamond || 0) >= 1
    },
    {
      el: $('#cart-rule-5'),
      check: ({total}) => total > 602.84
    }
  ];

  const nameRules = [
    {
      el: createRuleAfter('#cart-rules', 'name-rule-1', 'Rule 1',
        'Must be a main character from the show <b>Spongebob</b>.'),
      check: (s) => {
        const norm = s.toLowerCase().replace(/[^a-z]/g,'');
        return ['spongebob','squidward','mrkrabs','plankton','larry'].includes(norm);
      }
    }
  ];

  const streetRules = [
    {
      el: createRuleAfter(nameRules.at(-1).el, 'street-rule-1', 'Rule 1',
        'Must be the street address for School of Mines.'),
      check: (s) => s.trim().toLowerCase() === '1500illinoisst'
    }
  ];

  const zipRules = [
    {
      el: createRuleAfter(streetRules.at(-1).el, 'zip-rule-1', 'Rule 1',
        'Must be the current phase of the moon.'),
      check: (s) => s.trim().toLowerCase() === 'lastquarter'
    }
  ];

  const cityRules = [
    {
      el: createRuleAfter(zipRules.at(-1).el, 'city-rule-1', 'Rule 1',
        'Must include the capital of New South Wales.'),
      check: (s) => /sydney/i.test(s)
    }
  ];

  // Introduce only the first CART rule on load; others gated
  cartRules.forEach((r,i) => {
    r.el.classList.remove('visible','pass','fail');
    if (i===0) r.el.classList.add('visible','fail');
  });

  let lastCartState = { total:0, cart:{} };

  // process “sticky sequential” rules
  function processSequential(rules, value) {
    let allPass = true;
    for (let i=0;i<rules.length;i++){
      const rule = rules[i];
      if (!rule.el.classList.contains('visible')) { allPass = false; break; }
      const ok = typeof value === 'object' ? rule.check(value) : rule.check(value);
      rule.el.classList.toggle('pass', ok);
      rule.el.classList.toggle('fail', !ok);
      if (!ok) allPass = false;
      const next = rules[i+1];
      if (ok && next && !next.el.classList.contains('visible')) {
        next.el.classList.add('visible','fail');
      }
    }
    return allPass && rules.at(-1).el.classList.contains('visible');
  }

  function updateAll() {
    const cartOK = processSequential(cartRules, lastCartState);

    // Unlock Name once cart is good
    if (cartOK) {
      if (fullName) fullName.disabled = false;
      introduceFirst(nameRules);
    } else {
      if (fullName) fullName.disabled = true;
    }

    // 2) Name
    const nameOK = cartOK ? processSequential(nameRules, fullName?.value || '') : false;
    if (nameOK) {
      if (street) street.disabled = false;
      introduceFirst(streetRules);
    } else {
      if (street) street.disabled = true;
    }

    // 3) Street
    const streetOK = nameOK ? processSequential(streetRules, street?.value || '') : false;
    if (streetOK) {
      if (zip) zip.disabled = false;
      introduceFirst(zipRules);
    } else {
      if (zip) zip.disabled = true;
    }

    // 4) Zip
    const zipOK = streetOK ? processSequential(zipRules, zip?.value || '') : false;
    if (zipOK) {
      if (city) city.disabled = false;
      introduceFirst(cityRules);
    } else {
      if (city) city.disabled = true;
    }

    // 5) City
    const cityOK = zipOK ? processSequential(cityRules, city?.value || '') : false;

    // Final gate: enable the GO TO PAYMENT button only when all pass
    if (payBtn) payBtn.disabled = !(cartOK && nameOK && streetOK && zipOK && cityOK);
  }

  function introduceFirst(rules){
    if (!rules[0].el.classList.contains('visible')) {
      rules[0].el.classList.add('visible','fail');
    }
  }
// Utility to create a rule block after a given element
  function createRuleAfter(targetOrNode, id, title, html){
    const target = (typeof targetOrNode === 'string')
      ? document.querySelector(targetOrNode)
      : targetOrNode;
    const container = target.closest('.rules');
    const d = document.createElement('div');
    d.className = 'rule';
    d.id = id;
    d.innerHTML = `
      <div class="rule-head"><span class="rule-title">${title}</span><span class="rule-icon"></span></div>
      <p>${html}</p>`;
    document.getElementById('cart-rules').appendChild(d);
    return d;
  }

  // Listen for cart updates
  document.addEventListener('cart:updated', (e)=>{
    lastCartState = e.detail;
    updateAll();
  });

  [fullName, street, zip, city].forEach(el => el && el.addEventListener('input', updateAll));

  updateAll();
});