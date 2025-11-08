// ========================================
// Viagem Certa - Funcionalidades Gerais
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu Toggle
  initMobileMenu();
  
  // Smooth Scroll for Anchor Links
  initSmoothScroll();
  
  // Scroll Reveal Animations
  initScrollReveal();
  
  // Active Nav Link on Scroll
  initActiveNavOnScroll();
});

// ========================================
// Mobile Menu
// ========================================
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenuClose = document.getElementById('mobile-menu-close');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
  
  if (!mobileMenuBtn || !mobileMenu) return;
  
  // Open Mobile Menu
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.add('active');
    mobileOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
  
  // Close Mobile Menu
  const closeMobileMenu = () => {
    mobileMenu.classList.remove('active');
    mobileOverlay.classList.remove('active');
    document.body.style.overflow = '';
  };
  
  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', closeMobileMenu);
  }
  
  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', closeMobileMenu);
  }
  
  // Close menu when clicking on links
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });
  
  // Close menu on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
      closeMobileMenu();
    }
  });
}

// ========================================
// Smooth Scroll
// ========================================
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      
      // Ignorar links vazios ou apenas "#"
      if (!href || href === '#') return;
      
      const target = document.querySelector(href);
      
      if (target) {
        e.preventDefault();
        
        const headerOffset = 80; // Altura do header fixo
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ========================================
// Scroll Reveal Animations
// ========================================
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  
  if (revealElements.length === 0) return;
  
  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const revealPoint = 100;
    
    revealElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      
      if (elementTop < windowHeight - revealPoint) {
        element.classList.add('active');
      }
    });
  };
  
  // Initial check
  revealOnScroll();
  
  // On scroll
  window.addEventListener('scroll', revealOnScroll);
}

// ========================================
// Active Nav Link on Scroll
// ========================================
function initActiveNavOnScroll() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  
  if (sections.length === 0 || navLinks.length === 0) return;
  
  const setActiveLink = () => {
    const scrollPosition = window.pageYOffset + 150;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      const sectionId = section.getAttribute('id');
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  };
  
  window.addEventListener('scroll', setActiveLink);
}

// ========================================
// Scroll to Top Button (opcional)
// ========================================
function initScrollToTop() {
  const scrollBtn = document.getElementById('scroll-to-top');
  
  if (!scrollBtn) return;
  
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      scrollBtn.classList.remove('hidden');
      scrollBtn.classList.add('show');
    } else {
      scrollBtn.classList.remove('show');
      scrollBtn.classList.add('hidden');
    }
  });
  
  scrollBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// ========================================
// Form Animations
// ========================================
function initFormAnimations() {
  const inputs = document.querySelectorAll('.form-input');
  
  inputs.forEach(input => {
    // Add focus class
    input.addEventListener('focus', () => {
      input.parentElement.classList.add('focused');
    });
    
    // Remove focus class
    input.addEventListener('blur', () => {
      if (!input.value) {
        input.parentElement.classList.remove('focused');
      }
    });
    
    // Check if input has value on page load
    if (input.value) {
      input.parentElement.classList.add('focused');
    }
  });
}

// ========================================
// Lazy Loading Images (opcional)
// ========================================
function initLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');
  
  if (images.length === 0) return;
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
}

// ========================================
// Modal Handler (se necessário)
// ========================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
  
  // Animate
  setTimeout(() => {
    modal.querySelector('.modal-content')?.classList.add('scale-100');
  }, 10);
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.querySelector('.modal-content')?.classList.remove('scale-100');
  
  setTimeout(() => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  }, 300);
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    closeModal(e.target.id);
  }
});

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const openModals = document.querySelectorAll('.modal:not(.hidden)');
    openModals.forEach(modal => closeModal(modal.id));
  }
});

// ========================================
// Header Scroll Effect (change bg on scroll)
// ========================================
function initHeaderScrollEffect() {
  const header = document.querySelector('nav');
  if (!header) return;
  
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// ========================================
// Stats Counter Animation (números animados)
// ========================================
function animateCounter(element, target, duration = 2000) {
  let start = 0;
  const increment = target / (duration / 16); // 60fps
  
  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(start);
    }
  }, 16);
}

function initStatsAnimation() {
  const stats = document.querySelectorAll('[data-count]');
  
  if (stats.length === 0) return;
  
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.count);
        animateCounter(entry.target, target);
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  stats.forEach(stat => statsObserver.observe(stat));
}

// Export functions for use in other files
if (typeof window !== 'undefined') {
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.animateCounter = animateCounter;
}



