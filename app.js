/* ══════════════════════════════════════════════════════
   FRUITOTRI — app.js
   Jeu éducatif de tri de fruits pour enfants de 9 ans
══════════════════════════════════════════════════════ */

'use strict';

// ══ DATA ══════════════════════════════════════════════

const FRUITS = {
  // emoji, nom, couleur, catégorie, taille (1=très petit → 5=très grand)
  pomme_rouge:  { e:'🍎', nom:'Pomme rouge',  couleur:'rouge',  cat:'pomes',     taille:3 },
  pomme_verte:  { e:'🍏', nom:'Pomme verte',  couleur:'vert',   cat:'pomes',     taille:3 },
  banane:       { e:'🍌', nom:'Banane',        couleur:'jaune',  cat:'tropicaux', taille:4 },
  raisin:       { e:'🍇', nom:'Raisin',        couleur:'violet', cat:'baies',     taille:2 },
  orange:       { e:'🍊', nom:'Orange',        couleur:'orange', cat:'agrumes',   taille:3 },
  fraise:       { e:'🍓', nom:'Fraise',        couleur:'rouge',  cat:'baies',     taille:1 },
  citron:       { e:'🍋', nom:'Citron',        couleur:'jaune',  cat:'agrumes',   taille:2 },
  pasteque:     { e:'🍉', nom:'Pastèque',      couleur:'vert',   cat:'tropicaux', taille:5 },
  peche:        { e:'🍑', nom:'Pêche',         couleur:'orange', cat:'pomes',     taille:3 },
  kiwi:         { e:'🥝', nom:'Kiwi',          couleur:'vert',   cat:'tropicaux', taille:2 },
  cerise:       { e:'🍒', nom:'Cerise',        couleur:'rouge',  cat:'baies',     taille:1 },
  ananas:       { e:'🍍', nom:'Ananas',        couleur:'jaune',  cat:'tropicaux', taille:5 },
  mangue:       { e:'🥭', nom:'Mangue',        couleur:'orange', cat:'tropicaux', taille:4 },
  myrtille:     { e:'🫐', nom:'Myrtille',      couleur:'violet', cat:'baies',     taille:1 },
  citron_vert:  { e:'🍈', nom:'Melon',         couleur:'vert',   cat:'tropicaux', taille:4 },
  poire:        { e:'🍐', nom:'Poire',         couleur:'vert',   cat:'pomes',     taille:3 },
  framboise:    { e:'🍓', nom:'Framboise',     couleur:'rose',   cat:'baies',     taille:1 },
};

const BASKETS_COULEUR = {
  rouge:  { label:'Rouge',  emoji:'🔴', cls:'basket-rouge'  },
  jaune:  { label:'Jaune',  emoji:'🟡', cls:'basket-jaune'  },
  vert:   { label:'Vert',   emoji:'🟢', cls:'basket-vert'   },
  orange: { label:'Orange', emoji:'🟠', cls:'basket-orange' },
  violet: { label:'Violet', emoji:'🟣', cls:'basket-violet' },
  rose:   { label:'Rose',   emoji:'🌸', cls:'basket-rose'   },
};

const BASKETS_CATEGORIE = {
  agrumes:   { label:'Agrumes',   emoji:'🍊', cls:'basket-agrumes'   },
  baies:     { label:'Baies',     emoji:'🍓', cls:'basket-baies'     },
  tropicaux: { label:'Tropicaux', emoji:'🌴', cls:'basket-tropicaux' },
  pomes:     { label:'Pommes & Poires', emoji:'🍎', cls:'basket-pomes' },
};

const DIFFICULTY = {
  facile: { count: 6,  timer: false, timerSec: 0  },
  moyen:  { count: 10, timer: true,  timerSec: 60 },
};

// ══ STATE ═════════════════════════════════════════════

let state = {
  mode: null,
  difficulty: 'facile',
  score: 0,
  total: 0,
  correct: 0,
  timerInterval: null,
  timerLeft: 0,
  currentFruits: [],   // for couleur/panier
  tailleRound: 0,
  tailleScore: 0,
  tailleTotal: 0,
  dragItem: null,
  dragSource: null,
};

// ══ UTILS ═════════════════════════════════════════════

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(n, pool) {
  return shuffle(Object.entries(pool)).slice(0, n);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const el = document.getElementById('screen-' + id);
  el.style.display = 'flex';
  requestAnimationFrame(() => el.classList.add('active'));
}

