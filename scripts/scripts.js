// Accessibility and Interaction Helpers
(function () {
    document.addEventListener('DOMContentLoaded', () => {
        initializeTheme();
        setupThemeToggle();
        initializeTabs();
        initializeChecklists();
        initializeCourseCatalog();
        initializeCourseSectionToggle();
        initializeBackToTop();
        initializeMobileNav();
        markDecorativeIcons();
    });
})();

// Theme Management
function initializeTheme() {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = storedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeToggleIcon(theme);
    syncThemeToggleState(theme);
}

function toggleTheme() {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    updateThemeToggleIcon(nextTheme);
    syncThemeToggleState(nextTheme);
}

function setupThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) return;
    themeToggle.addEventListener('click', toggleTheme);
}

function updateThemeToggleIcon(theme) {
    const toggle = document.querySelector('.theme-toggle');
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        icon.setAttribute('aria-hidden', 'true');
        icon.setAttribute('focusable', 'false');
    }
    if (toggle) {
        toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
}

function syncThemeToggleState(theme) {
    const themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) return;
    themeToggle.setAttribute('aria-pressed', (theme === 'dark').toString());
}
// Concentration Tabs Functionality
function initializeTabs() {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const tabPanels = Array.from(document.querySelectorAll('.tab-content'));

    if (!tabs.length || !tabPanels.length) {
        return;
    }

    tabPanels.forEach(panel => {
        panel.hidden = true;
        panel.classList.remove('active');
    });

    tabs.forEach(tab => {
        tab.setAttribute('type', 'button');
        tab.setAttribute('tabindex', '-1');
        tab.setAttribute('aria-selected', 'false');
        tab.addEventListener('click', () => switchTab(tab));
        tab.addEventListener('keydown', (event) => handleTabKeydown(event, tab));
    });

    const defaultTab = document.querySelector('.tab.active') || tabs[0];
    if (defaultTab) {
        switchTab(defaultTab, false);
    }
}

function switchTab(newTab, focusTab = true) {
    const targetPanelId = newTab.getAttribute('aria-controls');
    const targetPanel = document.getElementById(targetPanelId);

    if (!targetPanel) return;

    // Update tab buttons
    const allTabs = document.querySelectorAll('.tab');
    allTabs.forEach(tab => {
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
        tab.classList.remove('active');
    });

    document.querySelectorAll('.tab-content').forEach(panel => {
        panel.hidden = true;
        panel.classList.remove('active');
    });

    newTab.setAttribute('aria-selected', 'true');
    newTab.setAttribute('tabindex', '0');
    newTab.classList.add('active');
    if (focusTab) {
        newTab.focus();
    }

    targetPanel.hidden = false;
    targetPanel.classList.add('active');
}

function handleTabKeydown(event, tab) {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const currentIndex = tabs.indexOf(tab);

    switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
            event.preventDefault();
            const nextTab = tabs[(currentIndex + 1) % tabs.length];
            switchTab(nextTab);
            break;
        case 'ArrowLeft':
        case 'ArrowUp':
            event.preventDefault();
            const prevTab = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
            switchTab(prevTab);
            break;
        case 'Home':
            event.preventDefault();
            switchTab(tabs[0]);
            break;
        case 'End':
            event.preventDefault();
            switchTab(tabs[tabs.length - 1]);
            break;
        default:
            break;
    }
}

// Initialize checklists and progress bars
function initializeChecklists() {
    document.querySelectorAll('.checklist-section').forEach(section => {
        const checkboxes = section.querySelectorAll('input[type="checkbox"]');
        const progressBar = section.querySelector('.progress-bar');
        const progressLabel = section.querySelector('.progress-container .progress-label');

        // Load saved state
        checkboxes.forEach(checkbox => {
            const saved = localStorage.getItem(checkbox.id);
            if (saved === 'true') {
                checkbox.checked = true;
                checkbox.setAttribute('aria-checked', 'true');
            }

            // Add change listener
            checkbox.addEventListener('change', function() {
                localStorage.setItem(this.id, this.checked);
                this.setAttribute('aria-checked', this.checked.toString());
                updateProgress(section);
            });
        });

        // Initial progress update
        updateProgress(section);
    });
}

