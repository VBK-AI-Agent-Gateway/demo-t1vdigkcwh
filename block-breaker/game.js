/* Block Breaker - 纯 Canvas 实现，无依赖 */
(() => {
  'use strict';
  const cvs = document.getElementById('game');
  const ctx = cvs.getContext('2d');
  const W = () => cvs.width, H = () => cvs.height;

  const el = id => document.getElementById(id);
  const scoreEl = el('score'), levelEl = el('level'), livesEl = el('lives');
  const overlay = el('overlay'), oTitle = el('overlay-title'), oText = el('overlay-text');
  const btnStart = el('btn-start'), btnPause = el('btn-pause'), btnSound = el('btn-sound');

  const STATE = { MENU: 0, PLAYING: 1, PAUSED: 2, GAMEOVER: 3, LEVELCLEAR: 4 };
  let state = STATE.MENU;
  let score = 0, lives = 3, level = 1, soundOn = true;

  const paddle = { w: 120, h: 14, x: 0, y: 0, speed: 640 };
  const ball = { x: 0, y: 0, r: 9, vx: 0, vy: 0, speed: 380, stuck: true };
  let bricks = [];
  let keys = { left: false, right: false };

  // 音效（WebAudio 简单合成，无需资源文件）
  let actx = null;
  function beep(freq, dur = 0.06, type = 'square', vol = 0.04) {
    if (!soundOn) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.value = vol;
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + dur);
    } catch (e) { /* ignore */ }
  }

  const COLORS = ['#ff5d73', '#ff9f43', '#ffd166', '#4cc2ff', '#7b5cff', '#2ee6a6'];

  function buildLevel(lv) {
    bricks = [];
    const rows = Math.min(4 + lv, 8);
    const cols = 10;
    const pad = 6, top = 70;
    const bw = (W() - pad * (cols + 1)) / cols;
    const bh = 24;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // 高关卡加入少量需多次击打的砖块
        const tough = lv >= 3 && (r + c) % 5 === 0;
        bricks.push({
          x: pad + c * (bw + pad),
          y: top + r * (bh + pad),
          w: bw, h: bh,
          hp: tough ? 2 : 1,
          color: COLORS[r % COLORS.length]
        });
      }
    }
  }

  function resetBall() {
    ball.stuck = true;
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - ball.r - 2;
    const ang = (-Math.PI / 3) + Math.random() * (Math.PI / 3); // -60°..-120° 区间向上
    ball.vx = Math.cos(ang) * ball.speed;
    ball.vy = Math.sin(ang) * ball.speed;
    if (ball.vy > -120) ball.vy = -120;
  }

  function initLevel() {
    paddle.w = Math.max(84, 120 - (level - 1) * 6);
    paddle.x = (W() - paddle.w) / 2;
    paddle.y = H() - 40;
    ball.speed = 380 + (level - 1) * 30;
    buildLevel(level);
    resetBall();
    updateHUD();
  }

  function updateHUD() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    livesEl.textContent = lives;
  }

  function showOverlay(title, text, btn) {
    oTitle.textContent = title;
    oText.textContent = text;
    btnStart.textContent = btn;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() { overlay.classList.add('hidden'); }

  function startGame() {
    if (state === STATE.GAMEOVER || state === STATE.MENU) {
      score = 0; lives = 3; level = 1;
    }
    initLevel();
    state = STATE.PLAYING;
    hideOverlay();
    btnPause.textContent = '暂停';
    beep(660, 0.08, 'sine');
  }

  function togglePause() {
    if (state === STATE.PLAYING) {
      state = STATE.PAUSED;
      btnPause.textContent = '继续';
      showOverlay('已暂停', '喘口气，准备好了就继续！', '继续游戏');
    } else if (state === STATE.PAUSED) {
      state = STATE.PLAYING;
      btnPause.textContent = '暂停';
      hideOverlay();
    }
  }

  function launch() {
    if (ball.stuck && state === STATE.PLAYING) {
      ball.stuck = false;
      beep(520, 0.05, 'triangle');
    }
  }

  // ---- 输入 ----
  btnStart.addEventListener('click', () => {
    if (state === STATE.PAUSED) togglePause();
    else startGame();
  });
  btnPause.addEventListener('click', togglePause);
  btnSound.addEventListener('click', () => {
    soundOn = !soundOn;
    btnSound.textContent = '音效: ' + (soundOn ? '开' : '关');
    if (soundOn) beep(700, 0.05, 'sine');
  });

  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space') {
      e.preventDefault();
      if (state === STATE.PLAYING) { if (ball.stuck) launch(); else togglePause(); }
      else if (state === STATE.PAUSED) togglePause();
      else startGame();
    }
    if (e.code === 'KeyP') togglePause();
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
  });

  function pointerX(e) {
    const rect = cvs.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    return cx * (W() / rect.width);
  }
  function movePaddleTo(cx) {
    paddle.x = Math.min(Math.max(cx - paddle.w / 2, 0), W() - paddle.w);
    if (ball.stuck) ball.x = paddle.x + paddle.w / 2;
  }
  cvs.addEventListener('mousemove', e => movePaddleTo(pointerX(e)));
  cvs.addEventListener('touchstart', e => { e.preventDefault(); movePaddleTo(pointerX(e)); launch(); }, { passive: false });
  cvs.addEventListener('touchmove', e => { e.preventDefault(); movePaddleTo(pointerX(e)); launch(); }, { passive: false });
  cvs.addEventListener('click', () => { if (state === STATE.PLAYING) launch(); });

  // ---- 更新 ----
  function update(dt) {
    if (state !== STATE.PLAYING) return;

    if (keys.left) { paddle.x -= paddle.speed * dt; if (ball.stuck) ball.x -= paddle.speed * dt; }
    if (keys.right) { paddle.x += paddle.speed * dt; if (ball.stuck) ball.x += paddle.speed * dt; }
    paddle.x = Math.min(Math.max(paddle.x, 0), W() - paddle.w);

    if (ball.stuck) { ball.y = paddle.y - ball.r - 2; return; }

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // 墙壁
    if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); beep(300, 0.03); }
    if (ball.x + ball.r > W()) { ball.x = W() - ball.r; ball.vx = -Math.abs(ball.vx); beep(300, 0.03); }
    if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); beep(300, 0.03); }

    // 挡板
    if (ball.vy > 0 &&
        ball.y + ball.r >= paddle.y && ball.y + ball.r <= paddle.y + paddle.h + 8 &&
        ball.x >= paddle.x - ball.r && ball.x <= paddle.x + paddle.w + ball.r) {
      const rel = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2); // -1..1
      const ang = rel * (Math.PI / 3); // 最大 60°
      const sp = Math.hypot(ball.vx, ball.vy);
      ball.vx = Math.sin(ang) * sp;
      ball.vy = -Math.abs(Math.cos(ang) * sp);
      ball.y = paddle.y - ball.r - 1;
      beep(440, 0.04, 'triangle');
    }

    // 砖块
    for (let i = bricks.length - 1; i >= 0; i--) {
      const b = bricks[i];
      if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
          ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
        // 判断碰撞法线
        const overlapL = (ball.x + ball.r) - b.x;
        const overlapR = (b.x + b.w) - (ball.x - ball.r);
        const overlapT = (ball.y + ball.r) - b.y;
        const overlapB = (b.y + b.h) - (ball.y - ball.r);
        const minX = Math.min(overlapL, overlapR), minY = Math.min(overlapT, overlapB);
        if (minX < minY) {
          if (overlapL < overlapR) ball.vx = -Math.abs(ball.vx); else ball.vx = Math.abs(ball.vx);
        } else {
          if (overlapT < overlapB) ball.vy = -Math.abs(ball.vy); else ball.vy = Math.abs(ball.vy);
        }
        b.hp--;
        if (b.hp <= 0) {
          bricks.splice(i, 1);
          score += 10 * level;
          beep(620 + Math.random() * 200, 0.05, 'square');
        } else {
          score += 5;
          beep(320, 0.04, 'sawtooth');
        }
        updateHUD();
        break;
      }
    }

    // 全部清空 → 过关
    if (bricks.length === 0) {
      score += 100 * level;
      level++;
      state = STATE.LEVELCLEAR;
      updateHUD();
      beep(880, 0.1, 'sine'); setTimeout(() => beep(1100, 0.12, 'sine'), 110);
      setTimeout(() => {
        initLevel();
        state = STATE.PLAYING;
      }, 900);
      return;
    }

    // 掉球
    if (ball.y - ball.r > H()) {
      lives--;
      updateHUD();
      beep(160, 0.2, 'sawtooth', 0.06);
      if (lives <= 0) {
        state = STATE.GAMEOVER;
        showOverlay('游戏结束', `最终得分 ${score} · 到达第 ${level} 关`, '再来一局');
      } else {
        resetBall();
      }
    }
  }

  // ---- 绘制 ----
  function draw() {
    ctx.clearRect(0, 0, W(), H());

    // 网格背景
    ctx.strokeStyle = 'rgba(76,194,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W(); x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H()); ctx.stroke(); }
    for (let y = 0; y < H(); y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W(), y); ctx.stroke(); }

    // 砖块
    for (const b of bricks) {
      ctx.fillStyle = b.color;
      roundRect(b.x, b.y, b.w, b.h, 5);
      ctx.fill();
      if (b.hp > 1) {
        ctx.strokeStyle = 'rgba(255,255,255,.65)';
        ctx.lineWidth = 2;
        roundRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4, 4);
        ctx.stroke();
      }
    }

    // 挡板
    const g = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.w, 0);
    g.addColorStop(0, '#2a9df4'); g.addColorStop(1, '#4cc2ff');
    ctx.fillStyle = g;
    roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 7);
    ctx.fill();

    // 球
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd166';
    ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    if (ball.stuck && state === STATE.PLAYING) {
      ctx.fillStyle = 'rgba(232,236,248,.75)';
      ctx.font = '15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('点击 / 空格 发球', W() / 2, H() - 70);
    }
    if (state === STATE.PAUSED) {
      ctx.fillStyle = 'rgba(232,236,248,.9)';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('已暂停', W() / 2, H() / 2 + 90);
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---- 主循环 ----
  let last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.033);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // 初始化
  paddle.x = (W() - paddle.w) / 2;
  paddle.y = H() - 40;
  resetBall();
  updateHUD();
  showOverlay('打砖块', '用鼠标 / 手指移动挡板，把砖块全部击碎！', '开始游戏');
  requestAnimationFrame(loop);
})();