function showScorePopup(x, y, text, type) {
  const pop = document.createElement('div');
  pop.className = 'score-popup ' + type;
  pop.textContent = text;
  pop.style.left = x + 'px';
  pop.style.top  = y + 'px';
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 1000);
}

function playSound(type) {
  // Sons via Web Audio API (pas de fichiers externes nécessaires)
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + .1);
      osc.frequency.setValueAtTime(784, ctx.currentTime + .2);
      gain.gain.setValueAtTime(.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .4);
      osc.start(); osc.stop(ctx.currentTime + .4);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(180, ctx.currentTime + .1);
      gain.gain.setValueAtTime(.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .3);
      osc.start(); osc.stop(ctx.currentTime + .3);
    } else if (type === 'win') {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.type = 'sine';
        o2.frequency.value = freq;
        g2.gain.setValueAtTime(.25, ctx.currentTime + i * .12);
        g2.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + i * .12 + .35);
        o2.start(ctx.currentTime + i * .12);
        o2.stop(ctx.currentTime + i * .12 + .35);
      });
    }
  } catch(e) {}
}

// ══ HOME / DIFFICULTY ═════════════════════════════════

function setDifficulty(d) {
  state.difficulty = d;
  document.getElementById('btn-easy').classList.toggle('active', d === 'facile');
  document.getElementById('btn-hard').classList.toggle('active', d === 'moyen');
}

function selectMode(mode) {
  state.mode = mode;
  clearGame();
  if (mode === 'couleur') startCouleur();
  else if (mode === 'taille') startTaille();
  else if (mode === 'panier') startPanier();
}

function goHome() {
  clearGame();
  showScreen('home');
}

function replayGame() {
  selectMode(state.mode);
}

function clearGame() {
  if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
}

// ══ TIMER ═════════════════════════════════════════════

function startTimer(prefix, onExpire) {
  const diff = DIFFICULTY[state.difficulty];
  const hudEl = document.getElementById(prefix + '-timer-hud');
  const timerEl = document.getElementById(prefix + '-timer');

  if (!diff.timer) {
    hudEl.classList.remove('visible');
    return;
  }
  hudEl.classList.add('visible');
  state.timerLeft = diff.timerSec;
  timerEl.textContent = state.timerLeft;

  state.timerInterval = setInterval(() => {
    state.timerLeft--;
    timerEl.textContent = state.timerLeft;
    if (state.timerLeft <= 10) hudEl.classList.add('timer-urgent');
    if (state.timerLeft <= 0) {
      clearInterval(state.timerInterval);
      onExpire();
    }
  }, 1000);
}

// ══ DRAG & DROP ═══════════════════════════════════════

let ghost = null;

function setupDrag(el, fruitKey, fruitData, onDrop) {
  const ghostEl = document.getElementById('drag-ghost');

  // Mouse
  el.addEventListener('mousedown', e => {
    if (el.classList.contains('dragging')) return;
    state.dragItem = { key: fruitKey, data: fruitData, el, onDrop };
    el.classList.add('dragging');
    ghostEl.textContent = fruitData.e;
    ghostEl.style.display = 'block';
    moveGhost(e.clientX, e.clientY);
    e.preventDefault();
  });

  // Touch
  el.addEventListener('touchstart', e => {
    if (el.classList.contains('dragging')) return;
    state.dragItem = { key: fruitKey, data: fruitData, el, onDrop };
    el.classList.add('dragging');
    ghostEl.textContent = fruitData.e;
    ghostEl.style.display = 'block';
    const t = e.touches[0];
    moveGhost(t.clientX, t.clientY);
    e.preventDefault();
  }, { passive: false });
}

function moveGhost(x, y) {
  const g = document.getElementById('drag-ghost');
  g.style.left = x + 'px';
  g.style.top  = y + 'px';
}

document.addEventListener('mousemove', e => {
  if (state.dragItem) moveGhost(e.clientX, e.clientY);
});
document.addEventListener('touchmove', e => {
  if (state.dragItem) {
    const t = e.touches[0];
    moveGhost(t.clientX, t.clientY);
    e.preventDefault();
  }
}, { passive: false });