// Update progress bar and announce changes
function updateProgress(section) {
    const checkboxes = section.querySelectorAll('input[type="checkbox"]');
    const progressBar = section.querySelector('.progress-bar');
    const progressLabel = section.querySelector('.progress-container .progress-label');
    const heading = section.querySelector('h3');
    const sectionLabel = heading ? heading.textContent.trim() : 'this section';

    if (!progressBar || !progressLabel) return;

    const total = checkboxes.length;
    const checked = section.querySelectorAll('input[type="checkbox"]:checked').length;
    const percentage = total === 0 ? 0 : Math.round((checked / total) * 100);

    // Update progress bar
    progressBar.style.width = `${percentage}%`;
    progressBar.setAttribute('aria-valuenow', percentage);
    progressBar.setAttribute('aria-valuetext', `${percentage}% complete`);

    progressLabel.textContent = `${sectionLabel} completion progress: ${percentage}%`;

    // Announce progress to screen readers
    announceToScreenReader(`${percentage}% of ${sectionLabel} completed`);
}

// Announce changes to screen readers
function announceToScreenReader(message) {
    const announcer = document.getElementById('aria-announcer') || createAriaAnnouncer();
    announcer.textContent = message;
}

// Create an ARIA live region for announcements
function createAriaAnnouncer() {
    const announcer = document.createElement('div');
    announcer.id = 'aria-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.classList.add('sr-only');
    document.body.appendChild(announcer);
    return announcer;
}

function initializeCourseCatalog() {
    const courseGrid = document.getElementById('courseGrid');
    const courseFilter = document.getElementById('courseFilter');
    const resultsCount = document.getElementById('courseResults');

    if (!courseGrid) {
        return;
    }

    const courses = Array.from(courseGrid.querySelectorAll('.course-card'));
    if (!courses.length) {
        return;
    }

    courses.forEach((card, index) => {
        const details = card.querySelector('.course-details');
        if (!details) {
            return;
        }

        if (!details.id) {
            details.id = `course-details-${index}`;
        }
        details.hidden = !card.classList.contains('active');

        const heading = card.querySelector('h3');
        if (heading) {
            heading.removeAttribute('role');
            heading.removeAttribute('tabindex');
            heading.removeAttribute('aria-controls');
            heading.removeAttribute('aria-expanded');
        }

        const trigger = card.querySelector('.course-header');
        if (trigger) {
            trigger.setAttribute('tabindex', '0');
            trigger.setAttribute('role', 'button');
            trigger.setAttribute('aria-controls', details.id);
            trigger.setAttribute('aria-expanded', card.classList.contains('active').toString());

            trigger.addEventListener('click', () => {
                const shouldExpand = !card.classList.contains('active');
                courses.forEach(otherCard => {
                    if (otherCard !== card) {
                        otherCard.classList.remove('active');
                        updateCourseAriaState(otherCard, false);
                    }
                });

                card.classList.toggle('active', shouldExpand);
                updateCourseAriaState(card, shouldExpand);
            });

            trigger.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    trigger.click();
                }
            });
        }
    });

    const filterCourses = (category = 'all') => {
        let visibleCourses = 0;

        courses.forEach(course => {
            const categories = (course.getAttribute('data-categories') || '')
                .split(' ')
                .filter(Boolean);
            const matches = category === 'all' || categories.includes(category);

            course.style.display = matches ? 'flex' : 'none';
            course.hidden = !matches;

            if (!matches) {
                course.classList.remove('active');
                updateCourseAriaState(course, false);
            } else {
                visibleCourses += 1;
            }
        });

        updateResultsCount(category, visibleCourses);
    };

    const updateResultsCount = (category, count) => {
        if (!resultsCount) {
            return;
        }

        const categoryMap = {
            core: 'Core Requirements',
            hr: 'Human Resources',
            finance: 'Public Finance',
            local: 'Local Government',
            policy: 'Public Policy',
            advisor: 'Advisor Electives'
        };

        if (typeof count !== 'number') {
            count = courses.filter(course => {
                const categories = (course.getAttribute('data-categories') || '')
                    .split(' ')
                    .filter(Boolean);
                return category === 'all' || categories.includes(category);
            }).length;
        }

        const categoryName = category === 'all' ? 'All Courses' : (categoryMap[category] || category);
        resultsCount.textContent = `Showing ${count} ${categoryName} courses`;
    };

    if (courseFilter) {
        courseFilter.addEventListener('change', (event) => {
            filterCourses(event.target.value);
        });
        filterCourses(courseFilter.value);
    } else {
        filterCourses('all');
    }
}

