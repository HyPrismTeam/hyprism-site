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
        lerp: 0.08,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
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
                entry.target.style.transform =
                    'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
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

            card.style.transform =
                `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
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
            card.style.transform =
                'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
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
    }, { threshold: 0.5 });

    observer.observe(el);
}

function animateCount(el, target) {
    const duration = 1500;
    const start = performance.now();

    function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
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


// ---- download links ----
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://api.github.com/repos/HyPrismTeam/HyPrism/releases';

    const btnWindows = document.getElementById('download-windows');
    const btnMac = document.getElementById('download-macos');
    const btnLinux = document.getElementById('download-linux');
    const totalDownloadsDisplay = document.getElementById('total-downloads');

    async function fetchReleaseData() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Failed to fetch GitHub API');

            const data = await response.json(); // data is an array of releases

            let totalCount = 0;

            data.forEach(release => {
                if (!release.assets) return;

                release.assets.forEach(asset => {
                    const name = asset.name.toLowerCase();
                    const downloadUrl = asset.browser_download_url;

                    totalCount += asset.download_count;

                    if (name.endsWith('.exe')) {
                        btnWindows.href = downloadUrl;
                    } else if (name.endsWith('.dmg')) {
                        btnMac.href = downloadUrl;
                    } else if (name.endsWith('.appimage')) {
                        btnLinux.href = downloadUrl;
                    }
                });
            });

            if (totalDownloadsDisplay) {
                animateCount(totalDownloadsDisplay, totalCount);
            }

            console.log('Download statistics loaded:', totalCount);

        } catch (error) {
            console.error('Failed to fetch downloads:', error);
            setFallbackLinks();
        }
    }

    function animateCount(el, target) {
        let current = 0;
        const speed = 20;
        const increment = Math.ceil(target / 50);

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                el.innerText = target.toLocaleString();
                clearInterval(timer);
            } else {
                el.innerText = current.toLocaleString();
            }
        }, speed);
    }

    function setFallbackLinks() {
        const repoUrl = "https://github.com/HyPrismTeam/HyPrism/releases";
        [btnWindows, btnMac, btnLinux].forEach(btn => {
            if (btn && btn.getAttribute('href') === '#') btn.href = repoUrl;
        });
    }

    fetchReleaseData();
});


const menuToggle = document.getElementById('menu-toggle');
const mobileNav = document.getElementById('mobile-nav');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
}


async function fetchStats() {
    try {
        const response = await fetch(
            'https://api.github.com/repos/HyPrismTeam/HyPrism/releases/latest'
        );
        const data = await response.json();

        if (!data || !data.assets) return;

        data.assets.forEach(asset => {
            const name = asset.name.toLowerCase();
            const url = asset.browser_download_url;

            if (name.includes('win') && name.endsWith('.exe')) {
                const btn = document.getElementById('download-windows');
                if (btn) btn.href = url;
            }

            if (name.includes('mac') && name.endsWith('.dmg')) {
                const btn = document.getElementById('download-macos');
                if (btn) btn.href = url;
            }

            if (name.includes('linux') && name.endsWith('.appimage')) {
                const btn = document.getElementById('download-linux');
                if (btn) btn.href = url;
            }
        });
    } catch (error) {
        console.error('Failed to fetch download links:', error);
    }
}
fetchStats();


// ---- boot everything ----
document.addEventListener('DOMContentLoaded', () => {
    initLenis();
    burger();
    cardTilt();
    countUp();
});
