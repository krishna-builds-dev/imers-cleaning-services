const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '../assets/fonts');
if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
}

const urls = [
    'https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block'
];

async function fetchCss(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function downloadFont(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            const file = fs.createWriteStream(filepath);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', reject);
    });
}

async function main() {
    let combinedCss = '';
    let counter = 1;

    for (const url of urls) {
        console.log('Fetching CSS from', url);
        let css = await fetchCss(url);
        
        // Match url(https://...)
        const regex = /url\((https:\/\/[^\)]+)\)/g;
        let match;
        
        while ((match = regex.exec(css)) !== null) {
            const fontUrl = match[1];
            
            // Generate a simple unique filename
            const isMaterial = fontUrl.includes('material');
            const fontName = isMaterial ? 'MaterialSymbolsOutlined' : 'Font';
            const ext = fontUrl.split('.').pop() || 'woff2';
            const filename = `${fontName}-${counter++}.${ext}`;
            const filepath = path.join(fontsDir, filename);
            
            console.log('Downloading', fontUrl, 'to', filename);
            await downloadFont(fontUrl, filepath);
            
            // Replace in CSS relative path from output.css or index.html
            // We'll put the css in src/fonts.css, which is compiled to dist/output.css
            // So relative path from dist/output.css to assets/fonts is ../assets/fonts/
            css = css.replace(fontUrl, `../assets/fonts/${filename}`);
        }
        
        combinedCss += css + '\n';
    }
    
    fs.writeFileSync(path.join(__dirname, '../src/fonts.css'), combinedCss);
    console.log('Fonts downloaded and src/fonts.css created!');
}

main();
