/* eslint-disable */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

// HUD
const hud = {
  level: document.getElementById('level'),
  lap: document.getElementById('lap'),
  lapmax: document.getElementById('lapmax'),
  speed: document.getElementById('speed'),
  aiState: document.getElementById('ai-state')
};

// مفاتيح
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

// مضمار بسيط: حلقة مستطيلة مع مستطيل داخلي
const track = {
  outer: { x: 100, y: 80, w:  Math.min(canvas.width, 1100), h: Math.min(canvas.height, 650) },
  inner: { x: 260, y: 220, w:  Math.min(canvas.width, 1100) - 320, h: Math.min(canvas.height, 650) - 280 },
  checkpoints: [] // نولدها لاحقًا على الأضلاع الأربعة
};

function genCheckpoints() {
  const { outer, inner } = track;
  track.checkpoints = [
    { x: outer.x + outer.w/2, y: outer.y + 10 },                // أعلى الوسط
    { x: outer.x + outer.w - 10, y: outer.y + outer.h/2 },      // يمين الوسط
    { x: outer.x + outer.w/2, y: outer.y + outer.h - 10 },      // أسفل الوسط
    { x: outer.x + 10, y: outer.y + outer.h/2 }                 // يسار الوسط
  ];
}
genCheckpoints();

class Car {
  constructor(x, y, color='#66fcf1') {
    this.x = x; this.y = y;
    this.angle = 0; // راديان
    this.speed = 0; // بكسل/ثانية
    this.maxSpeed = 240;
    this.accel = 420;
    this.brake = 620;
    this.friction = 180;
    this.turn = 2.8;
    this.color = color;
    this.width = 28; this.height = 14; // للمستطيل
    this.lap = 0; this.cpIndex = 0;    // checkpoint progress
  }
  forwardVector() { return { x: Math.cos(this.angle), y: Math.sin(this.angle) }; }
  update(dt, input) {
    // فيزياء طولية
    if (input.throttle > 0) this.speed += this.accel * input.throttle * dt;
    if (input.throttle < 0) this.speed += this.brake * input.throttle * dt; // كبح
    // احتكاك طبيعي
    const sign = Math.sign(this.speed);
    const mag = Math.max(0, Math.abs(this.speed) - this.friction * dt);
    this.speed = mag * sign;
    // حد السرعة
    const clampMax = this.maxSpeed || 240;
    this.speed = Math.max(-140, Math.min(clampMax, this.speed));
    // دوران يتناسب مع السرعة
    this.angle += input.steer * this.turn * (this.speed / 240) * dt;
    // حركة
    const f = this.forwardVector();
    this.x += f.x * this.speed * dt;
    this.y += f.y * this.speed * dt;
    // حدود المضمار: لو خرج بره أو دخل جوه الداخلي → ارتداد بسيط وكبح
    const { outer, inner } = track;
    const out = (this.x < outer.x || this.x > outer.x+outer.w || this.y < outer.y || this.y > outer.y+outer.h);
    const inn = (this.x > inner.x && this.x < inner.x+inner.w && this.y > inner.y && this.y < inner.y+inner.h);
    if (out || inn) {
      this.speed *= 0.4;
      // ادفعه لداخل الحارة بين outer و inner
      this.x = Math.max(outer.x+12, Math.min(outer.x+outer.w-12, this.x));
      if (!(this.x > inner.x && this.x < inner.x+inner.w)) {/* ok */}
      this.y = Math.max(outer.y+12, Math.min(outer.y+outer.h-12, this.y));
    }
    // تقدم الـ checkpoints
    const cp = track.checkpoints[this.cpIndex];
    const dcp = Math.hypot(cp.x - this.x, cp.y - this.y);
    if (dcp < 40) {
      this.cpIndex = (this.cpIndex + 1) % track.checkpoints.length;
      if (this.cpIndex === 0) this.lap += 1;
    }
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
    // مقدمة السيارة
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(this.width/2 - 4, -this.height/2, 4, this.height);
    ctx.restore();
  }
}

