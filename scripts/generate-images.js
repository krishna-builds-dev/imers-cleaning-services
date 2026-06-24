const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../assets/images');
const outputDir = path.join(__dirname, '../assets/images');

const widths = [400, 600, 800, 1000];

async function processImages() {
    const files = fs.readdirSync(inputDir);

    for (const file of files) {
        if (!file.endsWith('.avif') || file.includes('-400w.avif') || file.includes('-600w.avif') || file.includes('-800w.avif') || file.includes('-1000w.avif')) {
            continue;
        }

        const filePath = path.join(inputDir, file);
        const fileNameWithoutExt = path.parse(file).name;

        console.log(`Processing ${file}...`);

        for (const width of widths) {
            const outputFilePath = path.join(outputDir, `${fileNameWithoutExt}-${width}w.avif`);

            // Only generate if it doesn't already exist
            if (!fs.existsSync(outputFilePath) || true) { // Force overwrite for new quality
                try {
                    await sharp(filePath)
                        .resize({ width })
                        .avif({ quality: 60 }) // Increased compression
                        .toFile(outputFilePath);
                    console.log(`  Created ${outputFilePath}`);
                } catch (err) {
                    console.error(`  Error creating ${width}w variant for ${file}:`, err);
                }
            } else {
                console.log(`  ${width}w variant already exists. Skipping.`);
            }
        }
    }
    console.log('Image optimization complete!');
}

processImages();