function endDrag(x, y) {
  const g = document.getElementById('drag-ghost');
  g.style.display = 'none';

  if (!state.dragItem) return;

  // Find drop target
  const els = document.elementsFromPoint(x, y);
  let dropped = false;
  for (const t of els) {
    if (t !== state.dragItem.el && t.dataset.target) {
      state.dragItem.el.classList.remove('dragging');
      state.dragItem.onDrop(state.dragItem, t.dataset.target, x, y);
      dropped = true;
      break;
    }
  }
  if (!dropped) {
    if (state.dragItem.el) state.dragItem.el.classList.remove('dragging');
  }
  // Remove drag-over from all baskets
  document.querySelectorAll('.drag-over').forEach(b => b.classList.remove('drag-over'));
  state.dragItem = null;
}

document.addEventListener('mouseup', e => endDrag(e.clientX, e.clientY));
document.addEventListener('touchend', e => {
  const t = e.changedTouches[0];
  endDrag(t.clientX, t.clientY);
});

// Drag-over highlight
document.addEventListener('mousemove', e => {
  document.querySelectorAll('.drag-over').forEach(b => b.classList.remove('drag-over'));
  if (!state.dragItem) return;
  const els = document.elementsFromPoint(e.clientX, e.clientY);
  for (const t of els) {
    if (t.dataset.target) { t.classList.add('drag-over'); break; }
  }
});

// ══ JEU : TRI PAR COULEUR ═════════════════════════════

function startCouleur() {
  const diff = DIFFICULTY[state.difficulty];
  state.score = 0;
  state.correct = 0;

  // Pick fruits and figure out which colors are present
  const allFruits = Object.entries(FRUITS).filter(([,f]) => f.couleur !== 'rose' || diff.count > 8);
  const chosen = shuffle(allFruits).slice(0, diff.count);
  state.currentFruits = chosen;
  state.total = chosen.length;

  // Which baskets needed
  const neededColors = [...new Set(chosen.map(([,f]) => f.couleur))];

  document.getElementById('c-score').textContent = 0;
  document.getElementById('c-left').textContent = state.total;
  document.getElementById('c-progress').style.width = '0%';
  document.getElementById('c-timer-hud').classList.remove('visible', 'timer-urgent');

  // Render fruits
  const fruitsEl = document.getElementById('c-fruits');
  fruitsEl.innerHTML = '';
  chosen.forEach(([key, fruit], i) => {
    const el = document.createElement('div');
    el.className = 'fruit-item';
    el.innerHTML = `<span title="${fruit.nom}">${fruit.e}</span>`;
    el.style.animationDelay = i * .06 + 's';
    el.id = 'fruit-c-' + key + '-' + i;
    setupDrag(el, key, fruit, handleCouleurDrop);
    fruitsEl.appendChild(el);
  });

  // Render baskets
  const basketsEl = document.getElementById('c-baskets');
  basketsEl.innerHTML = '';
  neededColors.forEach(color => {
    const bdata = BASKETS_COULEUR[color];
    if (!bdata) return;
    const b = document.createElement('div');
    b.className = 'basket basket-' + color;
    b.innerHTML = `
      <div class="basket-body" data-target="${color}">
        <div class="basket-emoji">${bdata.emoji}</div>
        <div class="basket-label">${bdata.label}</div>
        <div class="basket-count" id="bc-${color}">0</div>
      </div>`;
    basketsEl.appendChild(b);
  });

  showScreen('couleur');
  startTimer('c', () => endGame('couleur'));
}

function handleCouleurDrop(drag, target, x, y) {
  const isCorrect = drag.data.couleur === target;
  const el = drag.el;

  if (isCorrect) {
    state.score += 10;
    state.correct++;
    playSound('correct');
    el.classList.add('correct-anim');
    showScorePopup(x, y, '+10 ⭐', 'correct');
    // Update basket count
    const bc = document.getElementById('bc-' + target);
    if (bc) bc.textContent = parseInt(bc.textContent || 0) + 1;
    setTimeout(() => el.remove(), 450);
    document.getElementById('c-score').textContent = state.score;
    document.getElementById('c-left').textContent = state.total - state.correct;
    document.getElementById('c-progress').style.width = (state.correct / state.total * 100) + '%';
    if (state.correct >= state.total) {
      setTimeout(() => endGame('couleur'), 500);
    }
  } else {
    playSound('wrong');
    el.classList.add('wrong-anim');
    state.score = Math.max(0, state.score - 3);
    showScorePopup(x, y, '-3 ❌', 'wrong');
    document.getElementById('c-score').textContent = state.score;
    setTimeout(() => el.classList.remove('wrong-anim'), 400);
  }
}

