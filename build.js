if(process.env.NODE_ENV === undefined) throw new Error("NODE_ENV not set");

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Read version from package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const version = packageJson.version;
const isDev = process.env.NODE_ENV === 'development';

// Build options
const buildOptions = {
    entryPoints: ['src/predbat-card.ts'],
    bundle: true,
    outfile: 'dist/Predbat-Table-Card-Next.js',
    format: 'esm',
    target: ['es2020'],
    define: {
        'process.env.PREDBAT_VERSION': JSON.stringify(version),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    },
    banner: {
        js: `// Predbat Table Card v${version}\n`
    },
    minify: !isDev,
    sourcemap: true,
    external: ['lit', '@lit', 'zod', 'home-assistant-js-websocket'],
    logLevel: 'info'
};

// Build
esbuild.build(buildOptions)
    .catch((error) => {
        console.error('❌ Build failed:', error);
        process.exit(1);
    });