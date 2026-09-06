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

    // 2. SCROLL REVEAL OBSERVER (Split text, blur-in, card reveals)
    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });

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
  });
})();
