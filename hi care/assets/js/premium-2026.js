/*!
 * HI-TECH AUTOZONE — "Midnight Performance" interaction layer · 2026
 * Vanilla JS, no dependencies beyond the Swiper bundle the site already ships.
 * Loaded (deferred) after script.js.
 *
 *  00 Preloader safety net         08 Spotlight, tilt + magnetic buttons
 *  01 Headline word split          09 Stacking showcase deck
 *  02 Reveal engine                10 Scroll engine (progress, parallax, zoom)
 *  03 Sticky header                11 Counters
 *  04 Active navigation            12 Testimonial carousel
 *  05 Hero: cinematic slider + HUD 13 Media + accessibility pass
 *  06 Marquees                     14 Drawer polish + inert controls
 *  07 Studio plates
 */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var supportsIO = "IntersectionObserver" in window;

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function onReady(fn) {
    if (doc.readyState !== "loading") fn();
    else doc.addEventListener("DOMContentLoaded", fn);
  }

  /* -------------------------------------------- 00 PRELOADER SAFETY NET */
  (function () {
    var pre = doc.getElementById("preloader");
    if (!pre) return;
    var done = false;
    function dismiss() { if (!done) { done = true; pre.classList.add("loaded"); } }
    window.addEventListener("load", dismiss);
    window.setTimeout(dismiss, 1800);
  })();

  /* ---------------------------------------------- 01 HEADLINE WORD SPLIT */
  /* Wraps every word in a mask so display headlines rise line by line.
     Text is untouched — only wrapped — and the heading keeps an aria-label. */
  var SPLIT = [
    ".section__heading--maintitle",
    ".experience-right h2",
    ".section-block .text h2",
    ".discount__banner--content__title",
    ".banner__content--style4__title",
    ".breadcrumb__content--title",
    ".brands-section > h2",
    ".sec-title h2",
    ".impl_choose_heading h3",
    ".contact__section--heading__maintitle",
    ".cart__title",
    ".error__content--title",
    ".testimonial .heading"
  ];

  function splitWords(el) {
    if (el.getAttribute("data-split")) return;
    el.setAttribute("data-split", "1");
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    var index = 0;

    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = doc.createDocumentFragment();
          parts.forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(" ")); return; }
            var outer = doc.createElement("span");
            outer.className = "p-w";
            outer.setAttribute("aria-hidden", "true");
            var inner = doc.createElement("span");
            inner.style.setProperty("--i", index++);
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR" && !child.classList.contains("p-w")) {
          walk(child);
        }
      });
    })(el);

    el.classList.add("p-words");
  }

  /* ---------------------------------------------------- 02 REVEAL ENGINE */
  var AOS_MAP = {
    "fade-up": "up", "fade-down": "down", "fade-left": "left", "fade-right": "right",
    "fade-in": "fade", fade: "fade", "zoom-in": "scale", "zoom-out": "scale",
    "zoom-in-right": "scale", "flip-left": "up", "flip-right": "up", "flip-up": "up", "flip-down": "up"
  };

  var AUTO_REVEAL = [
    [".slider__content .slider__desc", "fade"],
    [".section__heading .view__all--link", "fade"],
    [".categories__card--style3", "up"],
    [".experience-left", "scale"],
    [".experience-right .subheading", "up"],
    [".experience-right .description", "up"],
    [".section-block", "up"],
    [".discount__banner--thumbnail", "scale"],
    [".banner__items", "up"],
    [".testimonial .carousel", "blur"],
    [".blog__section--inner", "up"],
    [".shipping__items", "up"],
    [".brands-section > p", "up"],
    [".brand-item", "up"],
    [".breadcrumb__content--menu", "up"],
    [".about__thumb--items", "up"],
    [".about__content", "left"],
    [".counterup__items", "up"],
    [".impl_choose_text", "up"],
    [".impl_choose_img", "scale"],
    [".impl_choose_box", "up"],
    [".sec-title h6", "up"],
    [".process-box", "up"],
    [".contact__section--heading__desc", "up"],
    [".main__contact--area", "up"],
    [".cart__table", "up"],
    [".cart__summary", "up"],
    [".error__content--img", "scale"],
    [".error__content--desc", "up"],
    [".product__card", "up"],
    [".p-marquee", "fade"]
  ];

  var STAGGER = [
    ".categories__inner--style3",
    ".brands-logos",
    ".shipping__inner",
    ".counterup__banner--inner",
    ".process",
    ".row.spit",
    ".banner__section .row"
  ];

  var io = null;

  function markReveals() {
    $$("[data-aos]").forEach(function (el) {
      el.setAttribute("data-reveal", AOS_MAP[el.getAttribute("data-aos")] || "up");
      var d = parseInt(el.getAttribute("data-aos-delay"), 10);
      if (d > 0) el.style.setProperty("--p-reveal-delay", Math.min(d, 300) + "ms");
    });
    AUTO_REVEAL.forEach(function (pair) {
      $$(pair[0]).forEach(function (el) { if (!el.hasAttribute("data-reveal")) el.setAttribute("data-reveal", pair[1]); });
    });
    /* images inside showcase cards wipe open */
    $$(".section-block .image, .image-wrapper").forEach(function (el) {
      if (!el.hasAttribute("data-reveal")) el.setAttribute("data-reveal", "image");
    });
    STAGGER.forEach(function (sel) {
      $$(sel).forEach(function (group) {
        var items = $$(":scope > [data-reveal], :scope > * > [data-reveal]", group);
        items.forEach(function (el, i) {
          if (!el.style.getPropertyValue("--p-reveal-delay")) el.style.setProperty("--p-reveal-delay", Math.min(i * 70, 560) + "ms");
        });
      });
    });
    /* split headlines reveal as a unit */
    $$(".p-words").forEach(function (el) { el.setAttribute("data-reveal", "fade"); });
  }

  function reveal(el) { el.classList.add("is-revealed"); if (io) io.unobserve(el); }

  function startReveals() {
    var nodes = $$("[data-reveal]");
    if (!nodes.length) return;
    if (reduced || !supportsIO) { nodes.forEach(function (el) { el.classList.add("is-revealed"); }); return; }

    root.classList.add("p-reveal-ready");
    var isMobile = window.innerWidth <= 767;
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) reveal(e.target); });
    }, { rootMargin: isMobile ? "0px 0px -2% 0px" : "0px 0px -10% 0px", threshold: isMobile ? 0.03 : 0.06 });

    nodes.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * (isMobile ? 0.95 : 0.88) && r.bottom > 0) {
        /* next frame, so the entrance still plays on first paint */
        window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { reveal(el); }); });
      } else {
        io.observe(el);
      }
    });

    /* safety net for pages that cannot scroll far enough to trigger the margin */
    window.setTimeout(function () {
      $$("[data-reveal]:not(.is-revealed)").forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) reveal(el);
      });
    }, 1500);
  }

  /* ---------------------------------------------------- 03 STICKY HEADER */
  function stickyHeader() {
    var bar = $(".header__sticky");
    var section = $(".header__section");
    if (!bar || !section) return;

    var spacer = doc.createElement("div");
    spacer.className = "p-header-spacer";
    spacer.setAttribute("aria-hidden", "true");
    bar.parentNode.insertBefore(spacer, bar.nextSibling);

    var queued = false;
    function sync() {
      queued = false;
      /* an overlay header is out of flow, so it never needs a spacer */
      var overlay = getComputedStyle(section).position === "absolute";
      spacer.style.height = !overlay && bar.classList.contains("sticky") ? bar.offsetHeight + "px" : "0px";
    }
    function queue() { if (!queued) { queued = true; window.requestAnimationFrame(sync); } }
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    queue();
  }

  /* -------------------------------------------------- 04 ACTIVE NAVIGATION */
  function activeNav() {
    var here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    $$(".header__menu--link, .header__sub--menu__link, .offcanvas__menu_item, .offcanvas__sub_menu_item").forEach(function (link) {
      var href = (link.getAttribute("href") || "").split("/").pop().toLowerCase();
      if (!href || href.charAt(0) === "#" || href.indexOf("javascript:") === 0) return;
      if (href === here) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
        var parent = link.closest(".header__menu--items, .offcanvas__menu_li");
        var top = parent && parent.querySelector(".header__menu--link, .offcanvas__menu_item");
        if (top && top !== link) top.classList.add("active");
      } else if (href === "index.html" && here !== "index.html") {
        link.classList.remove("active");
      }
    });
  }

  /* --------------------------------------- 05 HERO: CINEMATIC SLIDER + HUD */
  function hero() {
    var section = $(".hero__slider--section");
    if (!section) return;
    var el = $(".hero__slider--activation", section);
    var count = $(".p-hero-current", section);
    var total = $(".p-hero-total", section);
    var bar = $(".p-hero-bar", section);
    var DELAY = 6500;

    var realSlides = $$(".swiper-slide:not(.swiper-slide-duplicate)", el).length;
    if (total) total.textContent = pad(realSlides);
    if (bar) bar.style.setProperty("--p-hero-delay", DELAY + "ms");

    function restartBar() {
      if (!bar || reduced) return;
      bar.classList.remove("is-running");
      void bar.offsetWidth;
      bar.classList.add("is-running");
    }

    if (el && window.Swiper) {
      if (el.swiper) el.swiper.destroy(true, true);
      var sw = new window.Swiper(el, {
        effect: "fade",
        fadeEffect: { crossFade: true },
        loop: true,
        speed: 1100,
        allowTouchMove: true,
        autoplay: reduced ? false : { delay: DELAY, disableOnInteraction: false },
        pagination: { el: $(".swiper-pagination", el), clickable: true },
        on: {
          init: function () { restartBar(); },
          slideChange: function (s) {
            if (count) count.textContent = pad(s.realIndex + 1);
            restartBar();
            syncThumbs(s.realIndex);
          }
        }
      });
      heroExtras(sw);
    }

    /* giant outline word behind the vehicle + product thumbnails as slide nav
       (both built from existing slide content, decorative / aria-hidden) */
    var thumbs = thumbs || [];
    function syncThumbs(i) {
      (thumbs || []).forEach(function (b, n) {
        b.classList.toggle("is-active", n === i);
        b.setAttribute("aria-current", n === i ? "true" : "false");
      });
    }
    function heroExtras(sw) {
      var accent = $(".swiper-slide:not(.swiper-slide-duplicate) .slider__maintitle .text__secondary", el);
      if (accent) {
        var big = doc.createElement("div");
        big.className = "p-hero-bigword";
        big.setAttribute("aria-hidden", "true");
        big.textContent = accent.textContent.trim();
        section.insertBefore(big, section.firstChild.nextSibling);
      }
      var imgs = $$(".swiper-slide:not(.swiper-slide-duplicate) .slider__layer--img", el);
      if (imgs.length > 1) {
        var bar = doc.createElement("div");
        bar.className = "p-hero-thumbs";
        imgs.forEach(function (img, i) {
          var b = doc.createElement("button");
          b.type = "button";
          b.className = "p-hero-thumb";
          b.setAttribute("aria-label", "Show slide " + (i + 1));
          b.style.setProperty("--p-hero-delay", DELAY + "ms");
          var im = doc.createElement("img");
          im.src = img.getAttribute("src");
          im.alt = "";
          b.appendChild(im);
          b.appendChild(doc.createElement("i"));
          b.addEventListener("click", function () { sw.slideToLoop(i); });
          bar.appendChild(b);
          (thumbs = thumbs || []).push(b);
        });
        var host = $(".p-hero-ui .container", section);
        (host || section).appendChild(bar);
        syncThumbs(sw.realIndex || 0);
      }
    }

    /* pointer parallax on the vehicle */
    if (!reduced && finePointer) {
      var px = 0, py = 0, pending = false;
      function apply() {
        pending = false;
        $$(".slider__layer--img", section).forEach(function (img) {
          img.style.setProperty("--p-parallax-x", px.toFixed(1) + "px");
          img.style.setProperty("--p-parallax-y", py.toFixed(1) + "px");
        });
      }
      section.addEventListener("mousemove", function (e) {
        var r = section.getBoundingClientRect();
        px = ((e.clientX - r.left) / r.width - 0.5) * -36;
        py = ((e.clientY - r.top) / r.height - 0.5) * -18;
        if (!pending) { pending = true; window.requestAnimationFrame(apply); }
      }, { passive: true });
      section.addEventListener("mouseleave", function () {
        px = py = 0;
        if (!pending) { pending = true; window.requestAnimationFrame(apply); }
      });
    }
  }

  /* --------------------------------------------------------- 06 MARQUEES */
  function buildTrack(items, make) {
    var track = doc.createElement("div");
    track.className = "p-marquee__track";
    items.forEach(function (it) { track.appendChild(make(it)); });
    return track;
  }

  function marquees() {
    /* word marquee from existing headings (decorative duplicate, hidden from AT) */
    $$(".p-marquee[data-marquee]").forEach(function (box) {
      var seen = {};
      var words = $$(box.getAttribute("data-marquee")).map(function (n) {
        return n.textContent.replace(/\s+/g, " ").trim();
      }).filter(function (t) {
        var k = t.toLowerCase();
        if (!t || seen[k]) return false;
        seen[k] = true;
        return true;
      });
      if (!words.length) { box.remove(); return; }
      box.setAttribute("aria-hidden", "true");
      function make(t) { var s = doc.createElement("span"); s.className = "p-marquee__item"; s.textContent = t; return s; }
      box.appendChild(buildTrack(words, make));
      box.appendChild(buildTrack(words, make));
      box.style.setProperty("--p-marquee-speed", Math.max(28, words.length * 5) + "s");
    });


  }

  /* --------------------------------------------------- 07 STUDIO PLATES */
  /* Transparent PNG product art is staged on a light plate instead of being
     cropped like a photograph. */
  function plates() {
    $$(".section-block .image img").forEach(function (img) {
      if (/\.png($|\?)/i.test(img.getAttribute("src") || "")) img.parentNode.classList.add("p-plate");
    });
  }

  /* ---------------------------------- 08 SPOTLIGHT, TILT + MAGNETIC BUTTONS */
  function pointerFx() {
    if (!finePointer || reduced) return;

    var SPOT = ".categories__card--link, .banner__items, .section-block, .blog__card, .impl_choose_box, .shipping__inner, .main__contact--area, .product__card";
    var TILT = ".categories__card--link, .banner__items";

    $$(SPOT).forEach(function (card) {
      card.classList.add("p-spot");
      var tilt = card.matches(TILT);
      var raf = 0, ev = null;
      function frame() {
        raf = 0;
        var r = card.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width;
        var y = (ev.clientY - r.top) / r.height;
        card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        if (tilt) {
          card.style.setProperty("--p-tilt-x", ((0.5 - y) * 7).toFixed(2) + "deg");
          card.style.setProperty("--p-tilt-y", ((x - 0.5) * 9).toFixed(2) + "deg");
        }
      }
      card.addEventListener("mousemove", function (e) { ev = e; if (!raf) raf = window.requestAnimationFrame(frame); }, { passive: true });
      card.addEventListener("mouseleave", function () {
        if (tilt) { card.style.setProperty("--p-tilt-x", "0deg"); card.style.setProperty("--p-tilt-y", "0deg"); }
      });
    });

    $$(".primary__btn").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        btn.style.setProperty("--p-mag-x", ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + "px");
        btn.style.setProperty("--p-mag-y", ((e.clientY - r.top - r.height / 2) * 0.32).toFixed(1) + "px");
      }, { passive: true });
      btn.addEventListener("mouseleave", function () {
        btn.style.setProperty("--p-mag-x", "0px");
        btn.style.setProperty("--p-mag-y", "0px");
      });
    });
  }

  /* --------------------------------------------- 09 STACKING SHOWCASE DECK */
  /* Cards pin and stack as you scroll — only when each one fits on screen,
     so no content is ever covered before it can be read. */
  var decks = [];

  function setupDecks() {
    var groups = [];
    $$(".section-block").forEach(function (card) {
      if (card.closest(".serv-top")) return; /* home twin panels sit side by side */
      var parent = card.parentElement;
      if (groups.indexOf(parent) === -1) groups.push(parent);
    });
    decks = groups.map(function (container) {
      return { el: container, cards: $$(":scope > .section-block", container), on: false };
    }).filter(function (d) { return d.cards.length > 1; });
    evaluateDecks();
    window.addEventListener("resize", evaluateDecks);
  }

  function evaluateDecks() {
    var allowed = !reduced && window.innerWidth >= 1200 && finePointer;
    decks.forEach(function (d) {
      d.el.classList.remove("p-stack");
      var fits = allowed && d.cards.every(function (c) { return c.offsetHeight < window.innerHeight - 170; });
      d.on = fits;
      d.cards.forEach(function (c, i) {
        c.style.setProperty("--p-stack-i", i);
        c.style.removeProperty("--p-stack-scale");
        c.style.removeProperty("--p-stack-dim");
      });
      if (fits) d.el.classList.add("p-stack");
    });
  }

  function updateDecks() {
    decks.forEach(function (d) {
      if (!d.on) return;
      for (var i = 0; i < d.cards.length - 1; i++) {
        var card = d.cards[i];
        var next = d.cards[i + 1].getBoundingClientRect();
        var cur = card.getBoundingClientRect();
        var p = clamp((cur.bottom - next.top) / cur.height, 0, 1);
        card.style.setProperty("--p-stack-scale", (1 - p * 0.06).toFixed(4));
        card.style.setProperty("--p-stack-dim", (1 - p * 0.45).toFixed(3));
      }
    });
  }

  /* ------------------------------------------------------ 10 SCROLL ENGINE */
  function scrollEngine() {
    var bar = doc.createElement("div");
    bar.className = "p-progress";
    bar.setAttribute("aria-hidden", "true");
    doc.body.appendChild(bar);

    var toTop = doc.getElementById("scroll__top");
    var heroInner = $(".hero__slider--inner");
    var zoomers = $$(".discount__banner--img__height");
    var crumbs = $$(".breadcrumb__section");
    var parallax = reduced ? [] : $$(".image-wrapper img, .about__thumb--img, .impl_choose_img img");
    var queued = false;

    function frame() {
      queued = false;
      var vh = window.innerHeight;
      var max = Math.max(1, root.scrollHeight - vh);
      var p = clamp(window.scrollY / max, 0, 1);
      root.style.setProperty("--p-progress", p.toFixed(4));
      if (toTop) toTop.style.setProperty("--p-progress", p.toFixed(4));

      if (reduced) return;

      /* hero content drifts up and fades as the page leaves it */
      if (heroInner) {
        var hs = clamp(window.scrollY / vh, 0, 1);
        heroInner.style.setProperty("--p-hs", hs.toFixed(3));
      }

      /* CTA image settles from 1.15 to 1 as it crosses the viewport */
      zoomers.forEach(function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var t = clamp(1 - (r.top + r.height) / (vh + r.height), 0, 1);
        img.style.setProperty("--p-zoom", (1.18 - t * 0.18).toFixed(4));
      });

      /* inner-page hero background drifts */
      crumbs.forEach(function (c) {
        var r = c.getBoundingClientRect();
        if (r.bottom < 0) return;
        c.style.backgroundPosition = "center " + (50 + clamp(-r.top / r.height, 0, 1) * 30).toFixed(1) + "%";
      });

      parallax.forEach(function (img) {
        var r = img.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var off = ((r.top + r.height / 2) - vh / 2) / vh;
        img.style.translate = "0 " + (off * -28).toFixed(1) + "px";
      });

      updateDecks();
    }
    function queue() { if (!queued) { queued = true; window.requestAnimationFrame(frame); } }
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    queue();
  }

  /* ----------------------------------------------------------- 11 COUNTERS */
  function counters() {
    var badges = $$(".experience-badge span, .hz-about__badge strong, .ab-stats li strong");
    if (!badges.length || reduced || !supportsIO) return;
    badges.forEach(function (badge) {
      var m = badge.textContent.trim().match(/^(\d+)(.*)$/);
      if (!m) return;
      var target = parseInt(m[1], 10), suffix = m[2], original = badge.textContent;
      var started = false;
      new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting || started) return;
        started = true;
        obs.disconnect();
        var t0 = performance.now(), dur = 1600;
        (function tick(now) {
          var k = clamp((now - t0) / dur, 0, 1);
          var eased = 1 - Math.pow(1 - k, 4);
          badge.textContent = Math.round(target * eased) + suffix;
          if (k < 1) window.requestAnimationFrame(tick); else badge.textContent = original;
        })(t0);
      }, { threshold: 0.5 }).observe(badge);
    });
  }

  /* --------------------------------------------- 12 TESTIMONIAL CAROUSEL */
  function testimonials() {
    var box = doc.getElementById("testimonial4");
    if (!box) return;
    var track = $(".carousel-inner", box);
    if (!track) return;
    var items = Array.prototype.filter.call(track.children, function (el) { return el.classList.contains("carousel-item"); });
    if (!items.length) return;

    box.classList.add("p-carousel");
    box.removeAttribute("data-ride");
    box.setAttribute("role", "region");
    box.setAttribute("aria-roledescription", "carousel");
    box.setAttribute("aria-label", "Customer testimonials");

    var index = Math.max(0, items.findIndex(function (el) { return el.classList.contains("active"); }));
    var timer = null;
    var interval = parseInt(box.getAttribute("data-interval"), 10) || 6000;
    var dots = null;

    if (items.length > 1) {
      dots = doc.createElement("div");
      dots.className = "p-dots";
      items.forEach(function (_, i) {
        var b = doc.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Show testimonial " + (i + 1));
        b.addEventListener("click", function () { go(i, true); });
        dots.appendChild(b);
      });
      box.appendChild(dots);
    }

    function go(n, user) {
      index = (n + items.length) % items.length;
      items.forEach(function (el, i) {
        var on = i === index;
        el.classList.toggle("p-active", on);
        el.classList.toggle("active", on);
        el.setAttribute("aria-hidden", on ? "false" : "true");
      });
      if (dots) $$("button", dots).forEach(function (b, i) { b.setAttribute("aria-current", i === index ? "true" : "false"); });
      if (user) { stop(); start(); }
    }
    function start() { if (items.length > 1 && !reduced && !timer) timer = window.setInterval(function () { go(index + 1); }, interval); }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }

    $$("[data-slide]", box).forEach(function (ctrl) {
      var dir = ctrl.getAttribute("data-slide") === "prev" ? -1 : 1;
      ctrl.setAttribute("role", "button");
      ctrl.setAttribute("aria-label", dir < 0 ? "Previous testimonial" : "Next testimonial");
      ctrl.addEventListener("click", function (e) { e.preventDefault(); go(index + dir, true); });
    });

    box.addEventListener("mouseenter", stop);
    box.addEventListener("mouseleave", start);
    box.addEventListener("focusin", stop);
    box.addEventListener("focusout", start);

    var sx = null;
    box.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; stop(); }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1), true);
      sx = null;
      start();
    }, { passive: true });

    if (supportsIO) {
      new IntersectionObserver(function (en) { en.forEach(function (x) { x.isIntersecting ? start() : stop(); }); }, { threshold: 0.2 }).observe(box);
    } else {
      start();
    }
    go(index);
  }

  /* ---------------------------------------- 13 MEDIA + ACCESSIBILITY PASS */
  function mediaPass() {
    var fold = window.innerHeight * 1.3;
    $$("img").forEach(function (img) {
      var top = img.closest(".hero__slider--section, .main__header, .offcanvas__header, .breadcrumb__section");
      if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
      if (!img.hasAttribute("loading")) img.setAttribute("loading", top || img.getBoundingClientRect().top < fold ? "eager" : "lazy");
      if (!img.hasAttribute("alt")) {
        var slide = img.closest(".testimonial4_slide");
        var name = slide && slide.querySelector("h4");
        img.setAttribute("alt", name ? name.textContent.trim() : "");
      }
    });
    $$("button:not([aria-label])").forEach(function (btn) {
      if (btn.textContent.trim() || btn.querySelector(".visually-hidden")) return;
      if (btn.classList.contains("footer__widget--button")) btn.setAttribute("aria-label", "Toggle footer section");
      else if (btn.classList.contains("offcanvas__sub_menu_toggle")) btn.setAttribute("aria-label", "Toggle sub menu");
    });
    var toTop = doc.getElementById("scroll__top");
    if (toTop && !toTop.getAttribute("aria-label")) toTop.setAttribute("aria-label", "Back to top");
  }

  /* ----------------------------------------- 14 DRAWER POLISH + INERT CONTROLS */
  function drawer() {
    var panel = $(".offcanvas__header");
    if (!panel) return;
    function close() { panel.classList.remove("open"); doc.body.classList.remove("mobile_menu_open"); }
    doc.addEventListener("keyup", function (e) { if (e.key === "Escape" && panel.classList.contains("open")) close(); });
    panel.addEventListener("click", function (e) {
      var link = e.target.closest("a[href]");
      var href = link && link.getAttribute("href");
      if (href && href.indexOf("javascript:") !== 0) close();
    });
  }

  function inertControls() {
    if ($(".predictive__search--box")) return;
    $$(".search__open--btn").forEach(function (btn) {
      var item = btn.closest(".header__account--search__items") || btn;
      item.classList.add("p-is-inert");
      item.setAttribute("aria-hidden", "true");
      btn.setAttribute("tabindex", "-1");
    });
  }

  function mobileHeader() {
    var accts = $$(".header__account");
    accts.forEach(function (acct) {
      if (acct.querySelector(".p-call-btn")) return;
      var wrapper = acct.querySelector(".header__account--wrapper");
      if (!wrapper) {
        wrapper = doc.createElement("ul");
        wrapper.className = "header__account--wrapper d-flex align-items-center";
        acct.appendChild(wrapper);
      }
      var li = doc.createElement("li");
      li.className = "header__account--items p-call-item";
      li.innerHTML = '<a class="header__account--btn p-call-btn" href="tel:+918072044811" aria-label="Call Hi-Tech Autozone" title="Call +91 80720 44811"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span class="visually-hidden">Call Us</span></a>';
      wrapper.appendChild(li);
    });
  }

  /* ------------------------------------------------------------- BOOT */
  onReady(function () {
    plates();
    marquees();
    SPLIT.forEach(function (sel) { $$(sel).forEach(splitWords); });
    markReveals();
    setupDecks();
    startReveals();
    stickyHeader();
    activeNav();
    hero();
    pointerFx();
    scrollEngine();
    counters();
    testimonials();
    mediaPass();
    inertControls();
    mobileHeader();
    drawer();
  });
})();
