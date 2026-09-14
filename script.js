/* ============================================================
   E&B Studios — motion + page behavior
   ============================================================ */

(() => {
  /* ---------- settings you'll edit ---------- */
  const CONFIG = {
    // Where inquiries go (footer + consult requests).
    email: "ethanlong1102@gmail.com",

    // Google Calendar appointment schedule embed link (the iframe src ending in ?gv=true).
    // Leave empty to use the built-in "request a slot" form, which opens the visitor's email app.
    bookingEmbedUrl: "https://calendar.google.com/calendar/appointments/schedules/AcZssZ16S3plQyFYWWsZwvB9hEj7wvuBkCiKt-WodOp-zyFSQ4lBJxfPTjtfH3R-VAGIMkVZpV1aeXe3?gv=true",

    // Public booking page, used as a fallback link if the embed is blocked.
    bookingLink: "https://calendar.app.google/4SrA89J7dB6cKtww9",

    // Built-in request form only (ignored once bookingEmbedUrl is set).
    timeZone: "Central Time",
    timeZoneShort: "CT",
    slots: ["10:00 AM", "11:30 AM", "2:30 PM", "4:00 PM"],
    closedWeekdays: [0, 6], // 0 = Sunday, 6 = Saturday
    leadDays: 2,            // earliest bookable day = today + leadDays
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- small fills ---------- */
  $$("[data-email]").forEach((el) => {
    el.textContent = CONFIG.email;
    if (el.tagName === "A") el.href = "mailto:" + CONFIG.email;
  });
  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- per-letter wave ---------- */
  $$("[data-wave]").forEach((el) => {
    const step = parseFloat(el.dataset.wave) || 0.06;
    const text = el.textContent;
    el.textContent = "";
    el.classList.add("wv");

    const sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = text;
    const letters = document.createElement("span");
    letters.setAttribute("aria-hidden", "true");

    let i = 0;
    text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { letters.appendChild(document.createTextNode(" ")); i++; return; }
      const word = document.createElement("span");
      word.className = "w";
      for (const ch of part) {
        const c = document.createElement("span");
        c.className = "c";
        c.textContent = ch;
        c.style.setProperty("--i", (i * step).toFixed(2) + "s");
        word.appendChild(c);
        i++;
      }
      letters.appendChild(word);
    });
    el.append(sr, letters);
  });

  /* ---------- reveal on scroll ---------- */
  // IntersectionObserver plus a rect sweep, so anchor jumps and re-filtered cards still reveal.
  let io = null;
  const reveal = (el) => {
    if (el.classList.contains("in")) return;
    el.classList.add("in");
    if (el.classList.contains("lift")) setTimeout(() => { el.style.overflow = "visible"; }, 1100);
    // clip-path also clips the element's own box-shadow, so release it once the
    // wipe has finished — otherwise framed stills lose their offset lime block.
    if (el.classList.contains("wipe")) setTimeout(() => { el.style.clipPath = "none"; }, 1200);
    if (io) io.unobserve(el);
  };
  const sweep = () => {
    const h = window.innerHeight;
    $$("[data-rv]:not(.in)").forEach((el) => {
      if (el.closest("[hidden]")) return;
      const r = el.getBoundingClientRect();
      if (r.top < h * 0.94 && r.bottom > 0) reveal(el);
    });
  };

  if (reduce || !("IntersectionObserver" in window)) {
    $$("[data-rv]").forEach((el) => { el.classList.add("in"); el.style.overflow = ""; });
  } else {
    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) reveal(en.target); });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
    $$("[data-rv]").forEach((el) => io.observe(el));
    setInterval(sweep, 400);
  }

  /* ---------- progress bar, header, parallax ---------- */
  const bar = $(".progress");
  const header = $(".site-header");
  const parallax = $$("[data-parallax]");
  let raf = 0;

  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const sc = document.scrollingElement || document.documentElement;
      const y = window.scrollY || sc.scrollTop || document.body.scrollTop || 0;
      const max = Math.max(1, Math.max(sc.scrollHeight, document.body.scrollHeight) - window.innerHeight);
      if (bar) bar.style.transform = "scaleX(" + Math.min(1, y / max) + ")";
      if (header) header.classList.toggle("is-tight", y > 40);
      if (!reduce) {
        parallax.forEach((px) => {
          const r = px.parentElement.getBoundingClientRect();
          const prog = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
          const amount = parseFloat(px.dataset.parallax) || 26;
          px.style.transform = "translateY(" + (prog * -amount).toFixed(2) + "px)";
        });
      }
      if (!reduce) sweep();
    });
  };
  document.addEventListener("scroll", onScroll, { passive: true, capture: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("load", onScroll);
  onScroll();

  /* ---------- background video loops: play only while visible ---------- */
  const loops = $$("video[data-loop]");
  if (loops.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      loops.forEach((v) => { v.removeAttribute("autoplay"); v.pause(); });
    } else {
      const vio = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          const v = en.target;
          if (en.isIntersecting) v.play().catch(() => {});
          else v.pause();
        });
      }, { threshold: 0.15 });
      loops.forEach((v) => vio.observe(v));
    }
  }

  /* ---------- reel lightbox (cards with data-video) ---------- */
  const reelCards = $$("[data-video]");
  if (reelCards.length && typeof HTMLDialogElement === "function") {
    const dialog = document.createElement("dialog");
    dialog.className = "reel-dialog";
    dialog.innerHTML = '<button class="reel-close" type="button" aria-label="Close video">×</button><video controls playsinline></video>';
    document.body.appendChild(dialog);
    const video = $("video", dialog);

    const close = () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      if (dialog.open) dialog.close();
    };
    const open = (card) => {
      video.src = card.dataset.video;
      video.setAttribute("aria-label", card.dataset.title || "Project video");
      dialog.showModal();
      video.play().catch(() => {});
    };

    $(".reel-close", dialog).addEventListener("click", close);
    dialog.addEventListener("click", (e) => { if (e.target === dialog) close(); });
    dialog.addEventListener("cancel", (e) => { e.preventDefault(); close(); });

    reelCards.forEach((card) => {
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.addEventListener("click", () => open(card));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(card); }
      });
    });
  }

  /* ---------- work: filters ---------- */
  const grid = $("#grid");
  if (grid) {
    const chips = $$(".chip", grid);
    const cards = $$(".card[data-cat]", grid); // includes the featured card
    const count = $("[data-count]", grid);
    const real = cards.filter((c) => !c.hasAttribute("data-placeholder")).length;
    $$("[data-total]").forEach((el) => { el.textContent = real; });

    const apply = (filter) => {
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.filter === filter)));
      let shown = 0; // real projects only — the N/A placeholder isn't one
      cards.forEach((card) => {
        const show = filter === "All" || card.dataset.cat === filter;
        card.hidden = !show;
        if (show) {
          if (!card.hasAttribute("data-placeholder")) shown++;
          if (!reduce) { card.classList.remove("in"); card.style.clipPath = ""; }
        }
      });
      if (count) {
        count.textContent = shown
          ? "SHOWING " + shown + (shown === 1 ? " PROJECT" : " PROJECTS") + " — " + filter.toUpperCase()
          : "NOTHING HERE YET — " + filter.toUpperCase();
      }
      requestAnimationFrame(() => requestAnimationFrame(sweep));
    };

    chips.forEach((c) => c.addEventListener("click", () => apply(c.dataset.filter)));
    apply("All");
  }

  /* ---------- consult: booking ---------- */
  const book = $("#book");
  if (book) {
    const formView = $("[data-booking-form]", book);
    const embedView = $("[data-booking-embed]", book);

    if (CONFIG.bookingEmbedUrl) {
      formView.hidden = true;
      embedView.hidden = false;
      const frame = document.createElement("iframe");
      frame.src = CONFIG.bookingEmbedUrl;
      frame.title = "Book a consult";
      frame.loading = "lazy";
      $(".embed-panel", embedView).appendChild(frame);
      if (CONFIG.bookingLink) {
        $$("[data-booking-link]", embedView).forEach((a) => { a.href = CONFIG.bookingLink; });
      }
    } else {
      setupRequestForm(formView);
    }
  }

  function setupRequestForm(root) {
    const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const earliest = new Date(today);
    earliest.setDate(earliest.getDate() + CONFIG.leadDays);

    const state = { y: earliest.getFullYear(), m: earliest.getMonth(), day: null, slot: null };

    const monthLabel = $("[data-month]", root);
    const prev = $("[data-prev]", root);
    const next = $("[data-next]", root);
    const daysEl = $("[data-days]", root);
    const slotsEl = $("[data-slots]", root);
    const chosen = $("[data-chosen]", root);
    const status = $("[data-status]", root);
    const form = $("form", root);

    $$("[data-tz]", root).forEach((el) => { el.textContent = CONFIG.timeZoneShort; });
    $$("[data-tz-long]", root).forEach((el) => { el.textContent = CONFIG.timeZone; });

    const isOpen = (d) => d >= earliest && !CONFIG.closedWeekdays.includes(d.getDay());
    const selectedDate = () => (state.day ? new Date(state.y, state.m, state.day) : null);
    const chosenText = () => {
      const d = selectedDate();
      if (!d) return "Pick a day to continue";
      const date = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      return state.slot ? date + " · " + state.slot : date + " · pick a time";
    };

    const render = () => {
      monthLabel.textContent = MONTHS[state.m] + " " + state.y;
      prev.disabled = state.y < earliest.getFullYear() ||
        (state.y === earliest.getFullYear() && state.m <= earliest.getMonth());

      const first = new Date(state.y, state.m, 1);
      const lead = (first.getDay() + 6) % 7; // Monday-first grid
      const total = new Date(state.y, state.m + 1, 0).getDate();
      const frag = document.createDocumentFragment();
      for (let i = 0; i < lead; i++) frag.appendChild(document.createElement("span"));
      for (let d = 1; d <= total; d++) {
        const date = new Date(state.y, state.m, d);
        const b = document.createElement("button");
        b.type = "button";
        b.className = "day";
        b.textContent = d;
        b.dataset.day = d;
        b.disabled = !isOpen(date);
        b.setAttribute("aria-pressed", String(d === state.day));
        b.setAttribute("aria-label", date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
        frag.appendChild(b);
      }
      daysEl.replaceChildren(frag);

      slotsEl.replaceChildren(...CONFIG.slots.map((s) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "slot";
        b.textContent = s;
        b.dataset.slot = s;
        b.setAttribute("aria-pressed", String(s === state.slot));
        return b;
      }));

      chosen.textContent = chosenText();
    };

    const shift = (n) => {
      let m = state.m + n, y = state.y;
      if (m > 11) { m = 0; y++; }
      if (m < 0) { m = 11; y--; }
      Object.assign(state, { m, y, day: null });
      render();
    };

    prev.addEventListener("click", () => shift(-1));
    next.addEventListener("click", () => shift(1));
    daysEl.addEventListener("click", (e) => {
      const b = e.target.closest(".day");
      if (!b || b.disabled) return;
      state.day = Number(b.dataset.day);
      render();
      status.textContent = "";
    });
    slotsEl.addEventListener("click", (e) => {
      const b = e.target.closest(".slot");
      if (!b) return;
      state.slot = b.dataset.slot;
      render();
      status.textContent = "";
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.elements.name;
      const email = form.elements.email;
      [name, email].forEach((f) => f.removeAttribute("aria-invalid"));

      const problems = [];
      if (!state.day || !state.slot) problems.push("pick a day and a time");
      if (!name.value.trim()) { problems.push("add your name"); name.setAttribute("aria-invalid", "true"); }
      if (!email.value.trim() || !email.checkValidity()) { problems.push("add a valid email"); email.setAttribute("aria-invalid", "true"); }

      if (problems.length) {
        status.textContent = "Almost there — " + problems.join(", ") + ".";
        const firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }

      const slotLine = chosenText() + " (" + CONFIG.timeZoneShort + ")";
      const body = [
        "Name: " + name.value.trim(),
        "Email: " + email.value.trim(),
        "Project type: " + form.elements.type.value,
        "Target window: " + (form.elements.window.value.trim() || "—"),
        "Requested slot: " + slotLine,
        "",
        "What I want to walk away with:",
        form.elements.goal.value.trim() || "—",
      ].join("\n");
      const subject = "Consult request — " + slotLine;

      window.location.href = "mailto:" + CONFIG.email +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      status.textContent = "Your email app should open with everything filled in — hit send and we'll confirm your slot within one business day. Nothing opened? Email " + CONFIG.email + ".";
    });

    render();
  }
})();
