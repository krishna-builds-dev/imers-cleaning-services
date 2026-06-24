const fs = require('fs');
const https = require('https');

const icons = [
    'menu',
    'close',
    'cleaning_services',
    'info',
    'timeline',
    'grid_view',
    'mail',
    'call',
    'location_on',
    'arrow_forward',
    'biotech',
    'verified_user',
    'forum',
    'fact_check',
    'verified'
];

function fetchFullSvg(name) {
    return new Promise((resolve, reject) => {
        const url = `https://material-icons.github.io/material-icons/svg/${name}/baseline.svg`;
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                resolve({ name, error: `Status ${res.statusCode}` });
                return;
            }
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                // Remove xml headers, keep the svg content itself clean
                const svgClean = data.replace(/<\?xml[^>]*>/g, '').replace(/<!DOCTYPE[^>]*>/g, '').trim();
                resolve({ name, svg: svgClean });
            });
        }).on('error', (err) => {
            resolve({ name, error: err.message });
        });
    });
}

async function main() {
    const results = await Promise.all(icons.map(fetchFullSvg));
    for (const r of results) {
        console.log(`=== ${r.name} ===`);
        console.log(r.svg || `ERROR: ${r.error}`);
        console.log('');
    }
}

main();