// ══ JEU : TRI PAR CATÉGORIE ═══════════════════════════

function startPanier() {
  const diff = DIFFICULTY[state.difficulty];
  state.score = 0;
  state.correct = 0;

  // Ensure all 4 categories represented
  const cats = Object.keys(BASKETS_CATEGORIE);
  let chosen = [];
  cats.forEach(cat => {
    const bycat = Object.entries(FRUITS).filter(([,f]) => f.cat === cat);
    const n = Math.max(1, Math.floor(diff.count / cats.length));
    chosen = chosen.concat(shuffle(bycat).slice(0, n));
  });
  chosen = shuffle(chosen).slice(0, diff.count);
  state.currentFruits = chosen;
  state.total = chosen.length;

  document.getElementById('p-score').textContent = 0;
  document.getElementById('p-left').textContent = state.total;
  document.getElementById('p-progress').style.width = '0%';
  document.getElementById('p-timer-hud').classList.remove('visible', 'timer-urgent');

  // Render fruits
  const fruitsEl = document.getElementById('p-fruits');
  fruitsEl.innerHTML = '';
  chosen.forEach(([key, fruit], i) => {
    const el = document.createElement('div');
    el.className = 'fruit-item';
    el.innerHTML = `<span title="${fruit.nom}">${fruit.e}</span>`;
    el.style.animationDelay = i * .06 + 's';
    el.id = 'fruit-p-' + key + '-' + i;
    setupDrag(el, key, fruit, handlePanierDrop);
    fruitsEl.appendChild(el);
  });

  // Render baskets
  const basketsEl = document.getElementById('p-baskets');
  basketsEl.innerHTML = '';
  cats.forEach(cat => {
    const bdata = BASKETS_CATEGORIE[cat];
    const b = document.createElement('div');
    b.className = 'basket basket-' + cat;
    b.innerHTML = `
      <div class="basket-body" data-target="${cat}">
        <div class="basket-emoji">${bdata.emoji}</div>
        <div class="basket-label">${bdata.label}</div>
        <div class="basket-count" id="bp-${cat}">0</div>
      </div>`;
    basketsEl.appendChild(b);
  });

  showScreen('panier');
  startTimer('p', () => endGame('panier'));
}

function handlePanierDrop(drag, target, x, y) {
  const isCorrect = drag.data.cat === target;
  const el = drag.el;

  if (isCorrect) {
    state.score += 10;
    state.correct++;
    playSound('correct');
    el.classList.add('correct-anim');
    showScorePopup(x, y, '+10 ⭐', 'correct');
    const bp = document.getElementById('bp-' + target);
    if (bp) bp.textContent = parseInt(bp.textContent || 0) + 1;
    setTimeout(() => el.remove(), 450);
    document.getElementById('p-score').textContent = state.score;
    document.getElementById('p-left').textContent = state.total - state.correct;
    document.getElementById('p-progress').style.width = (state.correct / state.total * 100) + '%';
    if (state.correct >= state.total) {
      setTimeout(() => endGame('panier'), 500);
    }
  } else {
    playSound('wrong');
    el.classList.add('wrong-anim');
    state.score = Math.max(0, state.score - 3);
    showScorePopup(x, y, '-3 ❌', 'wrong');
    document.getElementById('p-score').textContent = state.score;
    setTimeout(() => el.classList.remove('wrong-anim'), 400);
  }
}

// ══ JEU : TRI PAR TAILLE ══════════════════════════════

const TAILLE_ROUNDS = [
  ['cerise','fraise','citron','orange','pasteque'],
  ['myrtille','kiwi','pomme_rouge','banane','ananas'],
  ['framboise','cerise','peche','mangue','pasteque'],
  ['citron','pomme_verte','orange','citron_vert','ananas'],
];

// visual size map: taille 1→tiny, 5→big
const SIZE_MAP = { 1: 44, 2: 56, 3: 68, 4: 82, 5: 98 };

