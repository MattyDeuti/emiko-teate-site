// Configuration globale
const config = {
    animationDelay: 100,
    scrollThreshold: 300,
    intersectionThreshold: 0.15
};

// Utilitaire de debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Observateur d'intersection optimisé pour animations et lazy loading
function initIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                
                // Gestion du lazy loading des images
                if (target.dataset.src) {
                    target.src = target.dataset.src;
                    target.removeAttribute('data-src');
                }
                
                // Gestion uniforme des animations
                if (target.dataset.animate !== undefined) {
                    const delay = parseInt(target.dataset.delay) || 0;
                    
                    setTimeout(() => {
                        // [MODIFIÉ] Solution plus robuste pour libérer will-change
                        target.addEventListener('transitionend', () => {
                            target.style.willChange = 'auto';
                        }, { once: true });
                        
                        target.classList.add('animate-in');
                    }, delay);
                }
                
                observer.unobserve(target);
            }
        });
    }, {
        threshold: config.intersectionThreshold,
        rootMargin: '50px'
    });
    
    // Observer seulement les éléments avec data-animate et images
    document.querySelectorAll('[data-animate], img[data-src]').forEach(el => {
        observer.observe(el);
    });
}

// Gestion du bouton scroll to top
function initScrollToTop() {
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (!scrollToTopBtn) return;
    
    const toggleVisibility = debounce(() => {
        const isVisible = window.scrollY >= config.scrollThreshold;
        scrollToTopBtn.classList.toggle('opacity-0', !isVisible);
        scrollToTopBtn.classList.toggle('pointer-events-none', !isVisible);
    }, 100);
    
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Gestion du menu mobile
function initMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (!mobileMenuButton || !mobileMenu) return;
    
    function toggleMenu(open) {
        mobileMenu.classList.toggle('hidden', !open);
        mobileMenuButton.setAttribute('aria-expanded', open.toString());
        document.body.style.overflow = open ? 'hidden' : '';
        
        // Gestion du focus pour l'accessibilité
        if (open) {
            const firstFocusable = mobileMenu.querySelector('a, button');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }
    }
    
    mobileMenuButton.addEventListener('click', () => {
        const isOpen = !mobileMenu.classList.contains('hidden');
        toggleMenu(!isOpen);
    });
    
    // Fermer le menu avec Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
            toggleMenu(false);
            mobileMenuButton.focus();
        }
    });
    
    // Fermer le menu en cliquant sur les liens
    mobileMenu.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            toggleMenu(false);
        }
    });
}

// Gestion de la navigation fluide
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Gestion de la navigation sticky
function initStickyNavigation() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    
    const handleScroll = debounce(() => {
        const isScrolled = window.scrollY > 50;
        nav.classList.toggle('scrolled', isScrolled);
    }, 10);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
}

// Gestion des erreurs d'images
function initImageErrorHandling() {
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            if (this.dataset.fallback) {
                this.src = this.dataset.fallback;
            } else {
                this.style.display = 'none';
            }
        });
    });
}

// Mise à jour automatique de l'année du copyright
function updateCopyrightYear() {
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        const currentYear = new Date().getFullYear();
        currentYearElement.textContent = currentYear;
    }
}

// Gestion du carrousel d'images de traitement
function initTreatmentCarousel() {
    const carousel = document.getElementById('treatment-carousel');
    if (!carousel) return;
    
    const slides = carousel.querySelectorAll('.carousel-slide');
    const indicators = carousel.querySelectorAll('.carousel-indicator');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    let autoSlideInterval;
    
    // Fonction pour afficher une slide spécifique
    function showSlide(index) {
        slides.forEach(slide => {
            slide.style.opacity = '0';
        });
        
        indicators.forEach(indicator => {
            indicator.classList.remove('bg-white/80');
            indicator.classList.add('bg-white/50');
        });
        
        if (slides[index]) {
            slides[index].style.opacity = '1';
        }
        
        if (indicators[index]) {
            indicators[index].classList.remove('bg-white/50');
            indicators[index].classList.add('bg-white/80');
        }
        
        currentSlide = index;
    }
    
    // Fonction pour passer à la slide suivante
    function nextSlide() {
        const next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }
    
    // Fonction pour passer à la slide précédente
    function prevSlide() {
        const prev = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(prev);
    }
    
    // Démarrer le défilement automatique
    function startAutoSlide() {
        // [MODIFIÉ] Durée du carrousel changée à 2.5 secondes
        autoSlideInterval = setInterval(nextSlide, 2500); 
    }
    
    // Arrêter le défilement automatique
    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
    }
    
    // Événements pour les boutons de navigation
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            stopAutoSlide();
            prevSlide();
            setTimeout(startAutoSlide, 6000);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            stopAutoSlide();
            nextSlide();
            setTimeout(startAutoSlide, 6000);
        });
    }
    
    // Événements pour les indicateurs
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            stopAutoSlide();
            showSlide(index);
            setTimeout(startAutoSlide, 6000);
        });
    });
    
    carousel.addEventListener('mouseenter', stopAutoSlide);
    carousel.addEventListener('mouseleave', startAutoSlide);
    carousel.addEventListener('focusin', stopAutoSlide);
    carousel.addEventListener('focusout', startAutoSlide);
    
    showSlide(0);
    startAutoSlide();
    
    carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            stopAutoSlide();
            prevSlide();
            setTimeout(startAutoSlide, 6000);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            stopAutoSlide();
            nextSlide();
            setTimeout(startAutoSlide, 6000);
        }
    });
}

// Initialisation globale
function init() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
        return;
    }
    
    try {
        initIntersectionObserver();
        initScrollToTop();
        initMobileMenu();
        initSmoothScrolling();
        initStickyNavigation();
        initImageErrorHandling();
        updateCopyrightYear();
        initTreatmentCarousel();
        
        // [MODIFIÉ] console.log retiré ou commenté
        // console.log('Application initialisée avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
    }
}

// Tracking discret des clics IA
function initAITracking() {
    const aiLinks = document.querySelectorAll('.ai-link-discrete');
    aiLinks.forEach(link => {
        link.addEventListener('click', function() {
            const platform = this.textContent.trim();
            // [MODIFIÉ] console.log retiré ou commenté
            // console.log(`AI Platform clicked: ${platform}`);
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'ai_analysis', {
                    'platform': platform,
                    'method': 'discrete'
                });
            }
        });
    });
}

// Démarrage de l'application
init();

// Initialiser le tracking IA après le chargement
document.addEventListener('DOMContentLoaded', function() {
    initAITracking();
});

// Export pour les tests (si nécessaire)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debounce,
        config
    };
}