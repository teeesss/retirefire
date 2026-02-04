/**
 * Handles sidebar navigation and smooth scrolling
 */
export class NavigationHandler {
    static init() {
        window.toggleSidebar = this.toggleSidebar.bind(this);
        const navItems = document.querySelectorAll('.sidebar-nav-item');
        const sections = [];

        // Collect all section elements
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href && href.startsWith('#')) {
                const section = document.getElementById(href.slice(1));
                if (section) {
                    sections.push({ id: href.slice(1), element: section, navItem: item });
                }
            }
        });

        // Smooth scroll when clicking nav items
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const href = item.getAttribute('href');
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    navItems.forEach(n => n.classList.remove('active'));
                    item.classList.add('active');

                    // If on mobile, close the sidebar after clicking
                    if (window.innerWidth <= 1200) {
                        this.toggleSidebar();
                    }
                }
            });
        });

        // COLLECT ALL SECTIONS FOR SCROLL SPY
        const sectionsToWatch = [];
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href && href.startsWith('#')) {
                const section = document.getElementById(href.slice(1));
                if (section) {
                    sectionsToWatch.push({ id: href.slice(1), element: section, navItem: item });
                }
            }
        });

        // HIGHLIGHT ON SCROLL (IntersectionObserver)
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px', // Trigger when section is in top-middle of view
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navItems.forEach(item => {
                        item.classList.toggle('active', item.getAttribute('href') === '#' + id);
                    });
                }
            });
        }, observerOptions);

        sectionsToWatch.forEach(s => observer.observe(s.element));
    }

    static scrollToSection(id) {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.querySelectorAll('.sidebar-nav-item').forEach(item => {
                if (item.getAttribute('href') === '#' + id) {
                    document.querySelectorAll('.sidebar-nav-item').forEach(n => n.classList.remove('active'));
                    item.classList.add('active');
                }
            });
        }
    }

    static navigateToSettings(id) {
        // Scroll to the dashboard section
        this.scrollToSection(id);

        // Map dashboard sections to settings sections
        const mapping = {
            'section-networth': 'assets',
            'section-income': 'income',
            'section-expenses': 'expenses',
            'section-socialsecurity': 'socialsecurity',
            'section-taxes': 'taxes',
            'section-montecarlo': 'scenarios',
            'section-milestones': 'goals',
            'section-goals': 'goals'
        };

        if (mapping[id]) {
            // Delay slightly to allow scroll to start, then open settings
            setTimeout(() => {
                if (window.openSettings) {
                    window.openSettings(mapping[id]);
                }
            }, 300);
        }
    }

    static toggleSidebar() {
        const sidebar = document.getElementById('mainSidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    }
}