function startTaille() {
  const diff = DIFFICULTY[state.difficulty];
  state.tailleScore = 0;
  state.tailleTotal = 0;
  state.tailleRound = 0;

  document.getElementById('t-score').textContent = 0;
  document.getElementById('t-timer-hud').classList.remove('visible', 'timer-urgent');
  document.getElementById('t-progress').style.width = '0%';

  showScreen('taille');
  startTimer('t', () => endGame('taille'));
  loadTailleRound();
}

function loadTailleRound() {
  const rounds = TAILLE_ROUNDS;
  if (state.tailleRound >= rounds.length) {
    endGame('taille'); return;
  }

  const roundFruits = rounds[state.tailleRound];
  const diff = DIFFICULTY[state.difficulty];
  // facile: 3 fruits, moyen: 5
  const count = diff.timer ? 5 : 3;
  const fruitKeys = shuffle(roundFruits).slice(0, count);
  const fruitsData = fruitKeys.map(k => [k, FRUITS[k]]).filter(([,f]) => f);

  document.getElementById('t-round').textContent = state.tailleRound + 1;

  // Source (shuffled)
  const sourceEl = document.getElementById('t-fruits');
  sourceEl.innerHTML = '';
  const shuffledFruits = shuffle([...fruitsData]);

  shuffledFruits.forEach(([key, fruit], i) => {
    const size = SIZE_MAP[fruit.taille] || 64;
    const el = document.createElement('div');
    el.className = 'taille-fruit';
    el.style.cssText = `width:${size}px;height:${size}px;font-size:${size * 0.65}px;animation-delay:${i*.07}s`;
    el.dataset.key = key;
    el.dataset.taille = fruit.taille;
    el.innerHTML = `<span title="${fruit.nom}">${fruit.e}</span>`;
    setupDragTaille(el, key, fruit);
    sourceEl.appendChild(el);
  });

  // Slots (ordered 1 to n by taille)
  const sortedByTaille = [...fruitsData].sort((a, b) => a[1].taille - b[1].taille);
  const slotsEl = document.getElementById('t-slots');
  slotsEl.innerHTML = '';

  sortedByTaille.forEach(([key, fruit], i) => {
    const size = SIZE_MAP[fruit.taille] || 64;
    const wrapper = document.createElement('div');
    wrapper.className = 'taille-slot';

    const box = document.createElement('div');
    box.className = 'slot-box';
    box.style.cssText = `width:${size + 12}px;height:${size + 12}px;font-size:${(size+12)*0.5}px`;
    box.dataset.target = 'slot-' + i;
    box.dataset.expectedTaille = fruit.taille;
    box.dataset.expectedKey = key;
    box.textContent = '?';

    const num = document.createElement('div');
    num.className = 'slot-number';
    num.textContent = i === 0 ? '🐜 Petit' : i === sortedByTaille.length - 1 ? '🐘 Grand' : (i + 1) + 'ème';

    wrapper.appendChild(box);
    wrapper.appendChild(num);
    slotsEl.appendChild(wrapper);
  });
}

let tailleDragItem = null;

function setupDragTaille(el, key, fruit) {
  const ghostEl = document.getElementById('drag-ghost');

  const start = (x, y) => {
    tailleDragItem = { el, key, fruit };
    el.classList.add('dragging');
    ghostEl.textContent = fruit.e;
    ghostEl.style.display = 'block';
    moveGhost(x, y);
  };

  el.addEventListener('mousedown', e => { start(e.clientX, e.clientY); e.preventDefault(); });
  el.addEventListener('touchstart', e => {
    const t = e.touches[0];
    start(t.clientX, t.clientY);
    e.preventDefault();
  }, { passive: false });
}

document.addEventListener('mouseup', e => dropTaille(e.clientX, e.clientY));
document.addEventListener('touchend', e => {
  const t = e.changedTouches[0];
  dropTaille(t.clientX, t.clientY);
});

function dropTaille(x, y) {
  if (!tailleDragItem) return;
  const ghostEl = document.getElementById('drag-ghost');
  ghostEl.style.display = 'none';

  const els = document.elementsFromPoint(x, y);
  let dropped = false;
  for (const t of els) {
    if (t.dataset.target && t.dataset.target.startsWith('slot-')) {
      // Place fruit in slot
      const fruit = tailleDragItem.fruit;
      const size = SIZE_MAP[fruit.taille] || 64;
      t.innerHTML = `<span style="font-size:${size * 0.7}px">${fruit.e}</span>`;
      t.classList.add('filled');
      t.dataset.placedKey = tailleDragItem.key;
      t.dataset.placedTaille = fruit.taille;
      tailleDragItem.el.remove();
      dropped = true;
      break;
    }
  }

  tailleDragItem.el.classList.remove('dragging');
  document.querySelectorAll('.drag-over').forEach(b => b.classList.remove('drag-over'));
  tailleDragItem = null;
}

