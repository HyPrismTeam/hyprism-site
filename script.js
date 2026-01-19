const GITHUB_OWNER = 'yyyumeniku';
const GITHUB_REPO = 'HyPrism';

// Truncate long names
function truncateName(name, maxLen = 10) {
    return name.length > maxLen ? name.slice(0, maxLen) + '...' : name;
}

// Format number with K/M suffix
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
}

// Fetch and display contributors
async function fetchContributors() {
    const container = document.getElementById('contributors');
    
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contributors`);
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const contributors = await response.json();
        
        container.innerHTML = contributors.map(c => `
            <a href="${c.html_url}" target="_blank" rel="noopener" class="contributor" title="${c.login} - ${c.contributions} contributions">
                <img src="${c.avatar_url}" alt="${c.login}" loading="lazy">
                <span>${truncateName(c.login)}</span>
            </a>
        `).join('');
        
    } catch (error) {
        container.innerHTML = '<div class="loading">Could not load contributors</div>';
    }
}

// Fetch download count
async function fetchDownloadCount() {
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const releases = await response.json();
        let total = 0;
        releases.forEach(r => r.assets.forEach(a => total += a.download_count));
        
        document.getElementById('total-downloads').textContent = formatNumber(total);
    } catch (error) {
        document.getElementById('total-downloads').textContent = '—';
    }
}

// Fetch download URLs
async function fetchDownloads() {
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`);
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const release = await response.json();
        const assets = release.assets;
        
        // Windows
        const win = assets.find(a => a.name.endsWith('.exe'));
        if (win) document.getElementById('download-windows').href = win.browser_download_url;
        
        // macOS
        const mac = assets.find(a => a.name.endsWith('.dmg'));
        if (mac) document.getElementById('download-macos').href = mac.browser_download_url;
        
        // Linux
        const linux = assets.find(a => a.name.endsWith('.AppImage') || a.name.endsWith('.flatpak'));
        if (linux) document.getElementById('download-linux').href = linux.browser_download_url;
        
    } catch (error) {
        // Fallback to releases page
        const fallback = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;
        document.getElementById('download-windows').href = fallback;
        document.getElementById('download-macos').href = fallback;
        document.getElementById('download-linux').href = fallback;
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    fetchContributors();
    fetchDownloads();
    fetchDownloadCount();
});
