const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

let toastTimer;
function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

function initPreloader() {
  const pre = $("#preloader");
  window.setTimeout(() => {
    pre.classList.add("done");
    document.body.classList.add("loaded");
  }, 900);
}

function initNav() {
  const nav = $("#nav");
  const btn = $("#menuBtn");
  const links = $("#navLinks");

  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const setOpen = (open) => {
    links.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "close menu" : "open menu");
  };
  btn.addEventListener("click", () => setOpen(!links.classList.contains("open")));
  $$("a", links).forEach((a) => a.addEventListener("click", () => setOpen(false)));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

function initScrollSpy() {
  const navAnchors = new Map(
    $$('.nav-links > a[href^="#"]:not(.btn)').map((a) => [a.getAttribute("href").slice(1), a])
  );
  if (!navAnchors.size) return;
  const spy = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        const anchor = navAnchors.get(entry.target.id);
        if (!anchor) return;
        if (entry.isIntersecting) {
          navAnchors.forEach((a) => a.classList.remove("active"));
          anchor.classList.add("active");
        }
      }),
    { rootMargin: "-40% 0px -55% 0px" }
  );
  $$("main section[id]").forEach((s) => spy.observe(s));
}

function initProgress() {
  const bar = $("#progressBar");
  const update = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
  };
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

function initReveals() {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      }),
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el) => io.observe(el));
}

function initTimeline() {
  const tl = $("#timeline");
  if (!tl) return;
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          tl.classList.add("drawn");
          io.disconnect();
        }
      }),
    { threshold: 0.2 }
  );
  io.observe(tl);
}

function initCounters() {
  const stats = $("#stats");
  if (!stats) return;
  const animate = (el) => {
    const target = +el.dataset.count;
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counters = $$("[data-count]", stats);
  if (reducedMotion) {
    counters.forEach((el) => (el.textContent = el.dataset.count));
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          counters.forEach(animate);
          io.disconnect();
        }
      }),
    { threshold: 0.4 }
  );
  io.observe(stats);
}

function initCursor() {
  if (!matchMedia("(pointer: fine)").matches || reducedMotion) return;
  const dot = $("#cursorDot");
  document.body.classList.add("has-cursor");
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
  window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function loop() {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    requestAnimationFrame(loop);
  })();
  const interactive = "a, button, input, textarea, .chip, .skill-card, .edu-card, .xp-card";
  document.addEventListener("mouseover", (e) => {
    dot.classList.toggle("hovering", !!e.target.closest(interactive));
  });
}

function initParallax() {
  if (!matchMedia("(pointer: fine)").matches || reducedMotion) return;
  const shapes = $$("[data-parallax]");
  if (!shapes.length) return;
  let mx = 0, my = 0;
  window.addEventListener("mousemove", (e) => {
    mx = e.clientX / innerWidth - 0.5;
    my = e.clientY / innerHeight - 0.5;
  }, { passive: true });
  (function loop() {
    shapes.forEach((s) => {
      const f = +s.dataset.parallax;
      s.style.transform = `translate(${mx * f}px, ${my * f}px)`;
    });
    requestAnimationFrame(loop);
  })();
}

function initTestimonials() {
  const slider = $("#tSlider");
  if (!slider) return;
  const viewport = $(".t-viewport", slider);
  const track = $("#tTrack", slider);
  const cards = $$(".t-card", track);
  const prevBtn = $("#tPrev");
  const nextBtn = $("#tNext");
  const dotsWrap = $("#tDots");
  const mq = window.matchMedia("(max-width: 820px)");
  let index = 0;
  let timer = null;

  slider.setAttribute("role", "region");
  slider.setAttribute("aria-roledescription", "carousel");
  slider.setAttribute("aria-label", "testimonials");
  cards.forEach((c, i) => {
    c.setAttribute("role", "group");
    c.setAttribute("aria-roledescription", "slide");
    c.setAttribute("aria-label", `${i + 1} of ${cards.length}`);
  });

  const perView = () => (mq.matches ? 1 : 2);
  const maxIndex = () => Math.max(0, cards.length - perView());
  const step = () => (cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 0);

  const update = () => {
    index = Math.min(index, maxIndex());
    track.style.transform = `translateX(${-index * step()}px)`;
    $$(".t-dot", dotsWrap).forEach((d, i) => {
      d.classList.toggle("active", i === index);
      d.setAttribute("aria-current", i === index ? "true" : "false");
    });
    cards.forEach((c, i) =>
      c.setAttribute("aria-hidden", String(i < index || i >= index + perView()))
    );
  };

  const buildDots = () => {
    dotsWrap.innerHTML = "";
    for (let i = 0; i <= maxIndex(); i++) {
      const b = document.createElement("button");
      b.className = "t-dot";
      b.setAttribute("aria-label", `go to testimonial ${i + 1}`);
      b.addEventListener("click", () => { index = i; update(); });
      dotsWrap.appendChild(b);
    }
  };

  const go = (dir) => {
    index = (index + dir + maxIndex() + 1) % (maxIndex() + 1);
    update();
  };
  prevBtn.addEventListener("click", () => go(-1));
  nextBtn.addEventListener("click", () => go(1));

  const onResize = () => { buildDots(); update(); };
  mq.addEventListener("change", onResize);
  window.addEventListener("resize", onResize);

  const start = () => {
    if (!reducedMotion && !timer) timer = setInterval(() => go(1), 6000);
  };
  const stop = () => { clearInterval(timer); timer = null; };
  slider.addEventListener("pointerenter", stop);
  slider.addEventListener("pointerleave", start);
  slider.addEventListener("focusin", stop);
  slider.addEventListener("focusout", start);
  start();

  let startX = null;
  viewport.addEventListener("pointerdown", (e) => { startX = e.clientX; stop(); });
  window.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    start();
  });

  onResize();
}

