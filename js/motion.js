/**
 * SK Baghel Tour & Travels — motion.js
 * Vanilla Motion Engine (<3KB)
 * Features: Scroll reveal, Split text, Spotlight tracker, Scrambler, Parallax, Counters
 * Strict WCAG 2.2 AA / prefers-reduced-motion safe
 */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Helper: DOM ready
  function onReady(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  onReady(function () {
    // 1. TEXT SPLITTER
    var splitEls = document.querySelectorAll('[data-split]');
    splitEls.forEach(function (el) {
      if (el.dataset.splitDone) return;
      var text = el.textContent.trim();
      var words = text.split(/\s+/);
      el.innerHTML = '';
      words.forEach(function (word, idx) {
        var container = document.createElement('span');
        container.className = 'reveal-text-container';
        var span = document.createElement('span');
        span.className = 'reveal-text-span';
        span.textContent = word + (idx < words.length - 1 ? '\u00A0' : '');
        span.style.transitionDelay = (idx * 40) + 'ms';
        container.appendChild(span);
        el.appendChild(container);
      });
      el.dataset.splitDone = 'true';
    });

    // CINEMATIC THEME SWITCHER (Functional in both normal and reduced-motion modes)
    function updateThemeUI(isDark) {
      var switches = document.querySelectorAll('.cinematic-theme-toggle');
      switches.forEach(function (btn) {
        btn.setAttribute('aria-checked', isDark ? 'true' : 'false');
        btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        if (isDark) {
          btn.classList.add('is-dark');
        } else {
          btn.classList.remove('is-dark');
        }
      });
    }

    function triggerParticles(button, isDark) {
      if (prefersReduced) return;
      var container = button.querySelector('.cinematic-particles');
      if (!container) {
        container = document.createElement('div');
        container.className = 'cinematic-particles';
        button.appendChild(container);
      }
      container.innerHTML = '';
      for (var i = 0; i < 3; i++) {
        var p = document.createElement('div');
        p.className = 'cinematic-particle ' + (isDark ? 'dark-glow' : 'light-glow');
        container.appendChild(p);
      }
      setTimeout(function () {
        if (container) container.innerHTML = '';
      }, 900);
    }

    function initCinematicThemeSwitcher() {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark' || document.documentElement.classList.contains('dark');
      updateThemeUI(isDark);

      document.querySelectorAll('.cinematic-theme-toggle').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var currentDark = document.documentElement.getAttribute('data-theme') === 'dark' || document.documentElement.classList.contains('dark');
          var newDark = !currentDark;

          document.documentElement.classList.add('theme-transitioning');
          if (newDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.documentElement.classList.add('dark');
            try { localStorage.setItem('skb-theme', 'dark'); } catch (err) { }
          } else {
            document.documentElement.removeAttribute('data-theme');
            document.documentElement.classList.remove('dark');
            try { localStorage.setItem('skb-theme', 'light'); } catch (err) { }
          }

          updateThemeUI(newDark);
          triggerParticles(btn, newDark);

          setTimeout(function () {
            document.documentElement.classList.remove('theme-transitioning');
          }, 350);
        });
      });
    }

    initCinematicThemeSwitcher();

    // SCROLL PROGRESS BAR
    var progressBar = document.getElementById('scroll-progress');
    if (progressBar && !prefersReduced) {
      var tickingProgress = false;
      function updateProgress() {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
        var docHeight = (document.documentElement.scrollHeight || 1) - window.innerHeight;
        var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = Math.min(100, Math.max(0, progress)) + '%';
        tickingProgress = false;
      }
      window.addEventListener('scroll', function () {
        if (!tickingProgress) {
          window.requestAnimationFrame(updateProgress);
          tickingProgress = true;
        }
      }, { passive: true });
      updateProgress();
    }

    // If reduced motion is preferred, mark everything visible immediately
    if (prefersReduced) {
      document.querySelectorAll('.split-text, .blur-in, [data-split], .contact-card, .reveal-on-scroll, .scroll-reveal').forEach(function (el) {
        el.classList.add('is-visible');
      });
      document.querySelectorAll('.timeline-item').forEach(function (el) {
        el.classList.add('is-active');
      });
      return;
    }

    // Enable smooth scroll reveal
    document.documentElement.classList.add('has-reveal');

    // 2. SCROLL REVEAL OBSERVER (Split text, blur-in, card reveals)
    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: '120px 0px 50px 0px', threshold: 0.02 });

      document.querySelectorAll('.split-text, .blur-in, [data-split], .contact-card, .reveal-on-scroll, .scroll-reveal').forEach(function (el) {
        revealObserver.observe(el);
      });

      // 3. STAT COUNTERS (Count up with ease-out)
      var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var counter = entry.target;
            var target = parseFloat(counter.getAttribute('data-count') || counter.textContent.replace(/[^\d.]/g, ''));
            var prefix = counter.getAttribute('data-prefix') || '';
            var suffix = counter.getAttribute('data-suffix') || '';
            var duration = 1400; // ms
            var startTime = null;

            function animateCount(timestamp) {
              if (!startTime) startTime = timestamp;
              var progress = Math.min((timestamp - startTime) / duration, 1);
              // Ease out cubic
              var easeProgress = 1 - Math.pow(1 - progress, 3);
              var current = Math.floor(easeProgress * target);
              counter.textContent = prefix + current.toLocaleString('en-IN') + suffix;
              if (progress < 1) {
                requestAnimationFrame(animateCount);
              } else {
                counter.textContent = prefix + target.toLocaleString('en-IN') + suffix;
              }
            }

            requestAnimationFrame(animateCount);
            counterObserver.unobserve(counter);
          }
        });
      }, { threshold: 0.3 });

      document.querySelectorAll('.stat-number[data-count]').forEach(function (el) {
        counterObserver.observe(el);
      });

      // 4. TIMELINE OBSERVER
      var timelineObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-active');
          }
        });
      }, { threshold: 0.4 });

      document.querySelectorAll('.timeline-item, [data-timeline]').forEach(function (el) {
        timelineObserver.observe(el);
      });
    }

    // 5. SPOTLIGHT CARD TRACKER (Hover capable only)
    if (window.matchMedia('(hover: hover)').matches) {
      document.querySelectorAll('.spotlight-card').forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
          var rect = card.getBoundingClientRect();
          card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
          card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
        });
      });
    }

    // 6. TEXT SCRAMBLE (Brand Wordmark on desktop hover & data-scramble)
    var charset = 'SKBAGHEL0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var scrambleEls = document.querySelectorAll('#brand, [data-scramble], .brand-copy strong');
    scrambleEls.forEach(function (el) {
      var original = el.textContent.trim();
      var interval = null;
      var trigger = el.closest('.brand') || el;

      trigger.addEventListener('mouseenter', function () {
        if (prefersReduced) return;
        var iteration = 0;
        clearInterval(interval);
        interval = setInterval(function () {
          el.textContent = original.split('').map(function (char, idx) {
            if (char === ' ') return ' ';
            if (idx < iteration) return original[idx];
            return charset[Math.floor(Math.random() * charset.length)];
          }).join('');

          if (iteration >= original.length) {
            clearInterval(interval);
            el.textContent = original;
          }
          iteration += 1 / 3;
        }, 30);
      });

      trigger.addEventListener('mouseleave', function () {
        clearInterval(interval);
        el.textContent = original;
      });
    });

    // 7. INTERACTIVE IMAGE ACCORDION
    document.querySelectorAll('.accordion-container').forEach(function (container) {
      var items = container.querySelectorAll('.accordion-item');
      items.forEach(function (item) {
        item.addEventListener('mouseenter', function () {
          items.forEach(function (i) { i.classList.remove('active'); });
          item.classList.add('active');
        });
        item.addEventListener('focus', function () {
          items.forEach(function (i) { i.classList.remove('active'); });
          item.classList.add('active');
        });
      });
    });

    // 8. LUXURY IMAGE SCROLL PARALLAX ENGINE (Hero + Cards + Tours + Highlights)
    if (!prefersReduced) {
      var heroMedia = document.querySelector('.hero-media');
      var contentImages = document.querySelectorAll(
        '.vehicle-photo img, .package-photo img, .split > img, figure.portrait img, .zoom-parallax-img, [data-parallax]'
      );

      contentImages.forEach(function (img) {
        img.classList.add('img-alive-trigger');
      });

      var activeImages = [];

      if ('IntersectionObserver' in window) {
        var parallaxObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            var img = entry.target;
            var idx = activeImages.indexOf(img);
            if (entry.isIntersecting) {
              img.classList.add('is-alive');
              if (idx === -1) activeImages.push(img);
            } else {
              if (idx !== -1) activeImages.splice(idx, 1);
            }
          });
        }, { rootMargin: '120px 0px 120px 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });

        contentImages.forEach(function (img) {
          parallaxObserver.observe(img);
        });
      } else {
        activeImages = Array.prototype.slice.call(contentImages);
        contentImages.forEach(function (img) { img.classList.add('is-alive'); });
      }

      var isParallaxTicking = false;
      function updateParallax() {
        var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        var winH = window.innerHeight || document.documentElement.clientHeight;

        // Hero highway smooth depth parallax
        if (heroMedia && scrollY < winH * 1.3) {
          var heroShift = scrollY * 0.32;
          heroMedia.style.transform = 'translate3d(0, ' + heroShift.toFixed(1) + 'px, 0) scale(1.05)';
        }

        // Active content photos scroll parallax
        for (var i = 0; i < activeImages.length; i++) {
          var img = activeImages[i];
          var rect = img.getBoundingClientRect();
          var centerOffset = (rect.top + rect.height / 2 - winH / 2) / (winH / 2);
          if (centerOffset >= -1.8 && centerOffset <= 1.8) {
            var shift = Math.max(-28, Math.min(28, centerOffset * -24));
            img.style.setProperty('--parallax-y', shift.toFixed(1) + 'px');
            img.style.transform = 'translate3d(0, ' + shift.toFixed(1) + 'px, 0) scale(1.08)';
          }
        }
        isParallaxTicking = false;
      }

      window.addEventListener('scroll', function () {
        if (!isParallaxTicking) {
          window.requestAnimationFrame(updateParallax);
          isParallaxTicking = true;
        }
      }, { passive: true });

      // Trigger initial layout calculation
      window.requestAnimationFrame(updateParallax);
    }

    // 9. FAQ ACCORDION INTERACTION ENHANCER
    document.querySelectorAll('.faq-trigger').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq-item');
        if (!item) return;
        var isOpen = item.classList.contains('is-open');
        // Close siblings if in accordion
        var parent = item.parentElement;
        if (parent && parent.classList.contains('faq-accordion')) {
          parent.querySelectorAll('.faq-item').forEach(function (sibling) {
            if (sibling !== item) {
              sibling.classList.remove('is-open');
              var trig = sibling.querySelector('.faq-trigger');
              if (trig) trig.setAttribute('aria-expanded', 'false');
            }
          });
        }
        item.classList.toggle('is-open', !isOpen);
        btn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
      });
    });

    // 10. FORM INTERACTION & FEEDBACK
    var contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', function (e) {
        var name = contactForm.querySelector('[name="name"]');
        var phone = contactForm.querySelector('[name="phone"]');
        var msg = contactForm.querySelector('[name="message"]');

        var hasError = false;
        [name, phone, msg].forEach(function (inp) {
          if (inp && !inp.value.trim()) {
            inp.classList.add('input-error');
            hasError = true;
            setTimeout(function () { inp.classList.remove('input-error'); }, 400);
          }
        });

        if (hasError) return;

        var isHi = document.documentElement.lang && document.documentElement.lang.startsWith('hi');
        var successMsg = isHi
          ? 'धन्यवाद! आपकी पूछताछ प्राप्त हो गई है। हमारी 24×7 टीम शीघ्र संपर्क करेगी।'
          : 'Thank you! Your inquiry has been received. Our 24×7 dispatch team will contact you shortly.';

        var toast = document.getElementById('toast');
        if (toast) {
          toast.textContent = successMsg;
          toast.classList.add('show');
          setTimeout(function () { toast.classList.remove('show'); }, 4500);
        } else {
          alert(successMsg);
        }
      });
    }

    // 11. HERO ASYMMETRIC LIVING BENTO GRID (Independent Staggered Transitions)
    function initHeroBentoGrid() {
      var grid = document.getElementById('hero-bento-grid');
      if (!grid) return;

      var tiles = grid.querySelectorAll('.bento-tile');
      if (!tiles.length) return;

      var badge = document.getElementById('hero-location-badge');
      var badgeText = badge ? badge.querySelector('.hero-location-text') : null;

      // Honor prefers-reduced-motion
      if (prefersReduced) return;

      var isPaused = false;
      var tileIntervals = [];

      tiles.forEach(function (tile, tileIdx) {
        var slides = tile.querySelectorAll('.bento-slide');
        if (slides.length <= 1) return;

        var currentIndex = 0;
        var intervalTime = 8000; // 8.0s per landmark per tile
        var offset = tileIdx * 2600; // Staggered transition offsets (0s, 2.6s, 5.2s)

        function advanceSlide() {
          if (isPaused) return;
          slides[currentIndex].classList.remove('is-active');
          currentIndex = (currentIndex + 1) % slides.length;
          slides[currentIndex].classList.add('is-active');

          // If main stage tile changes, update the prominent location badge smoothly
          if (tileIdx === 0 && badge && badgeText) {
            var caption = slides[currentIndex].getAttribute('data-caption');
            if (caption) {
              badge.classList.add('is-updating');
              setTimeout(function () {
                badgeText.textContent = caption;
                badge.classList.remove('is-updating');
              }, 260);
            }
          }
        }

        var launchTimer = setTimeout(function () {
          advanceSlide();
          var loopTimer = setInterval(advanceSlide, intervalTime);
          tileIntervals.push(loopTimer);
        }, offset);
        tileIntervals.push(launchTimer);
      });

      // Pause when browser tab is inactive
      document.addEventListener('visibilitychange', function () {
        isPaused = document.hidden;
      });

      // Pause when scrolled out of viewport
      if ('IntersectionObserver' in window) {
        var bentoObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            isPaused = !entry.isIntersecting;
          });
        }, { threshold: 0.05 });
        bentoObserver.observe(grid.parentElement || grid);
      }
    }

    // 12. HERO BACKGROUND SLIDESHOW (Fallback for legacy single slideshow)
    function initHeroSlideshow() {
      var slideshow = document.getElementById('hero-slideshow');
      if (!slideshow) return;

      var slides = slideshow.querySelectorAll('.hero-slide');
      if (slides.length <= 1) return;

      var badge = document.getElementById('hero-location-badge');
      var badgeText = badge ? badge.querySelector('.hero-location-text') : null;
      var dots = document.querySelectorAll('.hero-slide-dot');

      var currentIndex = 0;
      var timer = null;
      var intervalTime = 8000; // 8.0s per landmark (gentle, unhurried pace)
      var isPaused = false;

      // Honor prefers-reduced-motion
      if (prefersReduced) return;

      function goToSlide(index) {
        if (index === currentIndex) return;
        slides[currentIndex].classList.remove('is-active');
        if (dots[currentIndex]) dots[currentIndex].classList.remove('is-active');

        currentIndex = (index + slides.length) % slides.length;

        slides[currentIndex].classList.add('is-active');
        if (dots[currentIndex]) dots[currentIndex].classList.add('is-active');

        if (badge && badgeText) {
          var caption = slides[currentIndex].getAttribute('data-caption');
          if (caption) {
            badge.classList.add('is-updating');
            setTimeout(function () {
              badgeText.textContent = caption;
              badge.classList.remove('is-updating');
            }, 260);
          }
        }
      }

      function nextSlide() {
        goToSlide(currentIndex + 1);
      }

      function startTimer() {
        stopTimer();
        if (!isPaused) {
          timer = setInterval(nextSlide, intervalTime);
        }
      }

      function stopTimer() {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      }

      // Interactive dot clicks
      dots.forEach(function (dot, idx) {
        dot.addEventListener('click', function () {
          goToSlide(idx);
          startTimer();
        });
      });

      // Pause when browser tab is inactive
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          isPaused = true;
          stopTimer();
        } else {
          isPaused = false;
          startTimer();
        }
      });

      // Pause when scrolled out of viewport
      if ('IntersectionObserver' in window) {
        var heroObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              isPaused = false;
              startTimer();
            } else {
              isPaused = true;
              stopTimer();
            }
          });
        }, { threshold: 0.05 });
        heroObserver.observe(slideshow.parentElement || slideshow);
      } else {
        startTimer();
      }
    }

    // RADIAL QUICK DOCK (.about) TOUCH/CLICK HANDLER
    var aboutDock = document.querySelector('.about');
    if (aboutDock) {
      var dockTrigger = aboutDock.querySelector('.logo');
      if (dockTrigger) {
        dockTrigger.addEventListener('click', function (e) {
          e.preventDefault();
          aboutDock.classList.toggle('is-open');
        });
      }
      document.addEventListener('click', function (e) {
        if (!aboutDock.contains(e.target)) {
          aboutDock.classList.remove('is-open');
        }
      });
    }

    // 21st.dev INTERACTIVE GRID PATTERN ENGINE (All White & Light Background Sections)
    function setupInteractiveGridSection(section) {
      if (!section) return;

      var bg = section.querySelector(':scope > .interactive-grid-bg');
      if (!bg) {
        bg = document.createElement('div');
        bg.className = 'interactive-grid-bg';
        bg.setAttribute('aria-hidden', 'true');
        bg.innerHTML = '<div class="interactive-grid-lines"></div>' +
                       '<div class="interactive-grid-spotlight"></div>' +
                       '<canvas class="interactive-grid-canvas"></canvas>';
        section.insertBefore(bg, section.firstChild);
      }

      var canvas = bg.querySelector('.interactive-grid-canvas');
      if (!canvas) return;

      var ctx = canvas.getContext('2d');
      if (!ctx) return;

      var CELL_SIZE = 44;
      var activeCells = {};
      var animId = null;
      var isVisible = false;
      var dpr = window.devicePixelRatio || 1;
      var width = 0;
      var height = 0;

      function resize() {
        var rect = section.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      resize();
      window.addEventListener('resize', resize, { passive: true });

      function addCell(c, r, intensity) {
        if (c < 0 || r < 0) return;
        var key = c + '_' + r;
        var current = activeCells[key];
        if (!current || current.alpha < intensity) {
          activeCells[key] = { col: c, row: r, alpha: intensity };
        }
      }

      function onMouseMove(e) {
        var rect = section.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        // Set CSS spotlight coordinates on this section
        section.style.setProperty('--grid-mouse-x', x + 'px');
        section.style.setProperty('--grid-mouse-y', y + 'px');

        if (prefersReduced) return;

        var centerCol = Math.floor(x / CELL_SIZE);
        var centerRow = Math.floor(y / CELL_SIZE);

        addCell(centerCol, centerRow, 1.0);
        addCell(centerCol - 1, centerRow, 0.42);
        addCell(centerCol + 1, centerRow, 0.42);
        addCell(centerCol, centerRow - 1, 0.42);
        addCell(centerCol, centerRow + 1, 0.42);

        if (!animId && isVisible) {
          animId = requestAnimationFrame(render);
        }
      }

      function onMouseLeave() {
        section.style.removeProperty('--grid-mouse-x');
        section.style.removeProperty('--grid-mouse-y');
      }

      section.addEventListener('mousemove', onMouseMove, { passive: true });
      section.addEventListener('mouseleave', onMouseLeave, { passive: true });

      function render() {
        if (!isVisible) {
          animId = null;
          return;
        }

        var keys = Object.keys(activeCells);
        if (keys.length === 0) {
          ctx.clearRect(0, 0, width, height);
          animId = null;
          return;
        }

        ctx.clearRect(0, 0, width, height);

        var isDark = document.documentElement.getAttribute('data-theme') === 'dark' || document.documentElement.classList.contains('dark');
        var rgb = isDark ? '229, 160, 68' : '217, 148, 59';

        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          var cell = activeCells[key];
          var cx = cell.col * CELL_SIZE;
          var cy = cell.row * CELL_SIZE;

          // Inner subtle glow (light & refined)
          ctx.fillStyle = 'rgba(' + rgb + ',' + (cell.alpha * 0.10).toFixed(3) + ')';
          ctx.fillRect(cx + 1, cy + 1, CELL_SIZE - 2, CELL_SIZE - 2);

          // Glowing border
          ctx.strokeStyle = 'rgba(' + rgb + ',' + (cell.alpha * 0.30).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx + 0.5, cy + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);

          // Crisp intersection crosshairs
          ctx.fillStyle = 'rgba(' + rgb + ',' + (cell.alpha * 0.58).toFixed(3) + ')';
          ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
          ctx.fillRect(cx + CELL_SIZE - 1.5, cy - 1.5, 3, 3);
          ctx.fillRect(cx - 1.5, cy + CELL_SIZE - 1.5, 3, 3);
          ctx.fillRect(cx + CELL_SIZE - 1.5, cy + CELL_SIZE - 1.5, 3, 3);

          cell.alpha *= 0.92;
          if (cell.alpha < 0.015) {
            delete activeCells[key];
          }
        }

        animId = requestAnimationFrame(render);
      }

      // ResizeObserver to track layout changes (crucial for content-visibility: auto sections)
      if ('ResizeObserver' in window) {
        var ro = new ResizeObserver(function () {
          resize();
        });
        ro.observe(section);
      }

      if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              isVisible = true;
              resize();
              if (!animId && Object.keys(activeCells).length > 0) {
                animId = requestAnimationFrame(render);
              }
            } else {
              isVisible = false;
              if (animId) {
                cancelAnimationFrame(animId);
                animId = null;
              }
            }
          });
        }, { threshold: 0.02 });
        obs.observe(section);
      } else {
        isVisible = true;
      }
    }

    function initAllInteractiveGrids() {
      var selectors = [
        '.interactive-grid-section',
        '.section--paper',
        '.section--paper-lt',
        '.page-hero',
        '.book-layout'
      ];
      var sections = document.querySelectorAll(selectors.join(', '));
      sections.forEach(function (sec) {
        // Avoid nested initialization if a section is directly inside another grid section
        var parentGrid = sec.parentElement ? sec.parentElement.closest(selectors.join(', ')) : null;
        if (parentGrid && parentGrid !== sec) return;
        setupInteractiveGridSection(sec);
      });
    }

    // 3D COVERFLOW SIGHTSEEING & PACKAGES CAROUSEL
    function initCoverflowCarousel() {
      var container = document.getElementById('coverflow-carousel');
      if (!container) return;

      var frame = container.querySelector('.coverflow-frame');
      var cards = Array.prototype.slice.call(container.querySelectorAll('.coverflow-card'));
      var detailSlides = Array.prototype.slice.call(document.querySelectorAll('.coverflow-detail-slide'));
      var dots = Array.prototype.slice.call(container.querySelectorAll('.coverflow-dot'));
      var prevBtn = container.querySelector('.coverflow-nav--prev');
      var nextBtn = container.querySelector('.coverflow-nav--next');

      if (!cards.length) return;

      var count = cards.length;
      var pos = 0;
      var target = 0;
      var width = 0;
      var rafId = null;
      var drag = null;
      var selected = 0;

      var rotate = 44;
      var depth = 0.6;
      var falloff = 0.56;
      var fade = 0.12;
      var gap = 0.06;
      var loop = true;

      var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function indexAt(p) {
        return ((Math.round(p) % count) + count) % count;
      }

      function clamp(p) {
        return loop ? p : Math.max(0, Math.min(count - 1, p));
      }

      function updateActiveState(idx) {
        idx = ((idx % count) + count) % count;
        if (idx === selected) return;
        selected = idx;

        detailSlides.forEach(function (slide, sIdx) {
          if (sIdx === selected) {
            slide.classList.add('is-active');
          } else {
            slide.classList.remove('is-active');
          }
        });

        dots.forEach(function (dot, dIdx) {
          if (dIdx === selected) {
            dot.classList.add('is-active');
            dot.setAttribute('aria-current', 'true');
          } else {
            dot.classList.remove('is-active');
            dot.removeAttribute('aria-current');
          }
        });
      }

      function paint() {
        if (prefersReducedMotion) return;
        if (!width && cards[0]) {
          width = cards[0].offsetWidth;
        }
        if (!width) return;

        var pitch = width * (1 + gap);

        cards.forEach(function (card, index) {
          var offset = index - pos;
          if (loop) {
            offset = ((offset % count) + count) % count;
            if (offset > count / 2) offset -= count;
          }

          var distance = Math.abs(offset);
          var ramp = Math.pow(distance, falloff);
          var tilt = Math.min(rotate * ramp, 82) * (offset === 0 ? 0 : offset > 0 ? 1 : -1);

          card.style.transform = 'translateX(calc(-50% + ' + (offset * pitch) + 'px)) ' +
                                 'translateZ(' + (-depth * width * ramp) + 'px) ' +
                                 'rotateY(' + (-tilt) + 'deg)';

          var edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
          card.style.opacity = String(Math.max(0, 1 - fade * distance) * edge);
          card.style.zIndex = String(100 - Math.round(distance));

          if (distance < 0.35) {
            card.classList.add('is-center');
          } else {
            card.classList.remove('is-center');
          }
        });
      }

      function settle(t) {
        if (rafId !== null) cancelAnimationFrame(rafId);
        target = t;
        updateActiveState(indexAt(target));

        if (prefersReducedMotion) {
          pos = target;
          return;
        }

        function step() {
          var remaining = target - pos;
          if (Math.abs(remaining) < 0.0004) {
            pos = target;
            paint();
            rafId = null;
            return;
          }
          pos += remaining * 0.16;
          paint();
          rafId = requestAnimationFrame(step);
        }
        rafId = requestAnimationFrame(step);
      }

      function goTo(index) {
        var tgt = loop
          ? index + Math.round((target - index) / count) * count
          : index;
        settle(clamp(tgt));
      }

      function nudge(by) {
        settle(clamp(Math.round(target) + by));
      }

      // Pointer drag events
      if (frame && !prefersReducedMotion) {
        frame.addEventListener('pointerdown', function (e) {
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
          if (frame.setPointerCapture) {
            try { frame.setPointerCapture(e.pointerId); } catch (err) {}
          }
          target = pos;
          drag = {
            id: e.pointerId,
            x: e.clientX,
            pos: pos,
            v: 0,
            t: performance.now()
          };
        });

        frame.addEventListener('pointermove', function (e) {
          if (!drag || drag.id !== e.pointerId) return;
          var pitch = width * (1 + gap);
          if (!pitch) return;

          var now = performance.now();
          var prev = pos;
          pos = clamp(drag.pos - (e.clientX - drag.x) / pitch);
          drag.v = ((pos - prev) / Math.max(now - drag.t, 1)) * 1000;
          drag.t = now;

          var idx = indexAt(pos);
          updateActiveState(idx);
          paint();
        });

        var endDrag = function (e) {
          if (!drag || drag.id !== e.pointerId) return;
          var v = drag.v;
          drag = null;
          var carried = Math.max(-2, Math.min(2, v * 0.18));
          settle(clamp(Math.round(pos + carried)));
        };

        frame.addEventListener('pointerup', endDrag);
        frame.addEventListener('pointercancel', endDrag);

        // Keyboard navigation
        frame.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            nudge(-1);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            nudge(1);
          }
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', function (e) {
          e.preventDefault();
          nudge(-1);
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', function (e) {
          e.preventDefault();
          nudge(1);
        });
      }

      dots.forEach(function (dot, idx) {
        dot.addEventListener('click', function (e) {
          e.preventDefault();
          goTo(idx);
        });
      });

      cards.forEach(function (card, idx) {
        card.addEventListener('click', function (e) {
          if (Math.abs(indexAt(pos) - idx) > 0.05) {
            e.preventDefault();
            goTo(idx);
          }
        });
      });

      function measure() {
        if (cards[0]) {
          width = cards[0].offsetWidth;
          paint();
        }
      }

      measure();
      if ('ResizeObserver' in window && frame) {
        var ro = new ResizeObserver(measure);
        ro.observe(frame);
      } else {
        window.addEventListener('resize', measure);
      }
    }

    // INTERNATIONAL CURRENCY ESTIMATOR (INR / USD / EUR / GBP)
    function initCurrencyEstimator() {
      var bars = document.querySelectorAll('.currency-estimator-bar');
      if (!bars.length) return;

      var RATES = {
        INR: { symbol: '₹', rate: 1 },
        USD: { symbol: '$', rate: 0.012 },
        EUR: { symbol: '€', rate: 0.011 },
        GBP: { symbol: '£', rate: 0.0095 }
      };

      bars.forEach(function (bar) {
        var pills = bar.querySelectorAll('.currency-pill');
        pills.forEach(function (pill) {
          pill.addEventListener('click', function () {
            var curr = pill.getAttribute('data-currency');
            if (!RATES[curr]) return;

            pills.forEach(function (p) {
              p.classList.toggle('is-active', p === pill);
            });

            var targets = document.querySelectorAll('[data-inr-val]');
            targets.forEach(function (target) {
              var inrVal = parseFloat(target.getAttribute('data-inr-val'));
              if (isNaN(inrVal)) return;

              var config = RATES[curr];
              if (curr === 'INR') {
                target.textContent = '₹' + inrVal.toLocaleString('en-IN');
              } else {
                var converted = Math.round(inrVal * config.rate);
                target.textContent = config.symbol + converted.toLocaleString('en-US');
              }
            });
          });
        });
      });
    }

    initHeroBentoGrid();
    initHeroSlideshow();
    initAllInteractiveGrids();
    initCoverflowCarousel();
    initCurrencyEstimator();
  });
})();
