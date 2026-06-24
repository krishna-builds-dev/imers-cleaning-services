/**
 * Replaces all Material Symbols Outlined icon-font spans with inline SVGs.
 * Also adds font preloads for critical subsets.
 *
 * Run: node scripts/optimize-icons.js
 */
const fs = require('fs');
const path = require('path');

// Official Material Icons SVG inner content (baseline filled style, 24x24 viewBox)
const iconInner = {
    menu: '<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>',
    close: '<path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"/>',
    cleaning_services: '<path d="M16 11h-1V3c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v8H8c-2.76 0-5 2.24-5 5v7h18v-7c0-2.76-2.24-5-5-5zm3 10h-2v-3c0-.55-.45-1-1-1s-1 .45-1 1v3h-2v-3c0-.55-.45-1-1-1s-1 .45-1 1v3H9v-3c0-.55-.45-1-1-1s-1 .45-1 1v3H5v-5c0-1.65 1.35-3 3-3h8c1.65 0 3 1.35 3 3v5z"/>',
    info: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>',
    timeline: '<path d="M23 8c0 1.1-.9 2-2 2c-.18 0-.35-.02-.51-.07l-3.56 3.55c.05.16.07.34.07.52c0 1.1-.9 2-2 2s-2-.9-2-2c0-.18.02-.36.07-.52l-2.55-2.55c-.16.05-.34.07-.52.07s-.36-.02-.52-.07l-4.55 4.56c.05.16.07.33.07.51c0 1.1-.9 2-2 2s-2-.9-2-2s.9-2 2-2c.18 0 .35.02.51.07l4.56-4.55C8.02 9.36 8 9.18 8 9c0-1.1.9-2 2-2s2 .9 2 2c0 .18-.02.36-.07.52l2.55 2.55c.16-.05.34-.07.52-.07s.36.02.52.07l3.55-3.56C19.02 8.35 19 8.18 19 8c0-1.1.9-2 2-2s2 .9 2 2z"/>',
    grid_view: '<path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z"/>',
    mail: '<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5l-8-5V6l8 5l8-5v2z"/>',
    call: '<path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56c-.36-.12-.77-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02c-.37-1.11-.56-2.3-.56-3.53c0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99C3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>',
    location_on: '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5z"/>',
    arrow_forward: '<path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>',
    biotech: '<path d="M7 19c-1.1 0-2 .9-2 2h14c0-1.1-.9-2-2-2h-4v-2h3c1.1 0 2-.9 2-2h-8c-1.66 0-3-1.34-3-3c0-1.09.59-2.04 1.46-2.56C8.17 9.03 8 8.54 8 8c0-.21.04-.42.09-.62A5.01 5.01 0 0 0 5 12c0 2.76 2.24 5 5 5v2H7z"/><path d="M10.56 5.51C11.91 5.54 13 6.64 13 8c0 .75-.33 1.41-.85 1.87l.59 1.62l.94-.34l.34.94l1.88-.68l-.34-.94l.94-.34l-2.74-7.53l-.94.34l-.34-.94l-1.88.68l.34.94l-.94.35l.56 1.54z"/><circle cx="10.5" cy="8" r="1.5"/>',
    verified_user: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4l1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>',
    forum: '<path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>',
    fact_check: '<path d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM10 17H5v-2h5v2zm0-4H5v-2h5v2zm0-4H5V7h5v2zm4.82 6L12 12.16l1.41-1.41l1.41 1.42L17.99 9l1.42 1.42L14.82 15z"/>',
    verified: '<path d="M23 12l-2.44-2.79l.34-3.69l-3.61-.82l-1.89-3.2L12 2.96L8.6 1.5L6.71 4.69L3.1 5.5l.34 3.7L1 12l2.44 2.79l-.34 3.7l3.61.82L8.6 22.5l3.4-1.47l3.4 1.46l1.89-3.19l3.61-.82l-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81l1.48-1.48l2.32 2.33l5.85-5.87l1.48 1.48l-7.33 7.35z"/>'
};

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

let count = 0;

// Replace all <span class="...material-symbols-outlined...">icon_name</span>
html = html.replace(/<span\s+class="([^"]*\bmaterial-symbols-outlined\b[^"]*)">([\w_]+)<\/span>/g, (match, classes, iconName) => {
    const inner = iconInner[iconName];
    if (!inner) {
        console.warn(`  WARNING: Unknown icon "${iconName}", skipping.`);
        return match;
    }

    // Determine SVG size from Tailwind font-size classes
    let size = 24;
    if (classes.includes('text-3xl')) size = 30;
    const customMatch = classes.match(/text-\[(\d+)px\]/);
    if (customMatch) size = parseInt(customMatch[1], 10);

    // Strip icon-font-specific classes, keep everything else (color, visibility, etc.)
    let remaining = classes
        .replace(/\bmaterial-symbols-outlined\b/g, '')
        .replace(/\btext-3xl\b/g, '')
        .replace(/\btext-\[\d+px\]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

    const classAttr = remaining ? ` class="${remaining}"` : '';

    count++;
    return `<svg${classAttr} xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${inner}</svg>`;
});

console.log(`Replaced ${count} icon-font spans with inline SVGs.`);

// ── Add font preloads in <head> ──────────────────────────────────────────
// Critical latin subsets that render above-the-fold text:
//   Font-7  = Inter 400 latin      (body text)
//   Font-45 = Manrope 700 latin    (display headings)
//   Font-39 = Manrope 600 latin    (sub-headings)
const preloads = [
    '    <!-- Preload critical font subsets (above-the-fold text) -->',
    '    <link rel="preload" href="/assets/fonts/Font-7.woff2" as="font" type="font/woff2" crossorigin>',
    '    <link rel="preload" href="/assets/fonts/Font-45.woff2" as="font" type="font/woff2" crossorigin>',
    '    <link rel="preload" href="/assets/fonts/Font-39.woff2" as="font" type="font/woff2" crossorigin>',
].join('\n');

html = html.replace(
    '    <link href="./dist/output.css" rel="stylesheet" />',
    preloads + '\n    <link href="./dist/output.css" rel="stylesheet" />'
);
console.log('Added font preload links.');

// ── Scope IntersectionObserver to below-the-fold sections ────────────────
// Before: '.group.relative' also matches service cards that *could* be
//         partially visible on very tall mobile viewports.
// After:  Scope to #services explicitly so the hero is never touched.
const oldSelector = `'.group.relative, #process .relative, #portfolio .group, #contact .bg-surface-container'`;
const newSelector = `'#services .group.relative, #process .relative, #portfolio .group, #contact .bg-surface-container'`;
if (html.includes(oldSelector)) {
    html = html.replace(oldSelector, newSelector);
    console.log('Scoped IntersectionObserver to below-the-fold sections.');
} else {
    console.log('IntersectionObserver selector not found (already updated?).');
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('\nindex.html saved.');
