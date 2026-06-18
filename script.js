/* ============================================================
   E&B Studios — interactions & animations
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll progress + viewfinder readout + parallax ---------- */
  const progress = document.getElementById("scrollProgress");
  const header = document.getElementById("siteHeader");
  const vfPct = document.getElementById("vfPct");
  const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]"));
  const ribbons = Array.from(document.querySelectorAll(".ribbon"));
  const brandBackdrop = document.getElementById("brandBackdrop");

  // scroll-pinned showreel "theater"
  const reelScene = document.querySelector(".reel-scene");
  const reelStage = document.getElementById("reelStage");
  const reelCue = document.getElementById("reelCue");

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  function driveReel() {
    if (!reelScene || !reelStage) return;
    const rect = reelScene.getBoundingClientRect();
    const distance = rect.height - window.innerHeight;
    const p = distance > 0 ? clamp(-rect.top / distance, 0, 1) : 0;

    // entrance: reel rises + scales up over the first ~40% of the pin
    const t = clamp(p / 0.4, 0, 1);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic

    if (reduceMotion) {
      reelStage.style.transform = "none";
      reelStage.style.opacity = "1";
    } else {
      const ty = lerp(46, 0, eased);          // rises from 46vh below to center
      const scale = lerp(0.72, 1, eased);
      reelStage.style.transform = `translateY(${ty.toFixed(2)}vh) scale(${scale.toFixed(3)})`;
      reelStage.style.opacity = clamp(t * 1.6, 0, 1).toFixed(3);
    }

    // swap the cue text once the reel is locked and watchable
    if (reelCue) {
      const locked = t >= 0.98;
      reelCue.textContent = locked ? "▶ Press play to watch" : "↓ Scroll to roll film";
      reelCue.style.opacity = p > 0.92 ? "0" : "1"; // fade out as we leave the scene
    }
  }

  let lastY = window.scrollY;
  let ticking = false;

  function update() {
    const y = window.scrollY;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const pct = h > 0 ? y / h : 0;

    progress.style.width = pct * 100 + "%";
    if (vfPct) vfPct.textContent = Math.round(pct * 100) + "%";

    // header background once scrolled
    header.classList.toggle("scrolled", y > 20);

    // hide on scroll down, show on scroll up (past the hero)
    if (y > 400 && y > lastY) header.classList.add("hide");
    else header.classList.remove("hide");
    lastY = y;

    // depth-of-field parallax
    if (!reduceMotion) {
      const vh = window.innerHeight;
      for (const el of parallaxEls) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const speed = parseFloat(el.dataset.parallax) || 0.08;
        const offset = (r.top + r.height / 2 - vh / 2) * -speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      }
      // film strips drift through the background as you scroll
      for (const rb of ribbons) {
        const sp = parseFloat(rb.dataset.speed) || 0.06;
        rb.style.transform = `translate3d(0, ${(y * sp).toFixed(1)}px, 0)`;
      }
      if (brandBackdrop) {
        brandBackdrop.style.setProperty("--brand-shift", `${(pct * 120 - 40).toFixed(1)}px`);
        brandBackdrop.style.setProperty("--brand-roll", `${(pct * 3 - 1.5).toFixed(2)}deg`);
      }
    }

    driveReel();
    ticking = false;
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();

  /* ---------- Viewfinder: live REC timecode (24fps) ---------- */
  const vfTime = document.getElementById("vfTime");
  if (vfTime && !reduceMotion) {
    const start = performance.now();
    (function tick(now) {
      const elapsed = (now - start) / 1000;
      const total = Math.floor(elapsed * 24); // frames at 24fps
      const f = String(total % 24).padStart(2, "0");
      const s = String(Math.floor(total / 24) % 60).padStart(2, "0");
      const m = String(Math.floor(total / 24 / 60) % 60).padStart(2, "0");
      vfTime.textContent = `${m}:${s}:${f}`;
      requestAnimationFrame(tick);
    })(start);
  }

  /* ---------- Viewfinder: scene counter (SCN xx/total) ---------- */
  const vfScene = document.getElementById("vfScene");
  const scenes = document.querySelectorAll("main > section");
  if (vfScene && scenes.length) {
    const total = String(scenes.length).padStart(2, "0");
    const sceneIndex = new Map();
    scenes.forEach((s, i) => sceneIndex.set(s, i + 1));
    const sceneObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const n = String(sceneIndex.get(e.target)).padStart(2, "0");
            vfScene.textContent = `SCN ${n}/${total}`;
          }
        });
      },
      { threshold: 0.5 }
    );
    scenes.forEach((s) => sceneObs.observe(s));
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            // small stagger for siblings entering together
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => entry.target.classList.add("in"), delay);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    // apply a gentle stagger to grouped cards
    document.querySelectorAll(".cards-grid, .work-grid, .pricing-grid, .hero, .hero-actions")
      .forEach((group) => {
        group.querySelectorAll(":scope > .reveal").forEach((el, i) => {
          el.dataset.delay = i * 90;
        });
      });

    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Mobile menu ---------- */
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("mobileMenu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        menu.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ---------- Showreel play (placeholder) ---------- */
  const reelFrame = document.getElementById("reelFrame");
  if (reelFrame) {
    reelFrame.addEventListener("click", () => {
      // Hook up the real video here, e.g. swap in a YouTube/Vimeo iframe or <video>.
      const label = reelFrame.querySelector(".reel-label");
      if (label) label.textContent = "[ Add your showreel — replace in script.js ]";
      reelFrame.animate(
        [{ transform: "scale(1)" }, { transform: "scale(0.99)" }, { transform: "scale(1)" }],
        { duration: 260, easing: "ease-out" }
      );
    });
  }

  /* ---------- Animated REC timecode ---------- */
  const recTime = document.getElementById("recTime");
  if (recTime) {
    let frames = 14 * 60 + 8; // start 00:14:08
    setInterval(() => {
      frames++;
      const m = String(Math.floor(frames / 60) % 60).padStart(2, "0");
      const s = String(frames % 60).padStart(2, "0");
      const f = String(Math.floor(Math.random() * 24)).padStart(2, "0");
      recTime.textContent = `${m}:${s}:${f}`;
    }, 1000);
  }

  /* ---------- Contact form (front-end demo) ---------- */
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const type = form.type.value;
      if (!name || !email || !type) {
        status.textContent = "Please fill in your name, email and project type.";
        status.style.color = "#ff6b5e";
        return;
      }
      status.style.color = "var(--accent)";
      status.textContent = "Thanks — your inquiry is ready to send.";
      // NOTE: wire this to a backend / form service (Formspree, Netlify Forms,
      // your own endpoint) to actually deliver the message.
      form.reset();
    });
  }

  /* ---------- Checkout page product loader ---------- */
  const checkoutForm = document.getElementById("checkoutForm");
  const checkoutProducts = {
    "photo-mini": {
      category: "Photo",
      title: "Mini Session",
      price: "$150+",
      desc: "A fast, clean photo session for portraits, announcements, profile images or a small creative update.",
      includes: ["30-minute shoot, one location", "15 edited, high-res images", "Private online gallery", "Personal-use licensing"]
    },
    "photo-portrait": {
      category: "Photo",
      title: "Portrait Session",
      price: "$300+",
      desc: "The most flexible photo option for portraits, couples, seniors, creators or a stronger personal brand set.",
      includes: ["Up to 2 hours, multiple looks", "50+ edited, high-res images", "Online gallery + print store", "48-hour preview turnaround"]
    },
    "photo-event": {
      category: "Photo",
      title: "Event / Half-Day",
      price: "$750+",
      desc: "Coverage for small events, brand moments or half-day sessions where you need a deeper gallery.",
      includes: ["Up to 4 hours of coverage", "150+ edited images", "Web and print licensing", "Sneak-peek gallery next day"]
    },
    "video-social": {
      category: "Video",
      title: "Social Clip",
      price: "$400+",
      desc: "A short vertical video built for Reels, TikTok, Shorts or quick social promotion.",
      includes: ["One vertical short-form edit", "Up to 1 hour of shooting", "Licensed music and captions", "One round of revisions"]
    },
    "video-brand": {
      category: "Video",
      title: "Brand / Promo Film",
      price: "$1,200+",
      desc: "A polished cinematic video for a business, event, product, service or personal brand.",
      includes: ["Up to a half-day shoot", "60-90 second edited film", "Licensed music and color grade", "Two social cut-downs included"]
    },
    "video-event": {
      category: "Video",
      title: "Event / Wedding Film",
      price: "$2,500+",
      desc: "A full cinematic coverage package for important moments that deserve a real highlight film.",
      includes: ["Full-day cinematic coverage", "3-5 minute highlight film", "Teaser cut for socials", "Second shooter optional"]
    },
    "web-landing": {
      category: "Webpage Building",
      title: "Landing Page",
      price: "$600+",
      desc: "A focused one-page website that introduces the offer, shows the work and gets people to contact you.",
      includes: ["Single, mobile-ready page", "Contact / inquiry form", "Photos and video embedded", "Launch and handoff"]
    },
    "web-multi": {
      category: "Webpage Building",
      title: "Multi-Page Site",
      price: "$1,500+",
      desc: "A stronger website structure for businesses that need multiple pages, galleries or booking paths.",
      includes: ["Up to 5 pages", "Easy-to-edit content", "Basic SEO and analytics", "Gallery and booking links"]
    },
    "web-premium": {
      category: "Webpage Building",
      title: "Premium / Animated",
      price: "$3,000+",
      desc: "A high-end animated website experience with motion, scroll effects and a more cinematic feel.",
      includes: ["Custom motion and scroll effects", "Premium visual direction", "Performance and mobile tuned", "Ongoing support available"]
    },
    "package-content-day": {
      category: "Package",
      title: "Content Day",
      price: "$900+",
      desc: "A concentrated shoot day made to create enough photo and video content for a month of posts.",
      includes: ["Photo + social video, one shoot", "30+ edited images", "2 short-form video edits", "Built for a month of posts"]
    },
    "package-brand-builder": {
      category: "Package",
      title: "Brand Builder",
      price: "$3,500+",
      desc: "A full launch package combining brand film, photo and a landing page to put the work to use.",
      includes: ["Brand film + photo set", "Landing page to launch it", "Social cut-downs included", "One studio, end to end"]
    },
    "package-full-frame": {
      category: "Package",
      title: "The Full Frame",
      price: "$6,000+",
      desc: "The complete studio package: film, photo and a website experience working together.",
      includes: ["Full film + full photo coverage", "Multi-page website build", "Highlight film + teaser + stills", "The complete package"]
    }
  };

  if (checkoutForm) {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("item") || "package-brand-builder";
    const product = checkoutProducts[key] || checkoutProducts["package-brand-builder"];
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText("checkoutCategory", product.category);
    setText("checkoutTitle", product.title);
    setText("checkoutPrice", product.price);
    setText("checkoutDesc", product.desc);
    setText("checkoutTotal", product.price);

    const list = document.getElementById("checkoutIncludes");
    if (list) {
      list.innerHTML = product.includes.map((item) => `<li>${item}</li>`).join("");
    }

    const checkoutStatus = document.getElementById("checkoutStatus");
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = checkoutForm.clientName.value.trim();
      const email = checkoutForm.clientEmail.value.trim();
      if (!name || !email) {
        checkoutStatus.textContent = "Please add your name and email first.";
        checkoutStatus.style.color = "#ff6b5e";
        return;
      }
      checkoutStatus.style.color = "var(--accent)";
      checkoutStatus.textContent = `${product.title} is selected. Connect this button to Stripe or Square Checkout when you're ready.`;
    });
  }

  /* ---------- Footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
