# Hi-Tech Autozone — Design System 2026 ("Midnight Performance")

Reference for anyone editing this site. All new styling and motion lives in two files that load **last** on every page; the legacy template CSS/JS is never edited.

| File | Purpose |
| --- | --- |
| `assets/css/premium-2026.css` | Tokens, every component restyle and re-layout, responsive rules, motion |
| `assets/js/premium-2026.js` | Hero slider + HUD, reveals, word-split headlines, marquees, tilt/spotlight, magnetic buttons, stacking cards, scroll effects, carousel |

Both are linked with `?v=2`. **Bump the version** whenever you change either file so returning visitors don't keep a cached copy.

Load order: `bootstrap.min.css` → `style.css` → `main.css` → `premium-2026.css`, then `script.js` → `premium-2026.js` (deferred).

---

## Tokens (`:root` in `premium-2026.css`)

**Colour**

| Token | Value | Use |
| --- | --- | --- |
| `--p-bg` / `--p-bg-2` | `#07080a` / `#0b0d10` | Page background, alternate bands |
| `--p-surface` → `--p-surface-3` | `#101318` → `#1b2028` | Cards, panels |
| `--p-line` / `--p-line-2` | white 8% / 14% | Hairlines, card borders |
| `--p-text` / `-2` / `-3` | `#f3f4f6` at 100 / 70 / 50% | Headings / body / captions |
| `--p-red` | `#ff2b2b` | Brand accent (brightened from `#ED1D24` for dark backgrounds) |
| `--p-plate` | white → `#cdd2d9` radial | "Studio plate" behind product images shot on white |
| `--p-metal` | white → `#9aa1ad` | Brushed-metal gradient for hero and stat numbers |

**Type** — one family, **Archivo** (variable: width 62–125%, weight 100–900).
Display headings use `font-stretch: 125%` (expanded), weight 800, uppercase, tracking −0.035em. Body copy uses the normal width.
The page root is `font-size: 62.5%`, so **1rem = 10px**.

**Radius** 10 · 14 · 20 · 28 · 36 · pill. **Motion** `.2s / .4s / .9s`, easing `--p-ease-out` (`cubic-bezier(.16,1,.3,1)`). Only `transform`, `opacity`, `filter` and `clip-path` animate.

**Rhythm** `--p-section: clamp(88px, 10vw, 152px)` (80px under 768px). Gutter 24 → 20 → 18px.

**Breakpoints** 1700 · 1400 · 1200 · 991 · 767 · 575 · 400, plus `(hover: none)` for touch.

---

## Components

- **Header** floats transparently over the hero on every page that has one (`body:has(...)`), becomes dark glass when sticky. Desktop nav is a pill track with a glowing dot under the active page.
- **Drawer** — numbered, expanded-type menu with staggered entrance; closes on Escape / link tap.
- **Hero** — full-viewport, Swiper in fade mode with autoplay; animated perspective "road" grid, red floor glow, light beam sweep; slide counter + progress bar; pointer parallax on the vehicle; content drifts and fades on scroll.
- **Marquee** — category names in expanded outline/solid type, built at runtime from the existing headings (hidden from screen readers). Brands page gets two logo rails the same way.
- **Category bento** — 4-column grid, Steering and Fog Lamp as 2×2 hero tiles; each product sits on a white studio plate; 3D tilt + red spotlight follow the pointer.
- **Showcase card** (`.section-block`, used by all six accessory pages and Services) — dark card, image wipe-in reveal, outlined index number, bullet chips. On desktops where every card fits the screen they **stack** as you scroll (each pins and the previous one scales back). Transparent PNG art automatically gets the studio plate. On phones the image leads.
- **Buttons** — red gradient pill, light sweep on hover, arrow slides, magnetic pull toward the pointer.
- **Inner-page hero** — giant expanded title over the page image with scrims, breadcrumb as a glass pill.
- **Testimonials** — large quote typography, avatar below, line indicators; autoplay pauses on hover, focus and off-screen; swipe on touch.
- **Footer** — near-black with red glow line, faded logo watermark.

## Motion rules

`data-reveal="up|down|left|right|fade|blur|scale|image"` + `.p-reveal-ready` on `<html>` drives reveals. Legacy `data-aos` attributes map onto it. Display headlines are split into words that rise behind a mask. Nothing is hidden unless JS is running; anything on screen at load animates in immediately; a 1.5s safety pass catches the rest. `prefers-reduced-motion` turns all of it off, including the grain, marquee and stacking.

## Derived assets

Created for the dark theme; originals are untouched.

| File | From | Why |
| --- | --- | --- |
| `img/logo/hi-go-light.png` | `hi-go.png` | Slate parts recoloured white for dark backgrounds; red kept |
| `img/slider/slider-car-web.webp` | `slider-car.png` | 1 MB → 86 KB, same image |
| `img/other/car-images-web.webp` | `car-images.png` | 2.5 MB / 4500px → 146 KB / 1400px |