function updateCourseAriaState(card, expanded) {
    card.querySelectorAll('[role="button"][aria-controls]').forEach(trigger => {
        trigger.setAttribute('aria-expanded', expanded.toString());
    });

    const details = card.querySelector('.course-details');
    if (details) {
        details.hidden = !expanded;
    }
}

function initializeCourseSectionToggle() {
    const toggle = document.querySelector('.course-section-toggle');
    const content = document.getElementById('courseCatalogContent');
    if (!toggle || !content) {
        return;
    }

    const toggleText = toggle.querySelector('.toggle-text');

    const setState = (expanded) => {
        toggle.setAttribute('aria-expanded', expanded.toString());
        if (toggleText) {
            toggleText.textContent = expanded ? 'Collapse section' : 'Expand section';
        }

        if (expanded) {
            content.removeAttribute('hidden');
        } else {
            content.setAttribute('hidden', '');
        }
    };

    toggle.addEventListener('click', () => {
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        setState(!isExpanded);
    });

    setState(toggle.getAttribute('aria-expanded') !== 'false');
}
// Mobile Navigation
function initializeMobileNav() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.getElementById('primary-navigation') || document.querySelector('.nav-list');

    if (!menuToggle || !navList) {
        return;
    }

    const closeMenu = () => {
        navList.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
    };

    menuToggle.addEventListener('click', (event) => {
        event.preventDefault();
        const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', (!isExpanded).toString());
        navList.classList.toggle('active', !isExpanded);
    });

    navList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.navigation') && menuToggle.getAttribute('aria-expanded') === 'true') {
            closeMenu();
            menuToggle.focus();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
            closeMenu();
            menuToggle.focus();
        }
    });

    const desktopQuery = window.matchMedia('(min-width: 769px)');
    const handleDesktopChange = (event) => {
        if (event.matches) {
            closeMenu();
        }
    };

    if (typeof desktopQuery.addEventListener === 'function') {
        desktopQuery.addEventListener('change', handleDesktopChange);
    } else if (typeof desktopQuery.addListener === 'function') {
        desktopQuery.addListener(handleDesktopChange);
    }
}

function markDecorativeIcons() {
    const icons = document.querySelectorAll('i[class*="fa-"], i.fas, i.fab, i.far');
    icons.forEach(icon => {
        icon.setAttribute('aria-hidden', 'true');
        icon.setAttribute('focusable', 'false');
    });
}

function initializeBackToTop() {
    const button = document.querySelector('.back-to-top');
    const mainContent = document.getElementById('main-content');

    if (!button) {
        return;
    }

    button.removeAttribute('hidden');

    const setVisibility = (isVisible) => {
        button.classList.toggle('visible', isVisible);
        button.hidden = !isVisible;
        button.tabIndex = isVisible ? 0 : -1;
    };

    const toggleVisibility = () => {
        setVisibility(window.scrollY > 400);
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    button.addEventListener('click', () => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        if (mainContent) {
            mainContent.focus({ preventScroll: true });
        }
    });
}
