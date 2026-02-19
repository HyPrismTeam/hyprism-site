// github repo info.
const OWNER = 'HyPrismTeam';
const REPO = 'HyPrism';

// turns big numbers into readable ones.
function fmt(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toLocaleString();
}


// ---- mobile nav ----
// toggles the hamburger menu.
function burger() {
    const btn = document.getElementById('menu-toggle');
    const nav = document.getElementById('mobile-nav');
    if (!btn || !nav) return;

    btn.addEventListener('click', () => nav.classList.toggle('mobile-nav--open'));

    nav.querySelectorAll('.mobile-nav__link').forEach(a => {
        a.addEventListener('click', () => nav.classList.remove('mobile-nav--open'));
    });
}


// ---- smooth scrolling (lenis) ----
function initLenis() {
    if (typeof Lenis === 'undefined') return;

    const lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // hook up anchor links to lenis
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = this.getAttribute('href');
            if (target && target !== '#') {
                lenis.scrollTo(target);
            }
        });
    });
}


// ---- grid background hover effect ----
// lights up 3d grid tiles near your cursor.
function gridBackground() {
    const grid = document.getElementById('grid-animation');
    if (!grid) return;

    // responsive grid size: smaller on mobile to save resources
    const isMobile = window.innerWidth < 768;
    // reduced grid resolution for better performance while maintaining look
    const GRID_SIZE = isMobile ? 12 : 20;
    grid.style.setProperty('--grid-size', GRID_SIZE);

    const TILE_COUNT = GRID_SIZE * GRID_SIZE;
    const tiles = [];

    let resizeTimeout = null;

    function buildGrid() {
        grid.innerHTML = '';
        tiles.length = 0;
        for (let i = 0; i < TILE_COUNT; i++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            grid.appendChild(tile);
            tiles.push(tile);
        }
    }

    buildGrid();

    // just for resizing logic if needed
    function recalcGridMetrics() {
       // logic for recalculating metrics if needed for static grid
    }

    window.addEventListener('resize', () => {
         // debounce resize
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            recalcGridMetrics();
        }, 100);
    }, { passive: true });

    recalcGridMetrics();
}


// ---- 3d card tilt ----
// cards tilt toward your mouse. fun to play with.
// optimized: uses IntersectionObserver to only animate visible cards.
function cardTilt() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        return;
    }

    const cards = document.querySelectorAll('[data-tilt]');

    // only listen to events on cards that are actually on screen
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('tilt-active');
            } else {
                entry.target.classList.remove('tilt-active');
                // reset position if it goes off screen
                entry.target.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(card => {
        observer.observe(card);

        let raf = 0;
        let px = 0;
        let py = 0;

        const updateTilt = () => {
            // double check if active to be safe
            if (!card.classList.contains('tilt-active')) return;

            const rect = card.getBoundingClientRect();
            const x = px - rect.left;
            const y = py - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const rotateX = ((y - cy) / cy) * -8;
            const rotateY = ((x - cx) / cx) * 8;

            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
            raf = 0;
        };

        card.addEventListener('pointermove', e => {
            if (!card.classList.contains('tilt-active')) return;

            px = e.clientX;
            py = e.clientY;
            if (!raf) {
                raf = requestAnimationFrame(updateTilt);
            }
        });

        card.addEventListener('pointerleave', () => {
            card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
            if (raf) {
                cancelAnimationFrame(raf);
                raf = 0;
            }
        });
    });
}
// ---- count-up animation ----
// numbers roll up from zero when visible.
function countUp() {
    const el = document.getElementById('total-downloads');
    if (!el) return;

    // ensures user sees the number even if animation glitches or 0.
    const run = () => {
        const target = parseInt(el.dataset.target || '0', 10);
        if (target <= 0) {
            el.textContent = target === 0 ? '0' : '?';
            return;
        }
        animateCount(el, target);
    };

    let counted = false;
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !counted) {
                counted = true;
                run();
            }
        });
    }, { threshold: 0.5 }); // changed threshold for better mobile detection

    observer.observe(el);
}