const player = new Car(track.outer.x + 80, track.outer.y + track.outer.h/2, '#45a29e');
player.angle = 0;

const enemy = new Car(track.outer.x + 120, track.outer.y + track.outer.h/2 + 30, '#e85d75');
enemy.maxSpeed = 230;

// مستويات بسيطة
const levels = [
  { laps: 2, aiMax: 220, name: 'تجربة' },
  { laps: 3, aiMax: 250, name: 'تسارع' },
  { laps: 4, aiMax: 280, name: 'احتراف' }
];
let levelIndex = 0;
hud.level.textContent = (levelIndex+1).toString();
hud.lapmax.textContent = levels[levelIndex].laps.toString();

function drawTrack() {
  const { outer, inner, checkpoints } = track;
  ctx.fillStyle = '#2b303b';
  ctx.fillRect(outer.x, outer.y, outer.w, outer.h);
  ctx.fillStyle = '#0b0c10';
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
  // خطوط
  ctx.strokeStyle = '#cfd8dc';
  ctx.lineWidth = 2;
  checkpoints.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI*2);
    ctx.stroke();
    ctx.fillStyle = i === 0 ? '#66fcf1' : '#bbb';
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
  });
}

const state = { last: 0, aiCmd: { throttle: 0, steer: 0 }, aiTimer: 0 };

async function queryAI(dt) {
  state.aiTimer += dt;
  // قلل معدل الطلبات لتقليل الحمل
  if (state.aiTimer < 0.10) return;
  state.aiTimer = 0;
  const cp = track.checkpoints[enemy.cpIndex];
  try {
    const res = await fetch('http://127.0.0.1:5001/ai/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ai: { x: enemy.x, y: enemy.y, angle: enemy.angle, speed: Math.abs(enemy.speed) },
        target: { cx: cp.x, cy: cp.y },
        params: { max_speed: levels[levelIndex].aiMax, aggr: 1.0 }
      })
    });
    const data = await res.json();
    state.aiCmd.throttle = Math.max(-1, Math.min(1, data.throttle || 0));
    state.aiCmd.steer = Math.max(-1, Math.min(1, data.steer || 0));
    hud.aiState.textContent = `thr ${state.aiCmd.throttle.toFixed(2)} | st ${state.aiCmd.steer.toFixed(2)}`;
  } catch (e) {
    hud.aiState.textContent = 'خدمة AI غير متاحة';
  }
}

function playerInput() {
  let throttle = 0, steer = 0;
  if (keys['ArrowUp']) throttle += 1;
  if (keys['ArrowDown']) throttle -= 1;
  if (keys['ArrowLeft']) steer -= 1;
  if (keys['ArrowRight']) steer += 1;
  return { throttle, steer };
}

function maybeAdvanceLevel() {
  if (player.lap >= levels[levelIndex].laps) {
    levelIndex = Math.min(levels.length - 1, levelIndex + 1);
    player.lap = 0; player.cpIndex = 0;
    enemy.lap = 0; enemy.cpIndex = 0;
    // تحسين المضمار قليلًا (تصغير الداخلي ↓ يزيد صعوبة المنعطف)
    track.inner.x += 10; track.inner.y += 8; track.inner.w -= 20; track.inner.h -= 16;
    genCheckpoints();
    hud.level.textContent = (levelIndex+1).toString();
    hud.lapmax.textContent = levels[levelIndex].laps.toString();
  }
}

function loop(ts) {
  const now = ts / 1000;
  const dt = Math.min(0.033, now - (state.last || now));
  state.last = now;

  // تحديث
  player.update(dt, playerInput());
  queryAI(dt);
  enemy.update(dt, state.aiCmd);

  maybeAdvanceLevel();

  // رسم
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawTrack();
  player.draw(ctx);
  enemy.draw(ctx);

  // HUD
  hud.lap.textContent = player.lap.toString();
  hud.speed.textContent = Math.round(Math.abs(player.speed)).toString();

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
