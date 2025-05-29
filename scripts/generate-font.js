import { nodeResolve } from '@rollup/plugin-node-resolve';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const fontPath = resolve('./node_modules/@fontsource/inter/files/inter-latin-800-normal.woff');
const threeFontConverter = require('three/examples/jsm/loaders/FontLoader.js').FontLoader;
const TextToSVG = require('text-to-svg');

const textToSVG = TextToSVG.loadSync(fontPath);

const svg = textToSVG.getSVG('InboxFlows', {
  x: 0,
  y: 0,
  fontSize: 72,
  anchor: 'top left',
});

const font = new threeFontConverter().parse(svg);
writeFileSync('./public/fonts/Inter_Bold.json', JSON.stringify(font)); 