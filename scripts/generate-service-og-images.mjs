import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const services = [
  {
    title: 'Performance Audit',
    line: 'PostgreSQL-Engpässe sichtbar machen und klar priorisieren.',
    source: 'assets/img/services/performance-audit.svg',
    output: 'assets/img/og/service-performance-audit.png',
  },
  {
    title: 'Stabilization Sprint',
    line: 'Performance-Hotspots messbar verbessern und sauber vorbereiten.',
    source: 'assets/img/services/stabilization-sprint.svg',
    output: 'assets/img/og/service-stabilization-sprint.png',
  },
  {
    title: 'Performance Care',
    line: 'PostgreSQL-Performance laufend im Blick behalten.',
    source: 'assets/img/services/performance-care.svg',
    output: 'assets/img/og/service-performance-care.png',
  },
  {
    title: 'Flex Support',
    line: 'Konkrete PostgreSQL-Fragen schnell und fundiert einordnen.',
    source: 'assets/img/services/flex-support.svg',
    output: 'assets/img/og/service-flex-support.png',
  },
];

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapLine(value, maxChars = 36) {
  const words = value.split(' ');
  const lines = [];
  let line = '';

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function benefitTspans(value) {
  return wrapLine(value)
    .map((line, index) => `<tspan x="0" dy="${index === 0 ? 0 : 42}">${escapeXml(line)}</tspan>`)
    .join('');
}

function serviceSvgFragment(source) {
  const svg = readFileSync(join(root, source), 'utf8');
  return svg
    .replace(/^<svg[^>]*>/, '')
    .replace(/<title[\s\S]*?<\/title>\s*/g, '')
    .replace(/<desc[\s\S]*?<\/desc>\s*/g, '')
    .replace(/<\/svg>\s*$/, '');
}

function composeImage(service) {
  const illustration = serviceSvgFragment(service.source);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f1c2c"/>
      <stop offset=".55" stop-color="#18385a"/>
      <stop offset="1" stop-color="#336791"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0v48" fill="none" stroke="#d7e7f3" stroke-opacity=".09" stroke-width="1"/>
    </pattern>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="#07111c" flood-opacity=".32"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <path d="M715 0C840 105 916 230 940 382c16 101 66 181 150 248h110V0Z" fill="#d7e7f3" opacity=".10"/>
  <path d="M0 472c184-66 340-54 468 36 83 58 173 88 270 90H0Z" fill="#88b6d6" opacity=".12"/>
  <g transform="translate(84 94)">
    <rect x="0" y="0" width="104" height="4" rx="2" fill="#88b6d6"/>
    <text x="0" y="122" fill="#ffffff" font-family="Noto Sans, Arial, sans-serif" font-size="62" font-weight="800" letter-spacing="0">${escapeXml(service.title)}</text>
    <text x="0" y="212" fill="#e8f2f8" font-family="Noto Sans, Arial, sans-serif" font-size="31" font-weight="500" letter-spacing="0">${benefitTspans(service.line)}</text>
    <text x="0" y="426" fill="#d7e7f3" font-family="Noto Sans, Arial, sans-serif" font-size="25" font-weight="700" letter-spacing="0">andreploeger.com</text>
  </g>
  <g transform="translate(712 92)" filter="url(#shadow)">
    <rect x="0" y="0" width="390" height="446" rx="28" fill="#f7fafc"/>
    <svg x="-30" y="60" width="450" height="315" viewBox="0 0 800 560" preserveAspectRatio="xMidYMid meet">${illustration}</svg>
    <rect x="46" y="366" width="298" height="12" rx="6" fill="#d7e7f3"/>
    <rect x="46" y="394" width="210" height="12" rx="6" fill="#88b6d6"/>
  </g>
</svg>`;
}

mkdirSync(join(root, 'assets/img/og'), { recursive: true });

for (const service of services) {
  const tempSvg = join('/tmp', `andreploeger-og-${service.output.split('/').pop().replace('.png', '.svg')}`);
  writeFileSync(tempSvg, composeImage(service));

  const result = spawnSync('rsvg-convert', [
    '--format', 'png',
    '--width', '1200',
    '--height', '630',
    '--output', join(root, service.output),
    tempSvg,
  ], { encoding: 'utf8' });

  if (result.status !== 0) {
    throw new Error(`Failed to generate ${service.output}: ${result.stderr}`);
  }

  console.log(`Generated ${service.output}`);
}