function animateCount(el, target) {
    const duration = 1500;
    const start = performance.now();

    function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease out cubic.
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);
        el.textContent = fmt(current);

        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            el.textContent = fmt(target);
            el.classList.add('count-done');
        }
    }

    requestAnimationFrame(tick);
}


// ---- download count from github ----
// fetches total downloads and triggers count-up.
// optimized: cache api response to avoid rate limits and faster load.
async function downloads() {
    const CACHE_KEY = 'hyprism_downloads_v2'; // bumped version to force refresh
    const CACHE_TIME = 3600000; // 1 hour

    try {
        let n = 0;
        const now = Date.now();
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');

        if (cached.data && (now - cached.time < CACHE_TIME)) {
            console.log('Using cached download count:', cached.data);
            n = cached.data;
        } else {
            console.log('Fetching download count from GitHub...');
            const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases`);
            if (!r.ok) {
                console.error('GitHub API error:', r.status);
                throw new Error('API Error');
            }
            const data = await r.json();

            // Log data for debugging
            console.log('GitHub Releases data:', data);

            if (Array.isArray(data)) {
                 data.forEach(rel => {
                    if (rel.assets) {
                        rel.assets.forEach(a => n += a.download_count);
                    }
                 });
            }

            console.log('Total downloads calculated:', n);
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data: n, time: now }));
        }

        const el = document.getElementById('total-downloads');
        if (el) {
            el.dataset.target = n;
            // If n is 0, just show 0, otherwise let countUp handle it
            // countUp only runs if target > 0.
             if (n > 0) {
                 // Trigger countUp manually if observer already fired or stuck
                 // But typically countUp waits for intersection.
                 // We need to make sure countUp picks up the new data-target
                 // The observer in countUp() runs once on load/intersection.
                 // If data-target changes AFTER intersection, it might not re-run if 'counted' is true?
                 // Wait, countUp() is called AFTER downloads() resolves in DOMContentLoaded.
             } else {
                 el.textContent = '0';
             }
        }
    } catch (e) {
        console.error('Error fetching downloads:', e);
        const el = document.getElementById('total-downloads');
        if (el) el.textContent = '?';
    }
}


// ---- download links ----
// resolves latest release urls from github.
// optimized: cache links to avoid flicker and network requests.
async function links() {
    const CACHE_KEY = 'hyprism_releases';
    const CACHE_TIME = 3600000; // 1 hour

    const names = {
        win: 'HyPrism.exe',
        mac: 'HyPrism-macOS-arm64.dmg',
        appimg: 'HyPrism-x86_64.AppImage',
        flat: 'HyPrism.flatpak',
        tar: 'HyPrism-linux-x86_64.tar.gz'
    };

    const base = `https://github.com/${OWNER}/${REPO}/releases/latest/download/`;
    const urls = { win: base + names.win, mac: base + names.mac, linux: base + names.appimg };

    try {
        const now = Date.now();
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        let rel;

        if (cached.data && (now - cached.time < CACHE_TIME)) {
            rel = cached.data;
        } else {
            const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=1`);
            if (!r.ok) throw 0;
            const data = await r.json();
            rel = data[0];
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data: rel, time: now }));
        }

        if (!rel) throw 0;
        const a = rel.assets;

        const w = a.find(x => x.name === names.win);
        const m = a.find(x => x.name === names.mac);
        const l = a.find(x => x.name === names.appimg)
               || a.find(x => x.name === names.flat)
               || a.find(x => x.name === names.tar);

        if (w) urls.win = w.browser_download_url;
        if (m) urls.mac = m.browser_download_url;
        if (l) urls.linux = l.browser_download_url;
    } catch (e) {
        console.warn('github api issue or cache miss, using fallbacks.');
    }

    const set = (id, url) => { const el = document.getElementById(id); if (el) el.href = url; };
    set('download-windows', urls.win);
    set('download-macos', urls.mac);
    set('download-linux', urls.linux);
}


// ---- boot everything ----
document.addEventListener('DOMContentLoaded', () => {
    initLenis();
    burger();
    gridBackground();
    cardTilt();

    // fetch data then setup count-up.
    downloads().then(() => countUp());
    links();
});
