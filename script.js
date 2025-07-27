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
                        target.classList.add('animate-in');
                        // Optimisation will-change - libérer après animation
                        setTimeout(() => {
                            target.style.willChange = 'auto';
                        }, 700); // Durée de transition
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

// Gestion du carrousel d'images de traitement - VERSION CORRIGÉE
function initTreatmentCarousel() {
    const carousel = document.getElementById('treatment-carousel');
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.carousel-slide');
    const indicators = carousel.querySelectorAll('.carousel-indicator');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (slides.length === 0) return;

    let currentSlide = 0;
    let autoSlideInterval = null;
    let isUserInteracting = false;
    let restartTimeout = null;

    // Fonction pour afficher une slide spécifique
    function showSlide(index) {
        // Masquer toutes les slides
        slides.forEach(slide => {
            slide.style.opacity = '0';
        });
        
        // Réinitialiser tous les indicateurs
        indicators.forEach(indicator => {
            indicator.classList.remove('bg-white/80');
            indicator.classList.add('bg-white/50');
        });
        
        // Afficher la slide courante
        if (slides[index]) {
            slides[index].style.opacity = '1';
        }
        
        // Activer l'indicateur correspondant
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

    // Fonction pour arrêter le défilement automatique de manière sécurisée
    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
        if (restartTimeout) {
            clearTimeout(restartTimeout);
            restartTimeout = null;
        }
    }

    // Fonction pour démarrer le défilement automatique
    function startAutoSlide() {
        // Toujours arrêter d'abord pour éviter les doublons
        stopAutoSlide();
        
        // Ne démarre que si l'utilisateur n'interagit pas
        if (!isUserInteracting) {
            autoSlideInterval = setInterval(nextSlide, 4000); // 4 secondes entre chaque slide
        }
    }

    // Fonction pour gérer les interactions utilisateur
    function handleUserInteraction(action) {
        isUserInteracting = true;
        stopAutoSlide();
        action();
        
        // Redémarrer après 8 secondes d'inactivité
        restartTimeout = setTimeout(() => {
            isUserInteracting = false;
            startAutoSlide();
        }, 8000);
    }

    // Événements pour les boutons de navigation
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            handleUserInteraction(prevSlide);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            handleUserInteraction(nextSlide);
        });
    }

    // Événements pour les indicateurs
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            handleUserInteraction(() => showSlide(index));
        });
    });

    // Pause au survol du carrousel
    carousel.addEventListener('mouseenter', () => {
        isUserInteracting = true;
        stopAutoSlide();
    });

    carousel.addEventListener('mouseleave', () => {
        isUserInteracting = false;
        // Petit délai avant de redémarrer
        setTimeout(() => {
            if (!isUserInteracting) {
                startAutoSlide();
            }
        }, 1000);
    });

    // Pause lors du focus clavier
    carousel.addEventListener('focusin', () => {
        isUserInteracting = true;
        stopAutoSlide();
    });

    carousel.addEventListener('focusout', () => {
        isUserInteracting = false;
        setTimeout(() => {
            if (!isUserInteracting) {
                startAutoSlide();
            }
        }, 1000);
    });

    // Gestion du clavier pour l'accessibilité
    carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            handleUserInteraction(prevSlide);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            handleUserInteraction(nextSlide);
        }
    });

    // Gérer la visibilité de la page pour arrêter/reprendre le carrousel
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoSlide();
        } else if (!isUserInteracting) {
            setTimeout(startAutoSlide, 2000);
        }
    });

    // Initialiser le carrousel
    showSlide(0);
    
    // Démarrer l'auto-slide après un petit délai pour éviter les conflits
    setTimeout(startAutoSlide, 1000);
}

// Initialisation globale
function init() {
    // Attendre que le DOM soit chargé
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
        
        console.log('Application initialisée avec succès');
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
            console.log(`AI Platform clicked: ${platform}`);
            
            // Google Analytics si présent
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