function checkTaille() {
  const slots = document.querySelectorAll('.slot-box');
  let allFilled = true;
  slots.forEach(s => { if (!s.dataset.placedKey) allFilled = false; });

  if (!allFilled) {
    // Shake unfilled slots
    slots.forEach(s => {
      if (!s.dataset.placedKey) {
        s.style.animation = 'none';
        requestAnimationFrame(() => s.style.animation = 'slotWrong .5s ease');
      }
    });
    return;
  }

  let roundCorrect = 0;
  slots.forEach(s => {
    const expected = parseInt(s.dataset.expectedTaille);
    const placed   = parseInt(s.dataset.placedTaille || 0);
    if (expected === placed) {
      roundCorrect++;
      s.classList.add('slot-correct');
    } else {
      s.classList.add('slot-wrong');
    }
  });

  const total = slots.length;
  const points = roundCorrect * 10;
  state.tailleScore += points;
  state.tailleTotal += total;
  document.getElementById('t-score').textContent = state.tailleScore;

  const progress = ((state.tailleRound + 1) / TAILLE_ROUNDS.length * 100);
  document.getElementById('t-progress').style.width = progress + '%';

  if (roundCorrect === total) {
    playSound('correct');
  } else {
    playSound('wrong');
  }

  state.tailleRound++;

  setTimeout(() => {
    if (state.tailleRound >= TAILLE_ROUNDS.length) {
      endGame('taille');
    } else {
      loadTailleRound();
    }
  }, 1200);
}

// ══ FIN DE JEU ════════════════════════════════════════

function endGame(mode) {
  clearGame();
  let score, total, correct;

  if (mode === 'taille') {
    score   = state.tailleScore;
    total   = state.tailleTotal || (TAILLE_ROUNDS.length * (DIFFICULTY[state.difficulty].timer ? 5 : 3));
    correct = Math.round(score / 10);
  } else {
    score   = state.score;
    total   = state.total;
    correct = state.correct;
  }

  const pct = total > 0 ? correct / total : 0;
  let stars = pct >= .9 ? 3 : pct >= .65 ? 2 : 1;
  let trophy, title, msg;

  if (stars === 3) {
    trophy = '🏆'; title = 'Parfait !';
    msg = 'Incroyable ! Tu es un champion du tri de fruits ! 🎉';
    playSound('win');
  } else if (stars === 2) {
    trophy = '🥈'; title = 'Très bien !';
    msg = 'Super travail ! Tu t\'améliores à chaque fois ! 💪';
    playSound('correct');
  } else {
    trophy = '🌟'; title = 'Bravo !';
    msg = 'Bien joué ! Continue à t\'entraîner, tu vas y arriver ! 🚀';
  }

  document.getElementById('result-trophy').textContent = trophy;
  document.getElementById('result-title').textContent  = title;
  document.getElementById('result-score').textContent  = score + ' pts';
  document.getElementById('result-msg').textContent    = msg;

  const starsEl = document.getElementById('result-stars');
  starsEl.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const s = document.createElement('span');
    s.className = 'result-star';
    s.textContent = i < stars ? '⭐' : '☆';
    starsEl.appendChild(s);
  }

  launchConfetti();
  showScreen('result');
}

function launchConfetti() {
  const wrap = document.getElementById('confetti');
  wrap.innerHTML = '';
  const colors = ['#ffb300','#e53935','#43a047','#1e88e5','#8e24aa','#00acc1','#fb8c00'];
  for (let i = 0; i < 80; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = `
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      width:${6 + Math.random()*10}px;
      height:${6 + Math.random()*10}px;
      border-radius:${Math.random() > .5 ? '50%' : '2px'};
      animation-duration:${2 + Math.random()*3}s;
      animation-delay:${Math.random()*1.5}s;
    `;
    wrap.appendChild(p);
  }
}

// ══ INIT ══════════════════════════════════════════════
showScreen('home');
