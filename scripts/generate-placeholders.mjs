/**
 * Generates festive SVG placeholder images into /public/placeholders.
 *
 * These exist so the store never shows a broken image before real product
 * photography is uploaded through the admin panel. Run once:
 *   node scripts/generate-placeholders.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "placeholders");
mkdirSync(OUT, { recursive: true });

// [background outer, background inner, metal light, metal dark, thread, accent]
const PALETTES = [
  ["#4b0b1c", "#8f1638", "#f4e3a8", "#c9962e", "#e0b544", "#fdf8f1"],
  ["#2c0510", "#6d1029", "#ebcd70", "#a97624", "#d13c5c", "#faf2d6"],
  ["#1f2937", "#374151", "#e5e7eb", "#9ca3af", "#c9962e", "#f9fafb"],
  ["#5a3a1e", "#855720", "#faf2d6", "#c9962e", "#8f1638", "#fdfaef"],
  ["#3b1053", "#6b2a8f", "#f4e3a8", "#c9962e", "#e0b544", "#faf5ff"],
  ["#0f3d3e", "#1a6b5f", "#f4e3a8", "#c9962e", "#d13c5c", "#f0fdfa"],
  ["#4b0b1c", "#b31f45", "#fdf8f1", "#ebcd70", "#c9962e", "#fff"],
  ["#231942", "#5e548e", "#ebcd70", "#a97624", "#e0b544", "#f8f7ff"],
];

/** Petal ring around the medallion. */
function petals(cx, cy, count, inner, outer, fill, opacity) {
  let out = "";
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * 360;
    out += `<ellipse cx="${cx}" cy="${cy - (inner + outer) / 2}" rx="${outer * 0.28}" ry="${
      (outer - inner) / 2
    }" fill="${fill}" opacity="${opacity}" transform="rotate(${angle} ${cx} ${cy})"/>`;
  }
  return out;
}

/** Small stones evenly spaced on a circle. */
function stones(cx, cy, count, radius, r, fill) {
  let out = "";
  for (let i = 0; i < count; i += 1) {
    const a = ((i / count) * Math.PI * 2) - Math.PI / 2;
    out += `<circle cx="${(cx + Math.cos(a) * radius).toFixed(1)}" cy="${(
      cy +
      Math.sin(a) * radius
    ).toFixed(1)}" r="${r}" fill="${fill}"/>`;
  }
  return out;
}

function makeSvg(index, w = 900, h = 1125) {
  const [bgOuter, bgInner, metalLight, metalDark, thread, accent] =
    PALETTES[index % PALETTES.length];
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.21;
  const variant = index % 4;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="78%">
      <stop offset="0%" stop-color="${bgInner}"/>
      <stop offset="100%" stop-color="${bgOuter}"/>
    </radialGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${metalLight}"/>
      <stop offset="50%" stop-color="${metalDark}"/>
      <stop offset="100%" stop-color="${metalLight}"/>
    </linearGradient>
    <linearGradient id="cord" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${thread}" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="${thread}"/>
      <stop offset="100%" stop-color="${thread}" stop-opacity="0.25"/>
    </linearGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="26"/>
    </filter>
  </defs>

  <rect width="${w}" height="${h}" fill="url(#bg)"/>

  <!-- ambient glow -->
  <circle cx="${cx}" cy="${cy}" r="${R * 2.1}" fill="${metalDark}" opacity="0.16" filter="url(#soft)"/>

  <!-- decorative corner arcs -->
  <g stroke="${metalLight}" stroke-opacity="0.13" fill="none" stroke-width="2">
    <circle cx="${cx}" cy="${cy}" r="${R * 2.5}"/>
    <circle cx="${cx}" cy="${cy}" r="${R * 3.1}" stroke-dasharray="6 14"/>
  </g>

  <!-- silk cord -->
  <path d="M0 ${cy} Q ${cx * 0.5} ${cy - 46} ${cx} ${cy} T ${w} ${cy}"
        stroke="url(#cord)" stroke-width="16" fill="none" stroke-linecap="round"/>
  <path d="M0 ${cy + 13} Q ${cx * 0.5} ${cy - 33} ${cx} ${cy + 13} T ${w} ${cy + 13}"
        stroke="url(#cord)" stroke-width="7" fill="none" opacity="0.55" stroke-linecap="round"/>

  <!-- medallion -->
  ${petals(cx, cy, variant === 1 ? 12 : 8, R * 0.95, R * 1.75, metalDark, 0.85)}
  ${petals(cx, cy, variant === 1 ? 12 : 8, R * 0.9, R * 1.5, metalLight, 0.65)}

  <circle cx="${cx}" cy="${cy}" r="${R * 1.06}" fill="url(#metal)"/>
  <circle cx="${cx}" cy="${cy}" r="${R * 0.92}" fill="${bgOuter}" opacity="0.55"/>
  <circle cx="${cx}" cy="${cy}" r="${R * 0.78}" fill="url(#metal)"/>

  ${stones(cx, cy, variant === 2 ? 16 : 12, R * 0.99, R * 0.075, accent)}
  ${stones(cx, cy, 8, R * 0.5, R * 0.09, bgOuter)}

  <circle cx="${cx}" cy="${cy}" r="${R * 0.3}" fill="${accent}"/>
  <circle cx="${cx}" cy="${cy}" r="${R * 0.16}" fill="${metalDark}"/>

  <!-- hanging bead -->
  <path d="M${cx} ${cy + R * 1.8} v ${R * 0.42}" stroke="${thread}" stroke-width="5" stroke-linecap="round"/>
  <circle cx="${cx}" cy="${cy + R * 2.35}" r="${R * 0.14}" fill="url(#metal)"/>

  <!-- scattered sparkle -->
  <g fill="${metalLight}" opacity="0.5">
    <circle cx="${w * 0.18}" cy="${h * 0.16}" r="4"/>
    <circle cx="${w * 0.82}" cy="${h * 0.22}" r="5"/>
    <circle cx="${w * 0.26}" cy="${h * 0.83}" r="4.5"/>
    <circle cx="${w * 0.75}" cy="${h * 0.79}" r="3.5"/>
    <circle cx="${w * 0.9}" cy="${h * 0.61}" r="3"/>
    <circle cx="${w * 0.09}" cy="${h * 0.56}" r="3"/>
  </g>
</svg>`;
}

const COUNT = 12;
for (let i = 0; i < COUNT; i += 1) {
  writeFileSync(join(OUT, `rakhi-${String(i + 1).padStart(2, "0")}.svg`), makeSvg(i), "utf8");
}

// Wide banner variants for category cards and hero.
for (let i = 0; i < 6; i += 1) {
  writeFileSync(join(OUT, `banner-${String(i + 1).padStart(2, "0")}.svg`), makeSvg(i + 2, 1600, 1000), "utf8");
}

console.log(`✅ Wrote ${COUNT} product + 6 banner placeholders to public/placeholders`);