function initTheme() {
  const btn = $("#themeBtn");
  if (!btn) return;
  const root = document.documentElement;
  const apply = (dark) => {
    root.classList.toggle("dark", dark);
    btn.innerHTML = `<i data-lucide="${dark ? "sun" : "moon"}"></i>`;
    if (window.lucide) lucide.createIcons();
    btn.setAttribute("aria-pressed", String(dark));
    btn.setAttribute("aria-label", dark ? "switch to light mode" : "switch to dark mode");
    try { localStorage.hammadTheme = dark ? "dark" : "light"; } catch (e) {}
  };
  apply(root.classList.contains("dark"));
  btn.addEventListener("click", () => apply(!root.classList.contains("dark")));
}

function splitHeadings() {
  $$(".section-head h2").forEach((h) => {
    const wrap = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              return;
            }
            const outer = document.createElement("span");
            outer.className = "w";
            const inner = document.createElement("span");
            inner.className = "wi";
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR" && !child.classList.contains("circle-doodle")) {
          wrap(child);
        }
      });
    };
    wrap(h);
    $$(".wi", h).forEach((w, i) => w.style.setProperty("--wd", i));
  });
}

function initCycler() {
  const cycler = $("#cycler");
  if (!cycler) return;
  const words = $$(".cyc-word", cycler);
  if (words.length < 2) return;
  let idx = 0;
  words[0].classList.add("cyc-active");
  if (reducedMotion) return;
  setInterval(() => {
    const prev = words[idx];
    idx = (idx + 1) % words.length;
    const next = words[idx];
    prev.classList.remove("cyc-active");
    prev.classList.add("cyc-leave");
    setTimeout(() => prev.classList.remove("cyc-leave"), 520);
    next.classList.add("cyc-active");
  }, 2300);
}

function initContactForm() {
  const form = $("#contactForm");
  if (!form) return;
  const ENDPOINT = "https://formspree.io/f/mrpzdnbw";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let valid = true;
    $$(".field input, .field textarea", form).forEach((input) => {
      const ok = input.checkValidity();
      input.closest(".field").classList.toggle("error", !ok);
      if (!ok) valid = false;
    });
    if (!valid) {
      showToast("please fill in all fields properly ✦");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const original = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.textContent = "sending...";

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("send failed");
      showToast("message sent — hammad will get back to you ✦");
      form.reset();
    } catch (err) {
      showToast("couldn't send — email hammadakram058@gmail.com instead");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = original;
      if (window.lucide) lucide.createIcons();
    }
  });

  $$(".field input, .field textarea", form).forEach((input) =>
    input.addEventListener("input", () => input.closest(".field").classList.remove("error"))
  );
}

function initMisc() {
  $("#year").textContent = new Date().getFullYear();

  const fab = $("#fab");
  window.addEventListener(
    "scroll",
    () => fab.classList.toggle("show", window.scrollY > 500),
    { passive: true }
  );
  fab.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" })
  );

  $("#toTop").addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" })
  );
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) lucide.createIcons();
  initTheme();
  splitHeadings();
  initPreloader();
  initNav();
  initScrollSpy();
  initProgress();
  initReveals();
  initTimeline();
  initCounters();
  initCycler();
  initTestimonials();
  initCursor();
  initParallax();
  initContactForm();
  initMisc();
});
