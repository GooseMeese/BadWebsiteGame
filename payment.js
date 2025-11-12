// Payment-page rule engine (same behavior as the sign-up rules)
document.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s);

  // Inputs
  const nameInp = $('#cardName');
  const numInp  = $('#cardNumber');
  const cvvInp  = $('#cvv');
  const expInp  = $('#exp');
  const payBtn  = $('#payBtn');

  // Name Rules
  const nameRules = [
    {
      el: $('#name-rule-1'),
      check: s => s.length === 10
    },
    {
      el: $('#name-rule-2'),
      // palindrome (case-insensitive)
      check: s => {
        const t = s.toLowerCase();
        return t === [...t].reverse().join('');
      }
    }
  ];

  // Number Rules
  const numOnly = s => (s.match(/\d/g) || []).join('');
  const isEven  = d => Number(d) % 2 === 0;

  const numRules = [
    {
      el: $('#num-rule-1'),
      check: s => {
        const d = numOnly(s);
        if (d.length < 4) return false;
        const sum = d.slice(0,4).split('').reduce((a,b)=>a+Number(b),0);
        return sum === 24;
      }
    },
    {
      el: $('#num-rule-2'),
      check: s => {
        const d = numOnly(s);
        if (d.length < 8) return false;
        // Check alternation for first 8 digits
        const a = d.slice(0,8).split('').map(Number);
        const checkStart = startEven => a.every((v,i) => (isEven(v) === (i%2===0 ? startEven : !startEven)));
        return checkStart(true) || checkStart(false);
      }
    },
    {
      el: $('#num-rule-3'),
      check: s => {
        const d = numOnly(s);
        if (!d.length) return false;
        // Check divisibility by 3
        const sum = d.split('').reduce((a,b)=>a+Number(b),0);
        return sum % 3 === 0;
      }
    },
    {
      el: $('#num-rule-4'),
      check: s => {
        const d = numOnly(s);
        if (d.length < 4) return false;
        const last4 = d.slice(-4);
        // Require that the set of 2-digit substrings among last4 includes "11" and "17"
        const subs = [last4.slice(0,2), last4.slice(1,3), last4.slice(2,4)];
        return subs.includes('11') && subs.includes('17');
      }
    }
  ];

  // CVV rule
  const cvvRules = [
    {
      el: $('#cvv-rule-1'),
      check: s => {
        if (!/^\d{3}$/.test(s)) return false;
        const n = Number(s);
        if (n < 2) return false;
        for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
        return true;
      }
    }
  ];

  // Expiration rules
  const expRules = [
    {
      el: $('#exp-rule-1'),
      check: s => {
        const m = s.split('/')[0] || '';
        return m === '05'; // “best month”
      }
    },
    {
      el: $('#exp-rule-2'),
      check: s => {
        const parts = s.split('/');
        if (parts.length !== 2) return false;
        const yy = parts[1];
        if (!/^\d{2}$/.test(yy)) return false;
        // interpret as 2000–2099; leap if divisible by 4
        const year = 2000 + Number(yy);
        return (year % 4) === 0;
      }
    }
  ];

  function introduceFirst(rules) {
    if (!rules[0].el.classList.contains('visible')) {
      rules[0].el.classList.add('visible','fail');
    }
  }

  function processSectionSequential(rules, value) {
    let allPassed = true;

    for (let i = 0; i < rules.length; i++) {
      const r = rules[i];

      // If not visible yet, we havent unlocked this rule
      if (!r.el.classList.contains('visible')) { allPassed = false; break; }

      const ok = r.check(value);
      r.el.classList.toggle('pass', ok);
      r.el.classList.toggle('fail', !ok);
      if (!ok) allPassed = false;

      // Reveal the next rule the first time this one becomes valid
      const next = rules[i+1];
      if (ok && next && !next.el.classList.contains('visible')) {
        next.el.classList.add('visible','fail');
      }
    }
    return allPassed && rules.at(-1).el.classList.contains('visible');
  }

  // show only the first name rule at load
  [nameRules, numRules, cvvRules, expRules].forEach(rules =>
    rules.forEach((r,i) => {
      r.el.classList.remove('visible','pass','fail');
      if (rules === nameRules && i === 0) r.el.classList.add('visible','fail');
    })
  );

  function update() {
    // Name
    const nameOK = processSectionSequential(nameRules, nameInp.value);
    if (nameOK) {
      numInp.disabled = false;
      introduceFirst(numRules);
    } else {
      numInp.disabled = true;
    }

    // Number
    const numOK = nameOK ? processSectionSequential(numRules, numInp.value) : false;
    if (numOK) {
      cvvInp.disabled = false;
      introduceFirst(cvvRules);
    } else {
      cvvInp.disabled = true;
    }

    // CVV
    const cvvOK = numOK ? processSectionSequential(cvvRules, cvvInp.value) : false;
    if (cvvOK) {
      expInp.disabled = false;
      introduceFirst(expRules);
    } else {
      expInp.disabled = true;
    }

    // Expiration
    const expOK = cvvOK ? processSectionSequential(expRules, expInp.value) : false;

    // Final gate
    payBtn.disabled = !(nameOK && numOK && cvvOK && expOK);
  }

  nameInp.addEventListener('input', update);
  numInp.addEventListener('input', update);
  cvvInp.addEventListener('input', update);
  expInp.addEventListener('input', update);

  // First evaluation
  update();
});



// Pay popup and password
(() => {
  const $ = s => document.querySelector(s);

  const payBtn   = $('#payBtn');
  const modal    = $('#pwModal');
  const closeBtn = $('#pwClose');
  const input    = $('#confirmPwd');
  const confirm  = $('#confirmBtn');
  const fail     = $('#pwFail');
  const santa    = $('#santaScreen');

  let attemptsLeft = 3;
  const TEST_PASSWORD = 'password';

  // Only allow opening when Pay is enabled
  payBtn.addEventListener('click', () => {
    if (payBtn.disabled) return;
    fail.classList.add('hidden');
    attemptsLeft = 3;
    fail.textContent = `YOU HAVE ${attemptsLeft} MORE ATTEMPTS`;
    input.value = '';
    modal.classList.remove('hidden');
    modal.removeAttribute('aria-hidden');
    input.focus();
  });

  function closeModal(){
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
  }
  closeBtn.addEventListener('click', closeModal);
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && !modal.classList.contains('hidden')) closeModal(); });

  function success(){
    closeModal();
    // show santa full-screen
    santa.classList.remove('hidden');
    santa.removeAttribute('aria-hidden');
  }

  function failOnce(){
    attemptsLeft--;
    fail.textContent = `YOU HAVE ${attemptsLeft} MORE ATTEMPTS`;
    fail.classList.remove('hidden');
    if (attemptsLeft <= 0) {
      window.location.href = 'loser.html';
    }
  }

  function check(){
    const ok = (input.value === TEST_PASSWORD || input.value === '12345');
    ok ? success() : failOnce();
  }

  confirm.addEventListener('click', check);
  input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') check(); });
})();