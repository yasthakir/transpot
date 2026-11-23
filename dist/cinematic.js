/* SinghRJ Transport — cinematic interactions (vanilla, dependency-free) */
(() => {
  'use strict';
  /* If opened by double-clicking the file (file://), root-relative URLs like /img/x.jpg can't resolve. Point them at ./public */
  if (location.protocol === 'file:') {
    const fix = u => (u && u[0] === '/' && u[1] !== '/') ? 'public' + u : u;
    document.querySelectorAll('[src],[href]').forEach(el => {
      ['src', 'href'].forEach(a => { const v = el.getAttribute(a); if (v && v[0] === '/' && v[1] !== '/') el.setAttribute(a, fix(v)); });
    });
    document.querySelectorAll('[style*="url(/"]').forEach(el => { el.setAttribute('style', el.getAttribute('style').replace(/url\(\/(?!\/)/g, 'url(public/')); });
    window.__fixUrl = fix;
  }
  const U = u => (window.__fixUrl ? window.__fixUrl(u) : u);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const isMobile = () => innerWidth < 768;

  /* ---------- Header ---------- */
  const header = $('#header');
  const onScrollHeader = () => header.classList.toggle('is-scrolled', scrollY > 40);
  addEventListener('scroll', onScrollHeader, { passive: true }); onScrollHeader();

  /* ---------- Mobile menu ---------- */
  const menu = $('#mobile-menu'), openBtn = $('#open-menu'), closeBtn = $('#close-menu');
  const setMenu = open => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    openBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  openBtn?.addEventListener('click', () => setMenu(true));
  closeBtn?.addEventListener('click', () => setMenu(false));
  $$('#mobile-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Hero: scroll-scrubbed HD footage + chapters ---------- */
  const hero = $('#hero'), hv = $('#hero-video'), loader = $('#hero-loader');
  const htrack = $('#hero-track'), hbar = $('#hero-bar'), cue = $('#scroll-cue');
  const chaps = $$('.chap', hero);
  const dotsEl = $('#hero-dots');
  const sceneChaps = chaps.filter(c => +c.dataset.from > 0);
  const dots = sceneChaps.map((c, i) => { const d = document.createElement('span'); d.textContent = '0' + (i + 1); dotsEl.appendChild(d); return d; });
  let loaderGone = false;
  const hideLoader = () => { if (loaderGone) return; loaderGone = true; loader.classList.add('is-done'); };
  const poster = $('.hero__poster');
  if (poster.complete) setTimeout(hideLoader, 400); else poster.addEventListener('load', () => setTimeout(hideLoader, 300));
  setTimeout(hideLoader, 2500);

  // The bundled MP4 files are not present in public/videos. Prefer the
  // included WebM source, and fall back to it if a media source fails.
  hv.src = U(hv.dataset.srcWebm);
  hv.muted = true; hv.pause();
  let hReady = false, hSeeking = false;
  hv.addEventListener('loadedmetadata', () => { hReady = true; hv.currentTime = 0.001; });
  hv.addEventListener('seeked', () => { hSeeking = false; hero.classList.add('is-playing'); });
  hv.addEventListener('error', () => hero.classList.remove('is-playing')); // poster stays as fallback
  hv.load();

  // headline holds briefly before the footage starts moving
  const HOLD = 0.06;
  const DUR = () => (hv.duration && isFinite(hv.duration)) ? hv.duration : 10;
  const warp = p => p < HOLD ? (p / HOLD) * 0.35 : 0.35 + (p - HOLD) / (1 - HOLD) * (DUR() - 0.4);
  let hCur = 0, hOn = true;
  const hProgress = () => { const r = htrack.getBoundingClientRect(); return Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); };
  const setChap = t => {
    chaps.forEach(c => {
      const on = t >= +c.dataset.from && t < +c.dataset.to;
      c.classList.toggle('is-active', on);
      c.classList.toggle('is-past', t >= +c.dataset.to);
    });
    sceneChaps.forEach((c, i) => { dots[i].classList.toggle('is-on', t >= +c.dataset.from && t < +c.dataset.to); dots[i].classList.toggle('is-done', t >= +c.dataset.to); });
  };
  {
    new IntersectionObserver(([e]) => { hOn = e.isIntersecting; }, { rootMargin: '150px' }).observe(htrack);
    (function hLoop() {
      if (hOn) {
        const target = hProgress(); hCur += (target - hCur) * (reduce ? 1 : 0.14); if (Math.abs(target - hCur) < 0.0004) hCur = target;
        const t = Math.min(DUR() - 0.04, warp(hCur));
        if (hReady && !hSeeking && Math.abs(hv.currentTime - t) > 0.02) { hSeeking = true; hv.currentTime = t; }
        hbar.style.transform = `scaleY(${hCur})`;
        setChap(t);
        cue.classList.toggle('is-hidden', hCur > 0.02);
      }
      requestAnimationFrame(hLoop);
    })();
  }

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal]').forEach((el, i) => {
    // stagger siblings
    const sibs = el.parentElement ? $$(':scope > [data-reveal]', el.parentElement) : [];
    el.style.setProperty('--rd', (Math.max(0, sibs.indexOf(el)) * 0.09) + 's');
    io.observe(el);
  });

  /* ---------- Count-up (real figures only: values come from markup) ---------- */
  const countIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    countIO.unobserve(e.target);
    const el = e.target, end = +el.dataset.count;
    if (reduce) { el.textContent = end; return; }
    const t0 = performance.now(), dur = 1600;
    const tick = t => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: 0.6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- 3D tilt cards ---------- */
  if (fine && !reduce) {
    $$('.tilt').forEach(el => {
      let raf = 0;
      el.addEventListener('pointermove', e => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          el.classList.add('is-tilting');
          el.style.transform = `perspective(1000px) rotateX(${(0.5 - y) * 9}deg) rotateY(${(x - 0.5) * 11}deg) translateY(-6px)`;
          el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
        });
      });
      el.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); el.classList.remove('is-tilting'); el.style.transform = ''; });
    });
  }

  /* ---------- About image parallax ---------- */
  const pimg = $('[data-parallax-img]');
  if (pimg && !reduce) {
    const upd = () => {
      const r = pimg.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      pimg.style.setProperty('--py', (-p * 50 - 20) + 'px');
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  /* ---------- Journey: scroll-scrubbed real footage ---------- */
  const track = $('.journey__track'), jv = $('#journey-video'), bar = $('#journey-bar');
  const steps = $$('.step', track);
  if (track && jv) {
    let target = 0, cur = 0, ready = false, ticking = false, seeking = false;
    jv.muted = true; jv.pause();
    jv.addEventListener('loadedmetadata', () => { ready = true; jv.currentTime = 0.001; });
    jv.addEventListener('error', () => { jv.style.display = 'none'; });
    jv.src = U('/videos/truck-hd-scrub.webm');
    jv.load();
    const progress = () => {
      const r = track.getBoundingClientRect();
      return Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
    };
    const setSteps = p => {
      const idx = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.9999));
      steps.forEach((s, i) => { s.classList.toggle('is-active', i === idx); s.classList.toggle('is-done', i < idx); });
    };
    jv.addEventListener('seeked', () => { seeking = false; });
    // only run the loop while the section is near the viewport
    let running = false;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) { running = true; requestAnimationFrame(function again() { if (!running) return; loopOnce(); requestAnimationFrame(again); }); }
      else if (!e.isIntersecting) running = false;
    }, { rootMargin: '100px' }).observe(track);
    const loopOnce = () => {
      target = progress(); cur += (target - cur) * 0.12; if (Math.abs(target - cur) < 0.0004) cur = target;
      bar.style.transform = `scaleX(${cur})`; setSteps(cur);
      if (ready && jv.duration && !seeking) {
        const t = Math.min(jv.duration - 0.05, cur * jv.duration);
        if (Math.abs(jv.currentTime - t) > 0.03) { seeking = true; jv.currentTime = t; }
      }
    };
  } else if (jv) { jv.style.display = 'none'; }

  /* ---------- Marquee: duplicate for seamless loop ---------- */
  const mt = $('.marquee__track');
  if (mt && !reduce) {
    $$(':scope > .review', mt).forEach(n => { const c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); mt.appendChild(c); });
    // keep 4 originals + 4 clones: loop distance = half
  }

  /* ---------- Hero mouse parallax (desktop only) ---------- */
  if (fine && !reduce) {
    const copy = $('.hero__copy');
    hero.addEventListener('pointermove', e => { if (!copy.classList.contains('is-active')) return;
      const x = (e.clientX / innerWidth - .5), y = (e.clientY / innerHeight - .5);
      copy.style.transform = `translate3d(${x * -8}px,${y * -6}px,0)`;
    });
  }
})();
