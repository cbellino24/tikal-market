(function () {
  "use strict";

  var header = document.getElementById("site-header");
  var mobileToggle = document.querySelector(".mobile-toggle");
  var mobileMenu = document.getElementById("mobile-menu");

  function setMenuOpen(open) {
    if (!mobileToggle || !mobileMenu) return;
    mobileMenu.classList.toggle("is-open", open);
    mobileToggle.classList.toggle("is-open", open);
    mobileToggle.setAttribute("aria-expanded", String(open));
    mobileToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    document.body.classList.toggle("nav-open", open);
  }

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener("click", function () {
      setMenuOpen(!mobileMenu.classList.contains("is-open"));
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenuOpen(false);
    });

    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        setMenuOpen(false);
      });
    });
  }

  // Header: transparent over hero, solid after scroll.
  if (header) {
    var lastSolid = false;
    function updateHeader() {
      var solid = window.scrollY > 12;
      if (solid === lastSolid) return;
      lastSolid = solid;
      header.classList.toggle("is-solid", solid);
    }
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  // Simple slideshow rotation (future-proof).
  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
  var currentSlide = 0;
  if (slides.length > 1) {
    window.setInterval(function () {
      slides[currentSlide].classList.remove("active");
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add("active");
    }, 5000);
  }

  // Locations / About: four store photos, flash-in crossfade.
  var locSlides = Array.prototype.slice.call(document.querySelectorAll(".loc-hero-bg .loc-hero-slide"));
  var locSlideIdx = 0;
  var locMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (locSlides.length > 1 && !locMotion.matches) {
    window.setInterval(function () {
      locSlides[locSlideIdx].classList.remove("is-active");
      locSlideIdx = (locSlideIdx + 1) % locSlides.length;
      locSlides[locSlideIdx].classList.add("is-active");
    }, 6500);
  }

  // (Products hero now uses the shared `.hero-slideshow` rotation.)

  // Deals carousel: prev/next + keyboard when focused.
  var dealsCarousel = document.getElementById("deals-carousel");
  var dealsPrev = document.querySelector(".deals-nav-prev");
  var dealsNext = document.querySelector(".deals-nav-next");
  var dealsLoopWidth = 0;

  function dealsScrollStep() {
    if (!dealsCarousel) return 320;
    var track = dealsCarousel.querySelector(".deals-track");
    var card = dealsCarousel.querySelector(".deal-card");
    if (!track || !card) return 320;
    var gap = parseFloat(getComputedStyle(track).gap);
    if (Number.isNaN(gap)) gap = 22;
    return Math.round(card.getBoundingClientRect().width + gap);
  }

  function dealsScrollBy(direction) {
    if (!dealsCarousel) return;
    var delta = dealsScrollStep() * direction;
    dealsCarousel.scrollBy({ left: delta, behavior: "smooth" });
  }

  function maybeWrapDealsLoop() {
    if (!dealsCarousel || !dealsLoopWidth) return;
    var left = dealsCarousel.scrollLeft;
    // Seamless wrap: keep scrollLeft within [0, dealsLoopWidth)
    if (left >= dealsLoopWidth) {
      dealsCarousel.scrollLeft = left - dealsLoopWidth;
    } else if (left < 0) {
      dealsCarousel.scrollLeft = left + dealsLoopWidth;
    }
  }

  function syncDealsNav() {
    if (!dealsCarousel || !dealsPrev || !dealsNext) return;
    // When looping, keep nav always enabled.
    if (dealsLoopWidth) {
      dealsPrev.disabled = false;
      dealsNext.disabled = false;
      return;
    }
    var maxScroll = dealsCarousel.scrollWidth - dealsCarousel.clientWidth;
    var left = dealsCarousel.scrollLeft;
    var epsilon = 4;
    dealsPrev.disabled = left <= epsilon;
    dealsNext.disabled = left >= maxScroll - epsilon;
  }

  if (dealsCarousel && dealsPrev && dealsNext) {
    // Duplicate cards once to enable seamless looping.
    var dealsTrack = dealsCarousel.querySelector(".deals-track");
    if (dealsTrack) {
      var cards = Array.prototype.slice.call(dealsTrack.children);
      if (cards.length > 1) {
        dealsLoopWidth = dealsTrack.scrollWidth;
        cards.forEach(function (node) {
          dealsTrack.appendChild(node.cloneNode(true));
        });
      }
    }

    // Autoplay (slow) — pauses on interaction and wraps at end.
    var dealsAutoplayId = null;
    var dealsAutoplayPausedUntil = 0;

    function pauseDealsAutoplay(ms) {
      dealsAutoplayPausedUntil = Date.now() + ms;
    }

    function startDealsAutoplay() {
      if (dealsAutoplayId) return;
      dealsAutoplayId = window.setInterval(function () {
        if (!dealsCarousel) return;
        if (Date.now() < dealsAutoplayPausedUntil) return;

        dealsScrollBy(1);
      }, 6500);
    }

    function stopDealsAutoplay() {
      if (!dealsAutoplayId) return;
      window.clearInterval(dealsAutoplayId);
      dealsAutoplayId = null;
    }

    dealsPrev.addEventListener("click", function () {
      pauseDealsAutoplay(12000);
      dealsScrollBy(-1);
    });
    dealsNext.addEventListener("click", function () {
      pauseDealsAutoplay(12000);
      dealsScrollBy(1);
    });
    dealsCarousel.addEventListener("scroll", function () {
      maybeWrapDealsLoop();
      syncDealsNav();
    }, { passive: true });
    window.addEventListener("resize", syncDealsNav);
    dealsCarousel.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        pauseDealsAutoplay(12000);
        dealsScrollBy(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        pauseDealsAutoplay(12000);
        dealsScrollBy(1);
      }
    });

    // Pause when user is interacting with the carousel area.
    dealsCarousel.addEventListener("mouseenter", function () {
      pauseDealsAutoplay(600000);
    });
    dealsCarousel.addEventListener("mouseleave", function () {
      dealsAutoplayPausedUntil = 0;
    });
    dealsCarousel.addEventListener("focusin", function () {
      pauseDealsAutoplay(600000);
    });
    dealsCarousel.addEventListener("focusout", function () {
      dealsAutoplayPausedUntil = 0;
    });
    dealsCarousel.addEventListener("touchstart", function () {
      pauseDealsAutoplay(20000);
    }, { passive: true });

    syncDealsNav();
    startDealsAutoplay();
  }
})();
