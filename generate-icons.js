// ============================================
// EMERALD KING - PWA ICON GENERATOR
// Resizes master-icon.png to all required sizes
// Requires: npm install sharp
// Usage: node generate-icons.js
// ============================================

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    // Source file
    masterIcon: path.join(__dirname, 'master-icon.png'),
    
    // Output directory
    outputDir: path.join(__dirname, 'icons'),
    
    // Background color for padding (emerald theme)
    backgroundColor: { r: 1, g: 23, b: 19, alpha: 1 },
    
    // Icon sizes to generate
    sizes: [72, 96, 128, 144, 152, 180, 192, 384, 512],
    
    // Purpose tags
    purposes: ['any', 'maskable']
};

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

async function generateIcons() {
    try {
        // Step 1: Check if master icon exists
        if (!fs.existsSync(CONFIG.masterIcon)) {
            console.error('❌ master-icon.png not found in root directory!');
            console.error('💡 Please add a 1024x1024 PNG file named master-icon.png');
            process.exit(1);
        }

        // Step 2: Create output directory if it doesn't exist
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir, { recursive: true });
            console.log('📁 Created /icons/ directory');
        }

        console.log('🎨 Generating PWA icons...');
        console.log('📐 Source: master-icon.png');
        console.log('📂 Output: /icons/');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Step 3: Generate each icon size
        const generatedFiles = [];

        for (const size of CONFIG.sizes) {
            const outputFile = path.join(CONFIG.outputDir, `icon-${size}x${size}.png`);
            
            await sharp(CONFIG.masterIcon)
                .resize(size, size, {
                    fit: 'contain',
                    background: CONFIG.backgroundColor
                })
                .png({ quality: 90, compressionLevel: 6 })
                .toFile(outputFile);
            
            generatedFiles.push({
                size: size,
                file: `icon-${size}x${size}.png`,
                path: outputFile
            });
            
            console.log(`  ✅ ${size}x${size} → icons/icon-${size}x${size}.png`);
        }

        // Step 4: Generate maskable icon with safe zone padding
        const maskableSize = 512;
        const maskableFile = path.join(CONFIG.outputDir, `maskable-icon-${maskableSize}x${maskableSize}.png`);
        
        // Maskable icons need 40% padding (80% safe zone)
        const safeZoneSize = Math.floor(maskableSize * 0.8);
        const padding = Math.floor((maskableSize - safeZoneSize) / 2);
        
        await sharp(CONFIG.masterIcon)
            .resize(safeZoneSize, safeZoneSize, {
                fit: 'contain',
                background: CONFIG.backgroundColor
            })
            .extend({
                top: padding,
                bottom: padding,
                left: padding,
                right: padding,
                background: CONFIG.backgroundColor
            })
            .png({ quality: 90, compressionLevel: 6 })
            .toFile(maskableFile);
        
        console.log(`  ✅ ${maskableSize}x${maskableSize} → icons/maskable-icon-${maskableSize}x${maskableSize}.png (maskable)`);
        
        // Step 5: Generate badge icon for notifications
        const badgeFile = path.join(CONFIG.outputDir, 'badge-72x72.png');
        await sharp(CONFIG.masterIcon)
            .resize(72, 72, {
                fit: 'cover',
                background: CONFIG.backgroundColor
            })
            .png({ quality: 90 })
            .toFile(badgeFile);
        
        console.log(`  ✅ 72x72 → icons/badge-72x72.png (notification badge)`);
        
        // Step 6: Generate shortcut icons
        const shortcuts = ['games', 'deposit', 'profile'];
        for (const shortcut of shortcuts) {
            const shortcutFile = path.join(CONFIG.outputDir, `shortcut-${shortcut}-96x96.png`);
            await sharp(CONFIG.masterIcon)
                .resize(96, 96, {
                    fit: 'contain',
                    background: CONFIG.backgroundColor
                })
                .png({ quality: 85 })
                .toFile(shortcutFile);
            
            console.log(`  ✅ 96x96 → icons/shortcut-${shortcut}-96x96.png`);
        }

        // Step 7: Generate favicon (multi-size .ico not supported by sharp, use PNG)
        const faviconFile = path.join(__dirname, 'favicon.png');
        await sharp(CONFIG.masterIcon)
            .resize(32, 32, {
                fit: 'cover',
                background: CONFIG.backgroundColor
            })
            .png({ quality: 95 })
            .toFile(faviconFile);
        
        console.log(`  ✅ 32x32 → favicon.png`);
        
        // Step 8: Generate Apple touch icon
        const appleIconFile = path.join(__dirname, 'apple-touch-icon.png');
        await sharp(CONFIG.masterIcon)
            .resize(180, 180, {
                fit: 'contain',
                background: CONFIG.backgroundColor
            })
            .png({ quality: 90 })
            .toFile(appleIconFile);
        
        console.log(`  ✅ 180x180 → apple-touch-icon.png`);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 All PWA icons generated successfully!');
        console.log(`📁 ${generatedFiles.length + 6} files created in /icons/`);
        console.log('');
        console.log('📋 Next steps:');
        console.log('  1. Add <link rel="manifest" href="/manifest.json"> to your HTML');
        console.log('  2. Add <link rel="apple-touch-icon" href="/apple-touch-icon.png">');
        console.log('  3. Add <link rel="icon" href="/favicon.png">');
        console.log('  4. Deploy manifest.json with the generated icons array');
        
        // Step 9: Output manifest.json icons array
        console.log('');
        console.log('📋 manifest.json icons array:');
        console.log(generateManifestIconsJSON());
        
    } catch (error) {
        console.error('❌ Icon generation failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// ============================================
// MANIFEST ICONS JSON GENERATOR
// ============================================

function generateManifestIconsJSON() {
    const icons = [];
    
    // Standard icons
    CONFIG.sizes.forEach(size => {
        icons.push({
            src: `/icons/icon-${size}x${size}.png`,
            sizes: `${size}x${size}`,
            type: 'image/png',
            purpose: 'any maskable'
        });
    });
    
    // Dedicated maskable icon
    icons.push({
        src: '/icons/maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
    });
    
    return JSON.stringify(icons, null, 2);
}

// ============================================
// EXPORT FOR USE IN OTHER SCRIPTS
// ============================================

module.exports = {
    generateIcons,
    generateManifestIconsJSON,
    CONFIG
};

// ============================================
// RUN DIRECTLY IF CALLED FROM COMMAND LINE
// ============================================

if (require.main === module) {
    generateIcons();
}

console.log('🖼️ PWA Icon Generator Ready');
console.log('📐 Run: node generate-icons.js');
