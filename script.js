const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ============ SPLIT TEXT ============ */
function splitChars(el) {
  const text = el.textContent;
  const off = +el.dataset.offset || 0;
  el.textContent = "";
  [...text].forEach((ch, i) => {
    const s = document.createElement("span");
    s.className = "char";
    s.style.setProperty("--i", i + off);
    s.setAttribute("aria-hidden", "true");
    s.textContent = ch === " " ? "\u00A0" : ch;
    el.appendChild(s);
  });
}
$$(".split-chars").forEach(splitChars);

function splitWords(el) {
  const nodes = [...el.childNodes];
  el.textContent = "";
  let i = 0;
  const add = (node) => {
    const w = document.createElement("span");
    w.className = "w";
    const inner = document.createElement("span");
    inner.className = "wi";
    inner.style.setProperty("--i", i++);
    inner.appendChild(node);
    w.appendChild(inner);
    el.appendChild(w);
    el.appendChild(document.createTextNode(" "));
  };
  nodes.forEach((n) => {
    if (n.nodeType === 3) {
      n.textContent.split(/\s+/).filter(Boolean).forEach((word) => add(document.createTextNode(word)));
    } else add(n);
  });
}
$$(".split-words").forEach(splitWords);

/* Scroll-lit paragraph */
const rt = $(".reveal-text");
rt.innerHTML = rt.textContent.trim().split(/\s+/).map((w) => `<span class="rw">${w}</span>`).join(" ");
const rws = $$(".rw");
function updateReveal() {
  const r = rt.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
  const n = Math.floor(p * rws.length * 1.15);
  rws.forEach((w, i) => w.classList.toggle("on", i < n));
}

/* Marquee duplicate for seamless loop */
$$(".marquee .track").forEach((t) => (t.innerHTML += t.innerHTML));

/* ============ LOADER ============ */
const loader = $("#loader");
const countEl = $("#count");
const barEl = $("#bar");
function finishLoad() {
  loader.classList.add("done");
  setTimeout(() => document.body.classList.add("loaded"), 500);
}
(function startLoad() {
  const t0 = performance.now(), dur = 2200;
  function tick(now) {
    const p = Math.min(1, (now - t0) / dur);
    const val = Math.round((1 - Math.pow(1 - p, 3)) * 100);
    countEl.textContent = val;
    barEl.style.width = val + "%";
    if (p < 1) requestAnimationFrame(tick);
    else finishLoad();
  }
  requestAnimationFrame(tick);
})();
setTimeout(() => document.body.classList.add("loaded"), 4500); // safety

/* ============ PAGE TRANSITIONS ============ */
const curtain = $(".curtain");
function pageTransition(cb) {
  if (curtain.classList.contains("in") || curtain.classList.contains("out")) return;
  curtain.classList.add("in");
  setTimeout(() => {
    cb();
    curtain.classList.remove("in");
    curtain.classList.add("out");
    setTimeout(() => curtain.classList.remove("out"), 1000);
  }, 900);
}

const burger = $("#burger");
const menu = $("#mobile-menu");
function closeMenu() {
  burger.classList.remove("open");
  menu.classList.remove("open");
}
burger.addEventListener("click", () => {
  burger.classList.toggle("open");
  menu.classList.toggle("open");
});

$$('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    pageTransition(() => {
      const top = id === "#home" ? 0 : target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: "instant" });
    });
  });
});

/* ============ SPARKLES + CURSOR ============ */
const sc = $("#sparkles");
const sx = sc.getContext("2d");
function sizeCanvas() { sc.width = innerWidth; sc.height = innerHeight; }
sizeCanvas();
addEventListener("resize", sizeCanvas);

