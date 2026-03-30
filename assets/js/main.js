(function () {
  "use strict";

  function onReadyOrNow(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
      return;
    }

    callback();
  }

  function onLoadOrNow(callback) {
    if (document.readyState === 'complete') {
      callback();
      return;
    }

    window.addEventListener('load', callback, { once: true });
  }

  function whenAvailable(check, callback, maxAttempts = 50, interval = 100) {
    if (check()) {
      callback();
      return;
    }

    let attempts = 0;
    const timer = window.setInterval(() => {
      if (check()) {
        window.clearInterval(timer);
        callback();
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        window.clearInterval(timer);
      }
    }, interval);
  }

  /* Apply .scrolled class to the body as the page is scrolled down */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');

    // If there is no header yet (htmx not loaded or on pages without header), just skip.
    if (!selectBody || !selectHeader) {
      return;
    }

    // Only apply the effect for sticky/fixed headers.
    if (
      !selectHeader.classList.contains('scroll-up-sticky') &&
      !selectHeader.classList.contains('sticky-top') &&
      !selectHeader.classList.contains('fixed-top')
    ) {
      return;
    }

    if (window.scrollY > 100) {
      selectBody.classList.add('scrolled');
    } else {
      selectBody.classList.remove('scrolled');
    }
  }

  document.addEventListener('scroll', toggleScrolled);
  onLoadOrNow(toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  if (mobileNavToggleBtn) {
    mobileNavToggleBtn.addEventListener('click', mobileNavToogle);
  }

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function (e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Scroll top button
   */
  function bindScrollTop() {
    const btn = document.querySelector('.scroll-top');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';

    const toggle = () => {
      if (window.scrollY > 100) btn.classList.add('active');
      else btn.classList.remove('active');
    };

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
  }

  onReadyOrNow(bindScrollTop);
  onLoadOrNow(bindScrollTop);
  document.addEventListener('htmx:afterSwap', bindScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    if (typeof window.AOS === 'undefined') {
      return;
    }

    window.AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  onLoadOrNow(() => {
    whenAvailable(() => typeof window.AOS !== 'undefined', aosInit);
  });

  /**
   * Animate the skills items on reveal
   */
  function initSkillsAnimation() {
    if (typeof window.Waypoint === 'undefined') {
      return;
    }

    let skillsAnimation = document.querySelectorAll('.skills-animation');
    skillsAnimation.forEach((item) => {
      new Waypoint({
        element: item,
        offset: '80%',
        handler: function () {
          let progress = item.querySelectorAll('.progress .progress-bar');
          progress.forEach(el => {
            el.style.width = el.getAttribute('aria-valuenow') + '%';
          });
        }
      });
    });
  }
  onReadyOrNow(() => {
    whenAvailable(() => typeof window.Waypoint !== 'undefined', initSkillsAnimation);
  });


  /**
   * Init isotope layout and filters
   */
  function initIsotopeLayouts() {
    if (typeof window.imagesLoaded === 'undefined' || typeof window.Isotope === 'undefined') {
      return;
    }

    document.querySelectorAll('.isotope-layout').forEach(function (isotopeItem) {
      let layout = isotopeItem.getAttribute('data-layout') ?? 'masonry';
      let filter = isotopeItem.getAttribute('data-default-filter') ?? '*';
      let sort = isotopeItem.getAttribute('data-sort') ?? 'original-order';

      let initIsotope;
      imagesLoaded(isotopeItem.querySelector('.isotope-container'), function () {
        initIsotope = new Isotope(isotopeItem.querySelector('.isotope-container'), {
          itemSelector: '.isotope-item',
          layoutMode: layout,
          filter: filter,
          sortBy: sort
        });
      });

      isotopeItem.querySelectorAll('.isotope-filters li').forEach(function (filters) {
        filters.addEventListener('click', function () {
          isotopeItem.querySelector('.isotope-filters .filter-active').classList.remove('filter-active');
          this.classList.add('filter-active');
          initIsotope.arrange({
            filter: this.getAttribute('data-filter')
          });
          if (typeof aosInit === 'function') {
            aosInit();
          }
        }, false);
      });

    });
  }
  onReadyOrNow(() => {
    whenAvailable(
      () => typeof window.imagesLoaded !== 'undefined' && typeof window.Isotope !== 'undefined',
      initIsotopeLayouts
    );
  });

  /**
   * Init swiper sliders
   */
  /*
    function initSwiper() {
      document.querySelectorAll(".init-swiper").forEach(function (swiperElement) {
        let config = JSON.parse(
          swiperElement.querySelector(".swiper-config").innerHTML.trim()
        );
  
        if (swiperElement.classList.contains("swiper-tab")) {
          initSwiperWithCustomPagination(swiperElement, config);
        } else {
          new Swiper(swiperElement, config);
        }
      });
    }
  
    window.addEventListener("load", initSwiper);
  */

  /* Frequently Asked Questions Toggle */
  document.addEventListener('click', function (event) {
    const trigger = event.target.closest('.faq-item h3, .faq-item .faq-toggle');
    if (!trigger) {
      return;
    }

    const item = trigger.closest('.faq-item');
    if (item) {
      item.classList.toggle('faq-active');
    }
  });

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  onLoadOrNow(function () {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  });

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a');

  function navmenuScrollspy() {
    navmenulinks.forEach(navmenulink => {
      if (!navmenulink.hash) return;
      let section = document.querySelector(navmenulink.hash);
      if (!section) return;
      let position = window.scrollY + 200;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        document.querySelectorAll('.navmenu a.active').forEach(link => link.classList.remove('active'));
        navmenulink.classList.add('active');
      } else {
        navmenulink.classList.remove('active');
      }
    })
  }
  onLoadOrNow(navmenuScrollspy);
  document.addEventListener('scroll', navmenuScrollspy);

})();
