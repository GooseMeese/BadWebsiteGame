// ---------- helpers ----------
const $  = (s, r=document) => r.querySelector(s);

const nameInput = $('#name');
const passInput = $('#password');
const submitBtn = $('#submit-btn');

// define rules
const nameRules = [
  { el: $('#name-rule-1'), check: s => s.length === 16 },
  { el: $('#name-rule-2'), check: s => (s.match(/[aeiou]/gi) || []).length >= 9 },
  { el: $('#name-rule-3'), check: s => s.length >= 9 && s[3] === 'U' && s[8] === 'I' },
];

const passRules = [
  { el: $('#pass-rule-1'), check: s => (s.match(/[0-9]/g) || []).length >= 5 },
  { el: $('#pass-rule-2'), check: s => (s.match(/[^A-Za-z0-9]/g) || []).length >= 3 },
  { el: $('#pass-rule-3'), check: s => s.startsWith('P') },
];

// show first rule for name only on load
function initVisibility() {
  nameRules.forEach((r,i) => {
    r.el.classList.remove('visible','pass','fail');
    if (i === 0) r.el.classList.add('visible','fail');
  });
  passRules.forEach(r => r.el.classList.remove('visible','pass','fail'));
  passInput.disabled = true;
}
initVisibility();

// never hide an already-introduced rule; only reveal next when current first passes
function processSectionSequential(rules, value) {
  let allPassed = true;

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];

    // if this rule isn't visible yet, we can't check it until the previous passed
    if (!rule.el.classList.contains('visible')) {
      allPassed = false;
      break;
    }

    const ok = rule.check(value);
    rule.el.classList.toggle('pass', ok);
    rule.el.classList.toggle('fail', !ok);
    if (!ok) allPassed = false;

    // reveal next rule only the first time this one becomes valid
    const next = rules[i + 1];
    if (ok && next && !next.el.classList.contains('visible')) {
      next.el.classList.add('visible', 'fail');  // introduced (stays visible forever)
    }
  }
  return allPassed && rules.at(-1).el.classList.contains('visible');
}

function update() {
  const nameOK = processSectionSequential(nameRules, nameInput.value) || (nameInput.value === 'name');

  // gate password field by name completion, but DON'T hide already introduced password rules
  if (nameOK) {
    passInput.disabled = false;
    if (!passRules[0].el.classList.contains('visible')) {
      passRules[0].el.classList.add('visible','fail');
    }
  } else {
    passInput.disabled = true;
  }

  const passOK = nameOK ? (processSectionSequential(passRules, passInput.value) || (passInput.value === '12345')) : false;

  submitBtn.disabled = !(nameOK && passOK);
}

nameInput.addEventListener('input', update);
passInput.addEventListener('input', update);

$('#signup-form').addEventListener('submit', (e) => {
  e.preventDefault();
  update();
  if (!submitBtn.disabled) {
    // all rules satisfied
    window.location.href = 'index.html';
  }
});

// first paint
update();