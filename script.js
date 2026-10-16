const header = document.querySelector('[data-header]');
const menu = document.querySelector('[data-menu]');
const nav = document.querySelector('[data-nav]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 8), { passive: true });

menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
});

nav.addEventListener('click', (event) => {
  if (event.target.matches('a')) {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
  }
});

// Highlight the nav link for the section in view.
const links = [...nav.querySelectorAll('a')].map((a) => ({ a, section: document.querySelector(a.getAttribute('href')) }));
const updateActive = () => {
  const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
  let current = atBottom ? links[links.length - 1] : null;
  if (!current) links.forEach((link) => { if (link.section.getBoundingClientRect().top < window.innerHeight * 0.35) current = link; });
  links.forEach((link) => link.a.classList.toggle('active', link === current));
};
window.addEventListener('scroll', updateActive, { passive: true });
updateActive();

// Reveal cards as they scroll in.
const reveal = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      reveal.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.card, .person').forEach((el) => {
  el.classList.add('reveal');
  reveal.observe(el);
});

// Mark passed milestones on the timeline.
const today = new Date();
document.querySelectorAll('[data-timeline] li').forEach((li) => {
  if (new Date(`${li.dataset.date}T23:59:59-12:00`) < today) li.classList.add('past');
});

// Hero: a drifting network of humans (circles) and AI agents (squares).
const canvas = document.querySelector('[data-nexus]');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const colors = { human: '255,138,92', ai: '92,200,255' };
  let nodes = [];
  let width = 0;
  let height = 0;
  let pointer = null;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(90, Math.max(28, (width * height) / 9000)));
    nodes = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 2 + Math.random() * 2.6,
      kind: i % 2 ? 'ai' : 'human',
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    const reach = Math.min(150, width / 6);
    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < reach) {
          const mixed = a.kind !== b.kind;
          ctx.strokeStyle = mixed ? `rgba(255,255,255,${(1 - d / reach) * 0.45})` : `rgba(${colors[a.kind]},${(1 - d / reach) * 0.3})`;
          ctx.lineWidth = mixed ? 1.1 : 0.8;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    nodes.forEach((n) => {
      ctx.fillStyle = `rgb(${colors[n.kind]})`;
      ctx.beginPath();
      if (n.kind === 'human') ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      else ctx.rect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
      ctx.fill();
    });
  };

  const step = () => {
    nodes.forEach((n) => {
      if (pointer) {
        const dx = pointer.x - n.x;
        const dy = pointer.y - n.y;
        const d = Math.hypot(dx, dy);
        if (d < 160 && d > 1) { n.vx += (dx / d) * 0.012; n.vy += (dy / d) * 0.012; }
      }
      n.vx *= 0.995; n.vy *= 0.995;
      const speed = Math.hypot(n.vx, n.vy);
      if (speed < 0.08) { n.vx += (Math.random() - 0.5) * 0.04; n.vy += (Math.random() - 0.5) * 0.04; }
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    });
    draw();
    if (running) requestAnimationFrame(step);
  };

  let running = false;
  const visible = new IntersectionObserver(([entry]) => {
    const shouldRun = entry.isIntersecting && !reduceMotion;
    if (shouldRun && !running) { running = true; requestAnimationFrame(step); }
    else if (!shouldRun) running = false;
  });

  canvas.parentElement.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  });
  canvas.parentElement.addEventListener('pointerleave', () => { pointer = null; });
  window.addEventListener('resize', () => { resize(); draw(); });

  resize();
  draw();
  visible.observe(canvas);
}
