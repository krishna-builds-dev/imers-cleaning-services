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

function fetchIcon(name) {
    return new Promise((resolve, reject) => {
        // We try the community-maintained material-icons github pages as it has a clean and predictable URL structure
        const url = `https://material-icons.github.io/material-icons/svg/${name}/baseline.svg`;
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                // If baseline fails, try outline or another source
                resolve({ name, error: `Status ${res.statusCode}` });
                return;
            }
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const match = data.match(/d="([^"]+)"/);
                if (match) {
                    resolve({ name, path: match[1] });
                } else {
                    resolve({ name, error: 'No path found' });
                }
            });
        }).on('error', (err) => {
            resolve({ name, error: err.message });
        });
    });
}

async function main() {
    console.log('Fetching SVG paths...');
    const results = await Promise.all(icons.map(fetchIcon));
    console.log(JSON.stringify(results, null, 2));
}

main();
