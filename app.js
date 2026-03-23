/* ========================================
    GREEN KEY CHANGES — Interactive JS
    ======================================== */
(function() {
    'use strict';

    // ========== GA4 EVENT TRACKING HELPER ==========
    function trackEvent(eventName, params) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, params || {});
        }
    }

    // ========== DARK MODE TOGGLE ==========
    const themeToggle = document.querySelector('[data-theme-toggle]');
    const root = document.documentElement;
    let currentTheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.setAttribute('data-theme', currentTheme);
    updateThemeIcon();

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', currentTheme);
            themeToggle.setAttribute('aria-label', 'Switch to ' + (currentTheme === 'dark' ? 'light' : 'dark') + ' mode');
            updateThemeIcon();
            // Redraw sankey with new colors
            drawSankey();
            trackEvent('theme_toggle', { theme: currentTheme });
        });
    }

    function updateThemeIcon() {
        if (!themeToggle) return;
        themeToggle.innerHTML = currentTheme === 'dark'
            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }

    // ========== MOBILE MENU ==========
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileToggle && mobileNav) {
        mobileToggle.addEventListener('click', () => {
            const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
            mobileToggle.setAttribute('aria-expanded', String(!expanded));
            mobileNav.hidden = expanded;
        });
        // Close on nav link click
        mobileNav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.setAttribute('aria-expanded', 'false');
                mobileNav.hidden = true;
            });
        });
    }

    // ========== HEADER SCROLL ==========
    const header = document.getElementById('header');
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY > 50) {
            header.classList.add('header--scrolled');
        } else {
            header.classList.remove('header--scrolled');
        }
        lastScroll = scrollY;
    }, { passive: true });

    // ========== ACTIVE NAV HIGHLIGHTING ==========
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    function updateActiveNav() {
        const scrollY = window.scrollY + 120;
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            if (scrollY >= top && scrollY < top + height) {
                current = section.id;
            }
        });
        navLinks.forEach(link => {
            const href = link.getAttribute('href').replace('#', '');
            link.classList.toggle('active', href === current);
        });
    }
    window.addEventListener('scroll', updateActiveNav, { passive: true });

    // ========== SCROLL DEPTH TRACKING ==========
    const scrollMilestones = { 25: false, 50: false, 75: false, 90: false };
    window.addEventListener('scroll', () => {
        const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
        [25, 50, 75, 90].forEach(milestone => {
            if (scrollPercent >= milestone && !scrollMilestones[milestone]) {
                scrollMilestones[milestone] = true;
                trackEvent('scroll_depth', { percent: milestone });
            }
        });
    }, { passive: true });

    // ========== SECTION VIEW TRACKING ==========
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                trackEvent('section_view', { section_id: entry.target.id, section_title: entry.target.querySelector('h2, h3')?.textContent?.trim() || entry.target.id });
                sectionObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    document.querySelectorAll('section[id]').forEach(section => sectionObserver.observe(section));

    // ========== KPI COUNTER ANIMATION ==========
    function animateCounters() {
        const counters = document.querySelectorAll('[data-count-to]');
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count-to'), 10);
            const from = parseInt(counter.getAttribute('data-count-from') || '0', 10);
            const duration = 1500;
            const startTime = performance.now();
            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const value = Math.round(from + (target - from) * eased);
                counter.textContent = value;
                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            }
            requestAnimationFrame(update);
        });
    }
    // Trigger counters when hero enters viewport
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                heroObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    const heroSection = document.querySelector('.hero');
    if (heroSection) heroObserver.observe(heroSection);

    // ========== REVEAL ON SCROLL ==========
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // ========== ACCORDION ==========
    document.querySelectorAll('.accordion-trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const expanded = trigger.getAttribute('aria-expanded') === 'true';
            const panel = trigger.nextElementSibling;
            trigger.setAttribute('aria-expanded', String(!expanded));
            panel.hidden = expanded;
            trackEvent('accordion_toggle', {
                section_title: trigger.textContent.trim().substring(0, 80),
                action: expanded ? 'collapse' : 'expand'
            });
        });
    });

    // ========== SEARCH ==========
    const searchInput = document.getElementById('search-input');
    const searchCount = document.getElementById('search-count');
    const accordionItems = document.querySelectorAll('.accordion-item');
    let searchDebounceTimer;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            // Clear previous highlights
            document.querySelectorAll('.search-highlight').forEach(el => {
                el.outerHTML = el.textContent;
            });
            if (!query) {
                accordionItems.forEach(item => item.classList.remove('search-hidden'));
                searchCount.textContent = '';
                return;
            }
            let matches = 0;
            accordionItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(query)) {
                    item.classList.remove('search-hidden');
                    matches++;
                } else {
                    item.classList.add('search-hidden');
                }
            });
            searchCount.textContent = matches + ' section' + (matches !== 1 ? 's' : '');
            // Debounced search tracking
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                trackEvent('search', { search_term: query, results_count: matches });
            }, 1000);
        });
    }

    // ========== SANKEY DIAGRAM ==========
    const sankeyContainer = document.getElementById('sankey-diagram');
    const oldSections = [
        { id: 'old-1', label: '1. Environmental Mgmt', short: '1. Env. Mgmt' },
        { id: 'old-2', label: '2. Staff Involvement', short: '2. Staff' },
        { id: 'old-3', label: '3. Guest Information', short: '3. Guest Info' },
        { id: 'old-4', label: '4. Water', short: '4. Water' },
        { id: 'old-5', label: '5. Washing & Cleaning', short: '5. Washing' },
        { id: 'old-6', label: '6. Waste', short: '6. Waste' },
        { id: 'old-7', label: '7. Energy', short: '7. Energy' },
        { id: 'old-8', label: '8. Food & Beverage', short: '8. Food & Bev' },
        { id: 'old-9', label: '9. Indoor Environment', short: '9. Indoor Env' },
        { id: 'old-10', label: '10. Green Areas', short: '10. Green Areas' },
        { id: 'old-11', label: '11. CSR', short: '11. CSR' },
        { id: 'old-12', label: '12. Green Activities', short: '12. Green Act.' },
        { id: 'old-13', label: '13. Administration', short: '13. Admin' }
    ];
    const newSections = [
        { id: 'new-1', label: '1. Sustainable Management', short: '1. Sust. Mgmt' },
        { id: 'new-2', label: '2. Guest Awareness', short: '2. Guest' },
        { id: 'new-3', label: '3. Water', short: '3. Water' },
        { id: 'new-4', label: '4. Energy & Carbon', short: '4. Energy' },
        { id: 'new-5', label: '5. Waste', short: '5. Waste' },
        { id: 'new-6', label: '6. Procurement', short: '6. Procurement' },
        { id: 'new-7', label: '7. Living Environment', short: '7. Living Env' }
    ];
    // Connections: old index -> new index (0-based)
    const connections = [
        { from: 0, to: 0 },
        { from: 1, to: 0 },
        { from: 2, to: 1 },
        { from: 3, to: 2 },
        { from: 4, to: 5 },
        { from: 5, to: 4 },
        { from: 6, to: 3 },
        { from: 7, to: 5 },
        { from: 8, to: 6 },
        { from: 9, to: 6 },
        { from: 10, to: 0 },
        { from: 11, to: 1 },
        { from: 12, to: 5 }
    ];

    function drawSankey() {
        if (!sankeyContainer) return;
        const isMobile = window.innerWidth < 600;
        const w = sankeyContainer.clientWidth || 800;
        const h = isMobile ? 450 : 550;
        const nodeW = isMobile ? 10 : 14;
        const padLeft = isMobile ? 100 : 180;
        const padRight = isMobile ? 100 : 200;
        const padTop = 20;
        const padBottom = 20;
        const usableH = h - padTop - padBottom;

        const oldGap = usableH / oldSections.length;
        const newGap = usableH / newSections.length;
        const oldNodes = oldSections.map((s, i) => ({
            ...s,
            x: padLeft - nodeW,
            y: padTop + i * oldGap + oldGap * 0.25,
            h: oldGap * 0.5,
            side: 'old'
        }));
        const newNodes = newSections.map((s, i) => ({
            ...s,
            x: w - padRight,
            y: padTop + i * newGap + newGap * 0.25,
            h: newGap * 0.5,
            side: 'new'
        }));

        const style = getComputedStyle(document.documentElement);
        const textColor = style.getPropertyValue('--color-text').trim();
        const mutedColor = style.getPropertyValue('--color-text-muted').trim();
        const primaryColor = style.getPropertyValue('--color-primary').trim();
        const borderColor = style.getPropertyValue('--color-border').trim();

        let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="font-family: var(--font-body);">`;

        connections.forEach((conn, ci) => {
            const from = oldNodes[conn.from];
            const to = newNodes[conn.to];
            const x1 = from.x + nodeW;
            const y1 = from.y + from.h / 2;
            const x2 = to.x;
            const y2 = to.y + to.h / 2;
            const cx1 = x1 + (x2 - x1) * 0.4;
            const cx2 = x2 - (x2 - x1) * 0.4;
            svg += `<path class="sankey-link" data-from="${conn.from}" data-to="${conn.to}" d="M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}" stroke="${borderColor}" stroke-width="2" fill="none" opacity="0.4"/>`;
        });

        oldNodes.forEach((n, i) => {
            const labelX = n.x - 8;
            const labelY = n.y + n.h / 2;
            const label = isMobile ? n.short : n.label;
            svg += `<g class="sankey-node sankey-node-old" data-index="${i}" data-side="old">`;
            svg += `<rect x="${n.x}" y="${n.y}" width="${nodeW}" height="${n.h}" rx="3" fill="${mutedColor}" opacity="0.6"/>`;
            svg += `<text x="${labelX}" y="${labelY}" text-anchor="end" dominant-baseline="middle" fill="${textColor}" font-size="${isMobile ? 9 : 12}">${label}</text>`;
            svg += `</g>`;
        });

        newNodes.forEach((n, i) => {
            const labelX = n.x + nodeW + 8;
            const labelY = n.y + n.h / 2;
            const label = isMobile ? n.short : n.label;
            svg += `<g class="sankey-node sankey-node-new" data-index="${i}" data-side="new">`;
            svg += `<rect x="${n.x}" y="${n.y}" width="${nodeW}" height="${n.h}" rx="3" fill="${primaryColor}" opacity="0.8"/>`;
            svg += `<text x="${labelX}" y="${labelY}" text-anchor="start" dominant-baseline="middle" fill="${textColor}" font-size="${isMobile ? 9 : 12}" font-weight="600">${label}</text>`;
            svg += `</g>`;
        });

        svg += `</svg>`;
        sankeyContainer.innerHTML = svg;

        const svgEl = sankeyContainer.querySelector('svg');
        const allNodes = svgEl.querySelectorAll('.sankey-node');
        const allLinks = svgEl.querySelectorAll('.sankey-link');

        function highlightConnections(side, index) {
            const related = connections.filter(c => side === 'old' ? c.from === index : c.to === index);
            const relatedFroms = new Set(related.map(c => c.from));
            const relatedTos = new Set(related.map(c => c.to));
            allNodes.forEach(node => {
                const nSide = node.dataset.side;
                const nIdx = parseInt(node.dataset.index, 10);
                if ((nSide === 'old' && relatedFroms.has(nIdx)) || (nSide === 'new' && relatedTos.has(nIdx)) ||
                    (nSide === side && nIdx === index)) {
                    node.classList.remove('sankey-faded');
                    node.classList.add('sankey-active');
                } else {
                    node.classList.add('sankey-faded');
                    node.classList.remove('sankey-active');
                }
            });
            allLinks.forEach(link => {
                const lFrom = parseInt(link.dataset.from, 10);
                const lTo = parseInt(link.dataset.to, 10);
                if (related.some(r => r.from === lFrom && r.to === lTo)) {
                    link.classList.remove('sankey-faded');
                    link.setAttribute('stroke', primaryColor);
                    link.setAttribute('stroke-width', '3');
                    link.setAttribute('opacity', '0.8');
                } else {
                    link.classList.add('sankey-faded');
                    link.setAttribute('stroke', borderColor);
                    link.setAttribute('stroke-width', '2');
                    link.setAttribute('opacity', '0.1');
                }
            });
        }

        function resetHighlights() {
            allNodes.forEach(node => {
                node.classList.remove('sankey-faded', 'sankey-active');
            });
            allLinks.forEach(link => {
                link.classList.remove('sankey-faded');
                link.setAttribute('stroke', borderColor);
                link.setAttribute('stroke-width', '2');
                link.setAttribute('opacity', '0.4');
            });
        }

        allNodes.forEach(node => {
            node.addEventListener('mouseenter', () => {
                highlightConnections(node.dataset.side, parseInt(node.dataset.index, 10));
            });
            node.addEventListener('mouseleave', resetHighlights);
            node.addEventListener('click', (e) => {
                e.stopPropagation();
                highlightConnections(node.dataset.side, parseInt(node.dataset.index, 10));
                const sectionList = node.dataset.side === 'old' ? oldSections : newSections;
                trackEvent('sankey_interaction', {
                    node_side: node.dataset.side,
                    node_label: sectionList[parseInt(node.dataset.index, 10)].label
                });
            });
        });

        svgEl.addEventListener('click', (e) => {
            if (!e.target.closest('.sankey-node')) {
                resetHighlights();
            }
        });
    }

    drawSankey();
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(drawSankey, 250);
    });

    // ========== TOOLTIP SYSTEM ==========
    function initTooltips() {
        let activeTooltipRow = null;
        function removeActiveTooltip() {
            if (activeTooltipRow) {
                activeTooltipRow.remove();
                activeTooltipRow = null;
            }
        }
        function showTooltip(tr) {
            const tooltipText = tr.getAttribute('data-tooltip');
            if (!tooltipText) return;
            if (activeTooltipRow && activeTooltipRow.previousElementSibling === tr) {
                removeActiveTooltip();
                return;
            }
            removeActiveTooltip();
            const colCount = tr.children.length;
            const tooltipTr = document.createElement('tr');
            tooltipTr.className = 'tooltip-row';
            tooltipTr.innerHTML = '<td colspan="' + colCount + '"><div class="tooltip-content">' + tooltipText + '</div></td>';
            tr.insertAdjacentElement('afterend', tooltipTr);
            activeTooltipRow = tooltipTr;
            trackEvent('tooltip_view', { criteria: tr.querySelector('td')?.textContent?.trim().substring(0, 60) || 'unknown' });
        }
        document.addEventListener('click', function(e) {
            const row = e.target.closest('tr.has-tooltip');
            if (row) {
                e.preventDefault();
                showTooltip(row);
            } else if (!e.target.closest('.tooltip-row')) {
                removeActiveTooltip();
            }
        });
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouchDevice) {
            let hoverTimeout;
            document.addEventListener('mouseover', function(e) {
                const row = e.target.closest('tr.has-tooltip');
                if (row) {
                    clearTimeout(hoverTimeout);
                    hoverTimeout = setTimeout(() => showTooltip(row), 200);
                }
            });
            document.addEventListener('mouseout', function(e) {
                const row = e.target.closest('tr.has-tooltip');
                if (row) {
                    clearTimeout(hoverTimeout);
                    hoverTimeout = setTimeout(() => {
                        const hovered = document.querySelector('.tooltip-row:hover, tr.has-tooltip:hover');
                        if (!hovered) {
                            removeActiveTooltip();
                        }
                    }, 300);
                }
            });
        }
    }
    initTooltips();

    // ========== REVEAL OBSERVER FOR NEW SECTIONS ==========
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObserver.observe(el));

    // ========== ENRICHMENT: FILTER BAR ==========
    const filterBar = document.getElementById('filter-bar');
    const filterCountEl = document.getElementById('filter-count');
    let activeImpactFilter = 'all';
    let activeChangeFilter = 'all';
    if (filterBar) {
        filterBar.addEventListener('click', function(e) {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;
            const toggleGroup = btn.closest('.filter-toggles');
            const filterType = toggleGroup.dataset.filter;
            const value = btn.dataset.value;
            toggleGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
            btn.classList.add('filter-btn--active');
            if (filterType === 'impact') {
                activeImpactFilter = value;
            } else if (filterType === 'change-type') {
                activeChangeFilter = value;
            }
            applyFilters();
            trackEvent('filter_applied', { filter_type: filterType, filter_value: value });
        });
    }

    function applyFilters() {
        const allRows = document.querySelectorAll('.data-table--enriched tbody tr');
        let visible = 0;
        let total = 0;
        allRows.forEach(row => {
            if (!row.dataset.impact) return;
            total++;
            const rowImpact = row.dataset.impact;
            const rowChange = row.dataset.changeType;
            const impactMatch = activeImpactFilter === 'all' || rowImpact === activeImpactFilter;
            const changeMatch = activeChangeFilter === 'all' || rowChange === activeChangeFilter;
            if (impactMatch && changeMatch) {
                row.classList.remove('filter-hidden');
                visible++;
            } else {
                row.classList.add('filter-hidden');
            }
        });
        if (filterCountEl) {
            if (activeImpactFilter === 'all' && activeChangeFilter === 'all') {
                filterCountEl.textContent = '';
            } else {
                filterCountEl.textContent = visible + ' of ' + total + ' criteria';
            }
        }
    }

    // ========== ENRICHMENT: SHOW MORE / LESS ==========
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.show-more-btn');
        if (!btn) return;
        const wrapper = btn.closest('.details-text');
        if (!wrapper) return;
        const shortEl = wrapper.querySelector('.details-short');
        const fullEl = wrapper.querySelector('.details-full');
        if (!shortEl || !fullEl) return;
        if (fullEl.hidden) {
            shortEl.hidden = true;
            fullEl.hidden = false;
            btn.textContent = 'Show less';
            trackEvent('show_more', { criteria: wrapper.closest('tr')?.querySelector('td')?.textContent?.trim().substring(0, 60) || 'unknown' });
        } else {
            shortEl.hidden = false;
            fullEl.hidden = true;
            btn.textContent = 'Show more';
        }
    });

    // ========== ENRICHMENT: COUNTER ANIMATION FOR NUMBERS DASHBOARD ==========
    const numbersDashboard = document.getElementById('by-the-numbers');
    if (numbersDashboard) {
        const numbersObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counters = numbersDashboard.querySelectorAll('[data-count-to]');
                    counters.forEach(counter => {
                        if (counter.dataset.animated) return;
                        counter.dataset.animated = 'true';
                        const target = parseInt(counter.getAttribute('data-count-to'), 10);
                        const from = parseInt(counter.getAttribute('data-count-from') || '0', 10);
                        const duration = 1200;
                        const startTime = performance.now();
                        function update(currentTime) {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            const eased = 1 - Math.pow(1 - progress, 3);
                            const value = Math.round(from + (target - from) * eased);
                            counter.textContent = value;
                            if (progress < 1) {
                                requestAnimationFrame(update);
                            }
                        }
                        requestAnimationFrame(update);
                    });
                    numbersObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        numbersObserver.observe(numbersDashboard);
    }

    // ========== ENRICHMENT: UPDATED SEARCH ==========
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = searchInput.value.trim().toLowerCase();
            document.querySelectorAll('.search-highlight').forEach(el => {
                el.outerHTML = el.textContent;
            });
            if (!query) {
                accordionItems.forEach(item => item.classList.remove('search-hidden'));
                document.querySelectorAll('.data-table--enriched tbody tr').forEach(row => {
                    row.classList.remove('search-hidden-row');
                });
                searchCount.textContent = '';
                applyFilters();
                return;
            }
            let matches = 0;
            accordionItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(query)) {
                    item.classList.remove('search-hidden');
                    matches++;
                } else {
                    item.classList.add('search-hidden');
                }
            });
            searchCount.textContent = matches + ' section' + (matches !== 1 ? 's' : '');
        });
    }

    // ========== NAV LINK TRACKING ==========
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            trackEvent('nav_click', { destination: link.getAttribute('href'), label: link.textContent.trim() });
        });
    });

    // ========== OUTBOUND LINK TRACKING ==========
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        if (!link.href.includes(window.location.hostname)) {
            link.addEventListener('click', () => {
                trackEvent('outbound_click', { url: link.href, link_text: link.textContent.trim().substring(0, 50) });
            });
        }
    });

    // ========== TIME ON PAGE TRACKING ==========
    let engagementStart = Date.now();
    window.addEventListener('beforeunload', () => {
        const timeOnPage = Math.round((Date.now() - engagementStart) / 1000);
        trackEvent('page_engagement', { time_on_page_seconds: timeOnPage });
    });

})();