const parts = [];
let hue = 280;
function spawn(x, y, n) {
  if (parts.length > 300) parts.splice(0, n);
  for (let i = 0; i < n; i++) {
    parts.push({
      x, y,
      vx: (Math.random() - 0.5) * 2.4,
      vy: (Math.random() - 0.5) * 2.4 - 0.3,
      life: 1,
      size: Math.random() * 5 + 2,
      hue: hue + Math.random() * 40
    });
  }
  hue = (hue + 4) % 360;
}
(function drawParts() {
  sx.clearRect(0, 0, sc.width, sc.height);
  sx.globalCompositeOperation = "lighter";
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.x += p.vx; p.y += p.vy; p.life -= 0.025; p.size *= 0.97;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    sx.beginPath();
    sx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    sx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${p.life * 0.8})`;
    sx.fill();
  }
  requestAnimationFrame(drawParts);
})();

const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
let rx = mouse.x, ry = mouse.y, gx = mouse.x, gy = mouse.y;
const dot = $(".cursor-dot"), ring = $(".cursor-ring"), ringTxt = $(".cursor-ring span"), glow = $(".cursor-glow");

addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; spawn(mouse.x, mouse.y, 2); });
addEventListener("touchmove", (e) => {
  mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; spawn(mouse.x, mouse.y, 2);
}, { passive: true });

(function cursorLoop() {
  rx += (mouse.x - rx) * 0.18; ry += (mouse.y - ry) * 0.18;
  gx += (mouse.x - gx) * 0.06; gy += (mouse.y - gy) * 0.06;
  dot.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%, -50%)`;
  ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
  glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%, -50%)`;
  requestAnimationFrame(cursorLoop);
})();

document.addEventListener("mouseover", (e) => {
  const t = e.target.closest("a, button, .btn, .card, [data-cursor]");
  if (t) { ring.classList.add("hover"); ringTxt.textContent = t.dataset.cursor || ""; }
  else { ring.classList.remove("hover"); ringTxt.textContent = ""; }
});

/* ============ MAGNETIC BUTTONS + RIPPLE ============ */
$$(".magnetic").forEach((el) => {
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
  });
  el.addEventListener("mouseleave", () => { el.style.transform = ""; });
});
$$(".btn").forEach((b) => b.addEventListener("click", (e) => {
  const r = b.getBoundingClientRect();
  const s = document.createElement("span");
  s.className = "rip";
  s.style.left = e.clientX - r.left - 20 + "px";
  s.style.top = e.clientY - r.top - 20 + "px";
  b.appendChild(s);
  setTimeout(() => s.remove(), 600);
}));

/* ============ 3D TILT + SPOTLIGHT ============ */
$$(".tilt").forEach((el) => {
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", px * 100 + "%");
    el.style.setProperty("--my", py * 100 + "%");
    el.style.transform = `perspective(900px) rotateY(${(px - 0.5) * 16}deg) rotateX(${(0.5 - py) * 16}deg) scale(1.03)`;
  });
  el.addEventListener("mouseleave", () => { el.style.transform = ""; });
});

/* ============ HERO MOUSE PARALLAX ============ */
const hero = $(".hero");
const scene = $("#scene");
hero.addEventListener("mousemove", (e) => {
  const x = e.clientX / innerWidth - 0.5;
  const y = e.clientY / innerHeight - 0.5;
  $$(".p").forEach((p) => {
    const d = +p.dataset.depth;
    p.style.transform = `translate(${x * d}px, ${y * d}px)`;
  });
  scene.style.transform = `rotateY(${x * 30}deg) rotateX(${-y * 30}deg)`;
});

/* ============ SCROLL TRIGGERS ============ */
function countUp(el, to, suffix = "") {
  const t0 = performance.now(), dur = 1800;
  (function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suffix;
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const el = en.target;
    el.classList.add("in");
    if (el.dataset.count) countUp(el, +el.dataset.count, el.dataset.suffix || "");
    if (el.classList.contains("ring")) {
      const lvl = +el.dataset.level;
      el.querySelector(".fgc").style.strokeDashoffset = 327 * (1 - lvl / 100);
      countUp(el.querySelector("b"), lvl, "%");
    }
    io.unobserve(el);
  });
}, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
$$("[data-anim], .split-words, [data-count]").forEach((el) => io.observe(el));

const heroInner = $(".hero-inner");
const tl = $(".timeline");
const tline = $(".t-line");
const spyLinks = $$(".links a");
const spySections = ["home", "about", "services", "projects", "contact"].map((id) => $("#" + id));

function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  $(".progress").style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
  $("#nav").classList.toggle("scrolled", y > 40);

  if (y < innerHeight) {
    heroInner.style.transform = `translateY(${y * 0.25}px)`;
    heroInner.style.opacity = 1 - y / (innerHeight * 0.9);
  }
  updateReveal();

  const r = tl.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
  tline.style.height = p * 100 + "%";

  let cur = "home";
  spySections.forEach((s) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = s.id; });
  spyLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + cur));
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ============ WHATSAPP FORM ============ */
$("#wa-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#f-name").value.trim();
  const msg = $("#f-msg").value.trim();
  const text = `Hi morfette! I'm ${name}. ${msg}`;
  window.open("https://wa.me/254727385417?text=" + encodeURIComponent(text), "_blank");
});