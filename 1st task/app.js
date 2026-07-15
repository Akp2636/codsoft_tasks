/**
 * Alex Morgan Portfolio - Interactive Frontend Logic
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // SELECTION OF ELEMENTS
    // ==========================================================================
    const header = document.querySelector('.header');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const scrollProgress = document.getElementById('scrollProgress');
    const backToTopBtn = document.getElementById('backToTop');
    
    // Modals
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modals = document.querySelectorAll('.modal');
    const openModalButtons = document.querySelectorAll('.open-project-modal');
    const viewLiveDemoButtons = document.querySelectorAll('.view-live-demo');
    const closeModalButtons = document.querySelectorAll('.modal-close, .close-modal-btn');
    const previewResumeBtn = document.getElementById('previewResumeBtn');
    const resumePreviewModal = document.getElementById('resume-preview-modal');
    
    // Contact Form
    const contactForm = document.getElementById('contactForm');
    const formSuccessAlert = document.getElementById('formSuccessAlert');

    // Dynamic Copyright Year
    const currentYearEl = document.getElementById('currentYear');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    // ==========================================================================
    // SCROLL EFFECTS & EVENTS
    // ==========================================================================
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        
        // 1. Shrink header when scroll exceeds 50px
        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // 2. Update scroll progress indicator
        if (documentHeight > 0) {
            const scrollPercent = (scrollTop / documentHeight) * 100;
            scrollProgress.style.width = `${scrollPercent}%`;
        }

        // 3. Show/hide Back to Top button
        if (scrollTop > 600) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }

        // 4. Highlight active nav menu links relative to viewport position
        let currentSectionId = '';
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            if (scrollTop >= sectionTop && scrollTop < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });

    // Back to Top functionality
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // ==========================================================================
    // MOBILE NAV hambuger interaction
    // ==========================================================================
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close Mobile menu when links are clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // ==========================================================================
    // SCROLL REVEAL (Intersection Observer)
    // ==========================================================================
    const revealElements = document.querySelectorAll('.scroll-reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // stop observing once revealed
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

    // Trigger skills bar animation upon entry
    const skillsSection = document.getElementById('skills');
    const skillBars = document.querySelectorAll('.skill-progress-bar');
    
    // Reset widths in CSS first; let JS set them once visible
    skillBars.forEach(bar => {
        bar.dataset.targetWidth = bar.style.width;
        bar.style.width = '0%';
    });

    const skillsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                skillBars.forEach(bar => {
                    bar.style.width = bar.dataset.targetWidth;
                });
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2
    });

    if (skillsSection) {
        skillsObserver.observe(skillsSection);
    }

    // ==========================================================================
    // MODAL OPERATIONS
    // ==========================================================================
    
    // Function to open specific modal
    const openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modalBackdrop.classList.add('active');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // prevent backdrop scrolling
        }
    };

    // Function to close all active modals
    const closeAllModals = () => {
        modalBackdrop.classList.remove('active');
        modals.forEach(modal => modal.classList.remove('active'));
        document.body.style.overflow = '';
    };

    // Binding click to open buttons
    openModalButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.dataset.target;
            openModal(targetId);
        });
    });

    // Live demo buttons redirecting to modal info
    viewLiveDemoButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.dataset.target;
            openModal(targetId);
        });
    });

    // Binding close clicks
    closeModalButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
        });
    });

    // Backdrop click close
    modalBackdrop.addEventListener('click', () => {
        closeAllModals();
    });

    // Esc key closes modals
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // Resume Modal trigger
    if (previewResumeBtn && resumePreviewModal) {
        previewResumeBtn.addEventListener('click', () => {
            openModal('resume-preview-modal');
        });
    }

    // ==========================================================================
    // CONTACT FORM SIMULATION
    // ==========================================================================
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Collect Form Values (Mock submission)
            const name = document.getElementById('formName').value;
            const email = document.getElementById('formEmail').value;
            const subject = document.getElementById('formSubject').value;
            const message = document.getElementById('formMessage').value;

            // Simple validation check
            if (!name || !email || !subject || !message) {
                alert('Please fill out all fields.');
                return;
            }

            const submitBtn = contactForm.querySelector('.btn-submit');
            const originalBtnText = submitBtn.innerHTML;

            // Visual feedback: submitting state
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <span>Sending...</span>
                <svg class="btn-icon" style="animation: spin 1s infinite linear" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v4"></path></svg>
            `;

            // Style rule for spin animation injection if missing
            if (!document.getElementById('spinStyle')) {
                const style = document.createElement('style');
                style.id = 'spinStyle';
                style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
                document.head.appendChild(style);
            }

            // Simulate server network latency of 1.5 seconds
            setTimeout(() => {
                // Success: Hide form, reveal success card
                contactForm.style.display = 'none';
                formSuccessAlert.style.display = 'flex';
                
                // Optional: print log for validation purposes
                console.log('Form submission received:', { name, email, subject, message });
            }, 1200);
        });
    }

    // Hero Typewriter effect for Alex's tag lines
    const textSequence = [
        "Senior Software Engineer.",
        "Creative Web Developer.",
        "Interactive UI Specialist."
    ];
    let sequenceIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingDelay = 100;
    const typingSpan = document.createElement('span');
    typingSpan.classList.add('typewriter-text');
    typingSpan.style.borderRight = '2px solid var(--color-primary)';
    typingSpan.style.paddingRight = '4px';
    typingSpan.style.marginLeft = '4.5px';

    const typewriterTarget = document.querySelector('.hero-tagline');
    if (typewriterTarget) {
        // Find existing developer name text, and append the dynamic span cursor.
        // We will modify the greeting a bit to integrate typewriter:
        const originalText = typewriterTarget.innerHTML;
        typewriterTarget.innerHTML = `Hi, I'm <span class="highlight-text">Alex Morgan</span>. I am a `;
        typewriterTarget.appendChild(typingSpan);

        function type() {
            const currentString = textSequence[sequenceIndex];
            
            if (isDeleting) {
                typingSpan.textContent = currentString.substring(0, charIndex - 1);
                charIndex--;
                typingDelay = 40;
            } else {
                typingSpan.textContent = currentString.substring(0, charIndex + 1);
                charIndex++;
                typingDelay = 100;
            }

            if (!isDeleting && charIndex === currentString.length) {
                // Pause at complete word
                typingDelay = 2000;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                sequenceIndex = (sequenceIndex + 1) % textSequence.length;
                typingDelay = 500;
            }

            setTimeout(type, typingDelay);
        }
        
        // Start typewriter loop
        setTimeout(type, 1000);
    }
});
