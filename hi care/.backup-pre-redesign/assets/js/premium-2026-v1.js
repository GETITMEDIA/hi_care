/*!
 * HI-TECH AUTOZONE — Premium 2026 interaction layer
 * Vanilla, dependency-free. Loaded after script.js.
 *
 *  1. Reveal engine (IntersectionObserver, replaces AOS)
 *  2. Sticky header: no-jump spacer + scroll state
 *  3. Active navigation state
 *  4. Hero: pointer parallax
 *  5. Testimonial carousel (replaces jQuery + Bootstrap 4 CDN)
 *  6. Image performance + accessibility pass
 *  7. Mobile menu polish
 */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var supportsIO = "IntersectionObserver" in window;
  var rafQueued = false;

  function onReady(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  /* ------------------------------------------------ 0. PRELOADER SAFETY NET */
  /* The template only dismisses the preloader on window.load, so one slow
     third-party asset could leave the whole site behind a dark screen. */
  function preloaderGuard() {
    var pre = document.getElementById("preloader");
    if (!pre) return;
    var done = false;
    function dismiss() {
      if (done) return;
      done = true;
      pre.classList.add("loaded");
    }
    window.addEventListener("load", dismiss);
    window.setTimeout(dismiss, 2200);
  }
  preloaderGuard();

  /* ------------------------------------------------ 1. REVEAL ENGINE */
  var AOS_MAP = {
    "fade-up": "up",
    "fade-down": "down",
    "fade-left": "left",
    "fade-right": "right",
    "fade-in": "fade",
    fade: "fade",
    "zoom-in": "scale",
    "zoom-out": "scale"
  };

  /* selector -> reveal kind, applied when the element has no data-aos of its own */
  var AUTO_REVEAL = [
    [".section__heading", "up"],
    [".categories__card--style3", "up"],
    [".section-block", "up"],
    [".experience-left", "right"],
    [".experience-right", "left"],
    [".discount__banner--thumbnail", "scale"],
    [".banner__items", "up"],
    [".blog__section--inner .blog__card", "up"],
    [".shipping__items", "up"],
    [".brand-item", "up"],
    [".breadcrumb__content", "up"],
    [".about__thumb--items", "up"],
    [".about__content", "left"],
    [".counterup__items", "up"],
    [".impl_choose_box", "up"],
    [".process-box", "up"],
    [".contact__section--heading", "up"],
    [".main__contact--area", "up"],
    [".contact__form--list", "up"],
    [".cart__section--inner", "up"],
    [".error__content", "up"],
    [".heading", "up"],
    [".brands-section > h2", "up"],
    [".brands-section > p", "up"]
  ];

  function markReveals() {
    /* re-use existing AOS attributes */
    Array.prototype.forEach.call(document.querySelectorAll("[data-aos]"), function (el) {
      var kind = AOS_MAP[el.getAttribute("data-aos")] || "up";
      el.setAttribute("data-reveal", kind);
      var delay = parseInt(el.getAttribute("data-aos-delay"), 10);
      if (delay > 0) el.style.setProperty("--p-reveal-delay", Math.min(delay, 400) + "ms");
    });

    AUTO_REVEAL.forEach(function (pair) {
      Array.prototype.forEach.call(document.querySelectorAll(pair[0]), function (el) {
        if (!el.hasAttribute("data-reveal")) el.setAttribute("data-reveal", pair[1]);
      });
    });

    /* product / service images get the clip-path image reveal */
    Array.prototype.forEach.call(document.querySelectorAll(".section-block .image, .image-wrapper"), function (el) {
      if (!el.hasAttribute("data-reveal")) el.setAttribute("data-reveal", "image");
    });

    /* stagger siblings inside a grid/row so cards cascade instead of popping */
    [
      ".categories__inner--style3",
      ".brands-logos",
      ".shipping__inner",
      ".counterup__banner--inner",
      ".process"
    ].forEach(function (sel) {
      Array.prototype.forEach.call(document.querySelectorAll(sel), function (group) {
        var items = group.querySelectorAll("[data-reveal]");
        for (var i = 0; i < items.length; i++) {
          if (!items[i].style.getPropertyValue("--p-reveal-delay")) {
            items[i].style.setProperty("--p-reveal-delay", Math.min(i * 55, 440) + "ms");
          }
        }
      });
    });
  }

  function startReveals() {
    var nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length) return;

    if (reduced || !supportsIO) {
      Array.prototype.forEach.call(nodes, function (el) { el.classList.add("is-revealed"); });
      return;
    }

    document.documentElement.classList.add("p-reveal-ready");

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    Array.prototype.forEach.call(nodes, function (el) {
      /* anything already on screen at load reveals immediately — no blank first paint */
      var box = el.getBoundingClientRect();
      if (box.top < window.innerHeight * 0.9 && box.bottom > 0) {
        el.classList.add("is-revealed");
      } else {
        io.observe(el);
      }
    });

    /* Safety net: an element sitting inside the observer's bottom margin on a
       page that is never scrolled would otherwise stay invisible. */
    window.setTimeout(function () {
      Array.prototype.forEach.call(document.querySelectorAll("[data-reveal]:not(.is-revealed)"), function (el) {
        var box = el.getBoundingClientRect();
        if (box.top < window.innerHeight && box.bottom > 0) {
          el.classList.add("is-revealed");
          io.unobserve(el);
        }
      });
    }, 1400);
  }

  /* ------------------------------------- 2. STICKY HEADER (no content jump) */
  function stickyHeader() {
    var bar = document.querySelector(".header__sticky");
    if (!bar) return;

    var spacer = document.createElement("div");
    spacer.className = "p-header-spacer";
    spacer.setAttribute("aria-hidden", "true");
    spacer.style.height = "0px";
    if (bar.parentNode) bar.parentNode.insertBefore(spacer, bar.nextSibling);

    function sync() {
      rafQueued = false;
      var isStuck = bar.classList.contains("sticky");
      spacer.style.height = isStuck ? bar.offsetHeight + "px" : "0px";
      document.documentElement.style.setProperty("--p-header-h", bar.offsetHeight + "px");
    }
    function queue() {
      if (rafQueued) return;
      rafQueued = true;
      window.requestAnimationFrame(sync);
    }

    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    queue();
  }

  /* ------------------------------------------- 3. ACTIVE NAVIGATION STATE */
  function activeNav() {
    var here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    var links = document.querySelectorAll(".header__menu--link, .header__sub--menu__link, .offcanvas__menu_item, .offcanvas__sub_menu_item");

    Array.prototype.forEach.call(links, function (link) {
      var href = (link.getAttribute("href") || "").split("/").pop().toLowerCase();
      if (!href || href.charAt(0) === "#" || href.indexOf("javascript:") === 0) return;
      if (href === here) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
        /* light up the parent item of an active sub-menu entry */
        var parentItem = link.closest(".header__menu--items, .offcanvas__menu_li");
        if (parentItem) {
          var top = parentItem.querySelector(".header__menu--link, .offcanvas__menu_item");
          if (top && top !== link) top.classList.add("active");
        }
      } else if (here !== "index.html" && href === "index.html") {
        link.classList.remove("active");
      }
    });
  }

  /* ----------------------------------------------- 4. HERO POINTER PARALLAX */
  function heroParallax() {
    var hero = document.querySelector(".hero__slider--section");
    if (!hero || reduced || window.matchMedia("(hover: none)").matches) return;

    var pending = false;
    var px = 0;
    var py = 0;

    function apply() {
      pending = false;
      Array.prototype.forEach.call(hero.querySelectorAll(".slider__layer--img"), function (img) {
        img.style.setProperty("--p-parallax-x", px.toFixed(2) + "px");
        img.style.setProperty("--p-parallax-y", py.toFixed(2) + "px");
      });
    }

    hero.addEventListener("mousemove", function (e) {
      var rect = hero.getBoundingClientRect();
      px = ((e.clientX - rect.left) / rect.width - 0.5) * -22;
      py = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
      if (!pending) { pending = true; window.requestAnimationFrame(apply); }
    }, { passive: true });

    hero.addEventListener("mouseleave", function () {
      px = 0; py = 0;
      if (!pending) { pending = true; window.requestAnimationFrame(apply); }
    });
  }

  /* --------------------------- 5. TESTIMONIAL CAROUSEL (vanilla, no jQuery) */
  function testimonialCarousel() {
    var root = document.getElementById("testimonial4");
    if (!root) return;

    var track = root.querySelector(".carousel-inner");
    if (!track) return;
    var items = Array.prototype.filter.call(track.children, function (el) {
      return el.classList.contains("carousel-item");
    });
    if (!items.length) return;

    root.classList.add("p-carousel");
    root.removeAttribute("data-ride");
    root.setAttribute("role", "region");
    root.setAttribute("aria-roledescription", "carousel");
    root.setAttribute("aria-label", "Customer testimonials");

    var index = Math.max(0, items.findIndex(function (el) { return el.classList.contains("active"); }));
    var timer = null;
    var interval = parseInt(root.getAttribute("data-interval"), 10) || 5000;

    /* dots */
    var dots = null;
    if (items.length > 1) {
      dots = document.createElement("div");
      dots.className = "p-dots";
      dots.setAttribute("role", "tablist");
      items.forEach(function (_, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Show testimonial " + (i + 1));
        b.addEventListener("click", function () { go(i, true); });
        dots.appendChild(b);
      });
      root.appendChild(dots);
    }

    function go(next, userDriven) {
      index = (next + items.length) % items.length;
      items.forEach(function (el, i) {
        el.classList.toggle("p-active", i === index);
        el.classList.toggle("active", i === index);
        el.setAttribute("aria-hidden", i === index ? "false" : "true");
      });
      if (dots) {
        Array.prototype.forEach.call(dots.children, function (b, i) {
          b.setAttribute("aria-current", i === index ? "true" : "false");
        });
      }
      if (userDriven) restart();
    }

    function start() {
      if (items.length < 2 || reduced || timer) return;
      timer = window.setInterval(function () { go(index + 1); }, interval);
    }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    /* arrows (the markup uses Bootstrap 4 data-slide attributes) */
    Array.prototype.forEach.call(root.querySelectorAll("[data-slide]"), function (ctrl) {
      var dir = ctrl.getAttribute("data-slide") === "prev" ? -1 : 1;
      ctrl.setAttribute("role", "button");
      ctrl.setAttribute("aria-label", dir < 0 ? "Previous testimonial" : "Next testimonial");
      ctrl.addEventListener("click", function (e) {
        e.preventDefault();
        go(index + dir, true);
      });
    });

    /* pause while hovered or off-screen; swipe on touch */
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);

    var startX = null;
    root.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; stop(); }, { passive: true });
    root.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1), true);
      startX = null;
      start();
    }, { passive: true });

    if (supportsIO) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { en.isIntersecting ? start() : stop(); });
      }, { threshold: 0.2 }).observe(root);
    } else {
      start();
    }

    go(index);
  }

  /* ------------------------------- 6. IMAGE PERFORMANCE + ACCESSIBILITY PASS */
  function mediaPass() {
    var fold = window.innerHeight * 1.25;

    Array.prototype.forEach.call(document.querySelectorAll("img"), function (img) {
      var inHero = img.closest(".hero__slider--section, .main__header, .offcanvas__header, .breadcrumb__section");
      var box = img.getBoundingClientRect();

      if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");

      if (inHero || box.top < fold) {
        if (!img.hasAttribute("loading")) img.setAttribute("loading", "eager");
      } else if (!img.hasAttribute("loading")) {
        img.setAttribute("loading", "lazy");
      }

      /* decorative or unlabelled images get a usable alt */
      if (!img.hasAttribute("alt") || img.getAttribute("alt") === null) {
        var slide = img.closest(".testimonial4_slide");
        var name = slide && slide.querySelector("h4");
        img.setAttribute("alt", name ? name.textContent.trim() : "");
      }
    });

    /* buttons that only contain an icon need a label */
    Array.prototype.forEach.call(document.querySelectorAll("button:not([aria-label])"), function (btn) {
      if (btn.textContent.trim() === "" && !btn.querySelector(".visually-hidden")) {
        if (btn.classList.contains("footer__widget--button")) btn.setAttribute("aria-label", "Toggle footer section");
        else if (btn.classList.contains("offcanvas__sub_menu_toggle")) btn.setAttribute("aria-label", "Toggle sub menu");
      }
    });
    var toTop = document.getElementById("scroll__top");
    if (toTop && !toTop.getAttribute("aria-label")) toTop.setAttribute("aria-label", "Back to top");
  }

  /* ------------------------------------------- 6b. INERT CONTROLS CLEANUP */
  /* The template left a search trigger on pages that carry no search panel.
     A control that cannot do anything is removed from the tab order. */
  function inertControls() {
    if (document.querySelector(".predictive__search--box")) return;
    Array.prototype.forEach.call(document.querySelectorAll(".search__open--btn"), function (btn) {
      var item = btn.closest(".header__account--search__items") || btn;
      item.classList.add("p-is-inert");
      item.setAttribute("aria-hidden", "true");
      btn.setAttribute("tabindex", "-1");
    });
  }

  /* -------------------------------------------------- 7. MOBILE MENU POLISH */
  function mobileMenu() {
    var panel = document.querySelector(".offcanvas__header");
    if (!panel) return;

    /* close on Escape, and on any navigation tap inside the panel */
    document.addEventListener("keyup", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) {
        panel.classList.remove("open");
        document.body.classList.remove("mobile_menu_open");
      }
    });
    panel.addEventListener("click", function (e) {
      var link = e.target.closest("a[href]");
      if (!link) return;
      var href = link.getAttribute("href") || "";
      if (href && href !== "" && href.indexOf("javascript:") !== 0) {
        panel.classList.remove("open");
        document.body.classList.remove("mobile_menu_open");
      }
    });
  }

  /* --------------------------------------------------------------- BOOTSTRAP */
  onReady(function () {
    markReveals();
    startReveals();
    stickyHeader();
    activeNav();
    heroParallax();
    testimonialCarousel();
    mediaPass();
    inertControls();
    mobileMenu();
  });
})();
