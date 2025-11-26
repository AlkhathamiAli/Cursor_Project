// ============================================
// Performance Optimization Module
// Reduces lag and improves page load smoothness
// ============================================

(function() {
  'use strict';

  // ============================================
  // 1. DEFER NON-CRITICAL OPERATIONS
  // ============================================
  const PerformanceOptimizer = {
    init() {
      this.setupPassiveListeners();
      this.optimizeAnimations();
      this.deferNonCritical();
      this.optimizeScroll();
      this.cacheDOM();
    },

    // ============================================
    // 2. PASSIVE EVENT LISTENERS (Better Scroll Performance)
    // ============================================
    setupPassiveListeners() {
      // Convert scroll listeners to passive
      const scrollElements = document.querySelectorAll('*');
      scrollElements.forEach(el => {
        const listeners = getEventListeners ? getEventListeners(el) : null;
        // Note: getEventListeners is Chrome DevTools only
        // We'll optimize known scroll handlers instead
      });

      // Optimize known scroll handlers
      document.addEventListener('scroll', this.throttle(() => {
        // Scroll handling
      }, 16), { passive: true });

      window.addEventListener('scroll', this.throttle(() => {
        // Window scroll handling
      }, 16), { passive: true });
    },

    // ============================================
    // 3. OPTIMIZE ANIMATIONS (Use GPU Acceleration)
    // ============================================
    optimizeAnimations() {
      // Add will-change to animated elements
      const animatedSelectors = [
        '.ai-assistant-btn',
        '.chatbot-messages',
        '.sidebar',
        '.card',
        '.topbar'
      ];

      animatedSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.style.willChange = 'transform, opacity';
        });
      });

      // Use transform instead of top/left for animations
      const style = document.createElement('style');
      style.textContent = `
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* GPU-accelerated animations */
        .ai-assistant-btn,
        .chatbot-messages,
        .sidebar,
        .card {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
        }
        
        /* Reduce repaints */
        .sidebar,
        .topbar {
          contain: layout style paint;
        }
      `;
      document.head.appendChild(style);
    },

    // ============================================
    // 4. DEFER NON-CRITICAL OPERATIONS
    // ============================================
    deferNonCritical() {
      // Use requestIdleCallback for non-critical work
      const runWhenIdle = (callback, timeout = 2000) => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(callback, { timeout });
        } else {
          setTimeout(callback, 100);
        }
      };

      // Defer analytics, non-critical UI updates
      runWhenIdle(() => {
        // Non-critical operations here
      });
    },

    // ============================================
    // 5. OPTIMIZE SCROLL PERFORMANCE
    // ============================================
    optimizeScroll() {
      let ticking = false;
      
      const optimizedScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            // Scroll handling code
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener('scroll', optimizedScroll, { passive: true });
    },

    // ============================================
    // 6. DOM CACHING
    // ============================================
    cacheDOM() {
      // Cache frequently accessed elements
      window.domCache = window.domCache || {};
      
      const cacheElement = (id, selector) => {
        if (!window.domCache[id]) {
          window.domCache[id] = document.querySelector(selector);
        }
        return window.domCache[id];
      };

      // Pre-cache common elements
      requestIdleCallback(() => {
        cacheElement('sidebar', '.sidebar');
        cacheElement('topbar', '.topbar');
        cacheElement('chatbot', '#ai-chatbot');
        cacheElement('chatbotBtn', '#aiAssistantBtn');
      });
    },

    // ============================================
    // 7. UTILITY FUNCTIONS
    // ============================================
    throttle(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    debounce(func, wait, immediate) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          timeout = null;
          if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
      };
    }
  };

  // ============================================
  // 8. LAZY LOAD IMAGES
  // ============================================
  function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              img.classList.add('loaded');
              observer.unobserve(img);
            }
          }
        });
      }, {
        rootMargin: '50px'
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  // ============================================
  // 9. OPTIMIZE PAGE LOAD
  // ============================================
  function optimizePageLoad() {
    // Defer heavy operations
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        requestIdleCallback(() => {
          PerformanceOptimizer.init();
          setupLazyLoading();
        }, { timeout: 1000 });
      });
    } else {
      requestIdleCallback(() => {
        PerformanceOptimizer.init();
        setupLazyLoading();
      }, { timeout: 1000 });
    }
  }

  // ============================================
  // 11. REDUCE LAYOUT THRASHING
  // ============================================
  function batchDOMUpdates() {
    let updateQueue = [];
    let scheduled = false;

    window.batchUpdate = function(callback) {
      updateQueue.push(callback);
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(() => {
          updateQueue.forEach(fn => fn());
          updateQueue = [];
          scheduled = false;
        });
      }
    };
  }

  // ============================================
  // 12. INITIALIZE
  // ============================================
  optimizePageLoad();
  batchDOMUpdates();

  // Export utilities
  window.PerformanceOptimizer = PerformanceOptimizer;
  window.throttle = PerformanceOptimizer.throttle.bind(PerformanceOptimizer);
  window.debounce = PerformanceOptimizer.debounce.bind(PerformanceOptimizer);

})();

