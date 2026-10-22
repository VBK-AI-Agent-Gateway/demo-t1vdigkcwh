/* deploy.sh demo interactions */
(function(){
  'use strict';

  /* ---------- pipeline simulation ---------- */
  const stages = Array.from(document.querySelectorAll('.stage'));
  const logEl  = document.getElementById('termLog');
  if(!stages.length || !logEl) return;

  const lines = [
    ['dim',  '$ git push origin main'],
    ['',     '→ 检出提交 a91f2c7 (feat: 边缘缓存预热)'],
    ['ok',   '✓ 依赖安装完成 · 缓存命中 92%'],
    ['ok',   '✓ lint 通过 · 0 warning'],
    ['ok',   '✓ 单测 312/312 · 覆盖率 94.6%'],
    ['warn', '▸ 构建产物 4.18 MB → gzip 1.06 MB'],
    ['ok',   '✓ 预览环境 pr-2481.deploy.sh 已就绪'],
    ['',     '→ 灰度 10% 流量…健康检查通过'],
    ['ok',   '✓ 发布完成 · 全球 18 边缘节点同步 (1.2s)'],
    ['dim',  '  流水线 #2481 结束，总耗时 42s'],
  ];

  let li = 0, si = 0;

  function pushLine(){
    if(li >= lines.length){ return; }
    const [cls, text] = lines[li++];
    const span = document.createElement('span');
    if(cls) span.className = cls;
    span.textContent = text + '\n';
    logEl.appendChild(span);
    while(logEl.childNodes.length > 9) logEl.removeChild(logEl.firstChild);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function tick(){
    if(si < stages.length){
      if(si > 0){ stages[si-1].classList.remove('running'); stages[si-1].classList.add('done'); }
      stages[si].classList.add('running');
      si++;
      pushLine();
      setTimeout(tick, 700 + Math.random()*500);
    } else {
      stages[stages.length-1].classList.remove('running');
      stages[stages.length-1].classList.add('done');
      pushLine();
      setTimeout(reset, 3200);
    }
  }

  function reset(){
    stages.forEach(s => s.classList.remove('done','running'));
    logEl.innerHTML = '';
    li = 0; si = 0;
    setTimeout(tick, 600);
  }

  setTimeout(tick, 700);

  /* ---------- animated counters ---------- */
  const nums = document.querySelectorAll('.num[data-count]');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      const el = e.target;
      io.unobserve(el);
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dec = parseInt(el.dataset.dec || '0', 10);
      const dur = 1500, t0 = performance.now();
      (function step(now){
        const p = Math.min(1,(now-t0)/dur);
        const eased = 1-Math.pow(1-p,3);
        el.textContent = (target*eased).toFixed(dec) + suffix;
        if(p<1) requestAnimationFrame(step);
      })(t0);
    });
  },{threshold:.4});
  nums.forEach(n=>io.observe(n));

  /* ---------- reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.card, .steps li, .stat');
  revealEls.forEach(el=>{ el.style.opacity='0'; el.style.transform='translateY(18px)'; el.style.transition='opacity .6s ease, transform .6s ease'; });
  const io2 = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.style.opacity='1'; e.target.style.transform='none'; io2.unobserve(e.target); }
    });
  },{threshold:.15});
  revealEls.forEach(el=>io2.observe(el));

  /* ---------- copy button ---------- */
  const copyBtn = document.getElementById('copyBtn');
  if(copyBtn){
    copyBtn.addEventListener('click', async ()=>{
      try{
        await navigator.clipboard.writeText('npx deploy-sh init --auto');
        copyBtn.textContent='已复制 ✓';
      }catch(err){ copyBtn.textContent='复制失败'; }
      setTimeout(()=>copyBtn.textContent='复制',1600);
    });
  }
})();