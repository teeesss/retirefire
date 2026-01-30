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

        // Update active nav item on scroll
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            let scrollTimeout;
            mainContent.addEventListener('scroll', function () {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    const scrollTop = mainContent.scrollTop;
                    let currentSection = sections[0];

                    for (const section of sections) {
                        if (section.element.offsetTop <= scrollTop + 100) {
                            currentSection = section;
                        }
                    }

                    if (currentSection) {
                        navItems.forEach(n => n.classList.remove('active'));
                        currentSection.navItem.classList.add('active');
                    }
                }, 100);
            });
        }
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

    static toggleSidebar() {
        const sidebar = document.getElementById('mainSidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    }
}
