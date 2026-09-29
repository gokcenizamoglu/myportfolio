# Portfolio Website Design Brief — Gökçe Güler

## Who is this for?

Gökçe Güler — a full-stack software engineer based in Istanbul. Not a designer, not a marketer — a builder. She has shipped 8+ SaaS products across automotive, insurance, legal, HR, CRM, and AI domains. She's currently a Founding Engineer & Technical Lead coordinating 12 engineers. She studied Software Engineering at Bahçeşehir University on a full scholarship. Her core stack is Python/Django/PostgreSQL/React/Docker.

She has two logo options ready (attached). Logo 1 is a script "Gg" monogram, Logo 2 is bold block letters with orange dots replacing the Turkish diacritics (ö, ü, ç dots). Both use a warm ivory background (#F4F1EA) and a dark charcoal ink.

## Site Structure & Interaction Pattern

The site follows a **split-screen interaction pattern** inspired by [Boots4 nav-four-item-two-column](https://prium.github.io/Boots4/v3.2.0/nav-four-item-two-column.html):

### Homepage (single viewport, no scroll)
- **Left half (50%)**: Logo, name, title ("Full-Stack Software Engineer"), a one-line tagline, and social links (GitHub, LinkedIn, Email). Clean, minimal, lots of breathing room. This is the identity column.
- **Right half (50%)**: A **2×2 grid of four panels** filling the entire right side, edge to edge, top to bottom. Each panel is one navigation item: **Work**, **Experience**, **About**, **Contact**.

### Panel Click Interaction
When you click a panel:
1. The left identity column **slides out to the left** (translateX(-100%))
2. The right panel grid **slides out to the right** (translateX(100%))
3. The corresponding content page **slides in from the right** with a narrow colored **strip on the right edge** (the strip acts as a close button — clicking it slides everything back to the homepage)

This is physical, spatial animation — not a fade. Everything moves.

### Content Pages
Each page fills the viewport with content on the left (~95%) and a narrow vertical strip on the right (~56px) that shows the section name vertically and an × close icon. Clicking the strip or a "← Back" button returns to homepage with the reverse animation.

---

## What I Need Designed

### 1. The Four Panels (RIGHT SIDE — most important)

This is where I need the most creative help. The panels should NOT be:
- ❌ Flat solid colors (looks cheap)
- ❌ Four different rainbow colors (looks like a children's app)
- ❌ Generic stock photo overlays
- ❌ AI-template default (cream + terracotta, or neon-on-black)

The panels SHOULD:
- ✅ Feel cohesive — same visual family, not four unrelated colors
- ✅ Have depth and texture — gradients, overlays, subtle patterns, atmospheric lighting
- ✅ Feel premium and moody — like a good architecture portfolio or a fashion lookbook
- ✅ Have centered white text (section name) and a thin line icon above it
- ✅ Have a subtle hover effect (brightness shift, slight zoom, letter-spacing expansion)
- ✅ Thin 1px divider lines between panels

Ideas for panel treatment:
- All panels share a dark base (charcoal/slate family) with different atmospheric gradient overlays
- Or a deep monochromatic family (all navy, or all warm dark, or all forest tones)
- Or abstract photographic textures created with complex CSS gradients
- Each panel subtly different but clearly part of the same set
- Consider if the accent color (orange ~#D05A24) should appear on hover or as a subtle glow

### 2. Color Palette

The site uses a warm ivory background (#F4F1EA area). It is NOT pure white, NOT cool gray.

Needs:
- Background color (warm, not sterile)
- Text color (not pure black — something with warmth)
- Secondary text color (muted, for descriptions/dates)
- Line/border color (very subtle)
- Surface color (for cards, slightly darker than bg)
- Accent color (orange ~#D05A24, used sparingly: underlines, labels, hover states)
- Panel base color(s) (the dark family for the 2×2 grid)

### 3. Dark Mode

Should there be one? If yes:
- What's the dark background? (not pure black — warm charcoal)
- How do the panels change? (they're already dark — do they become lighter? Or get more glow?)
- How does the accent color adapt?
- How do the content pages feel?

### 4. Typography

Currently using:
- **Outfit** (headings, names, labels) — geometric sans with personality
- **Inter** (body text, descriptions) — clean and readable

Open to alternatives. The typography should feel:
- Technical but not cold
- Confident but not aggressive
- Modern but not trendy

### 5. The Content Pages

**Work page**: Two-column layout. Left: list of 6 projects (name, one-line description, tech tags). Right: sticky preview card that updates on hover — shows project name, subtitle, description paragraph, and tech stack. Below the main grid: "More Work" section with smaller rows.

**Experience page**: Timeline layout. Left column: dates. Right column: role, company (in accent color), description, tech tags. Below: domain chips (Automotive, Insurance, Legal, AI, Maritime, etc.)

**About page**: Lead paragraph in large light-weight type with italic accent-colored emphasis. Below: two-column grid (Education | Certifications). Below that: Core Stack as chips.

**Contact page**: Big bold heading "Have something worth building?" followed by email, LinkedIn, GitHub links. Vertically centered. Simple and confident. NO phone number.

### 6. The Strip (Close Button)

When a content page is open, a narrow vertical strip stays on the right edge. It shows:
- An × icon at the top
- The section name written vertically (rotated text)
- Clicking it closes the page and returns to homepage

What color/treatment should this strip have? Same dark as panels? The accent color? Something else?

### 7. Overall Feeling

This portfolio belongs to a **software engineer who builds complex systems**, not a designer who makes pretty things. The site should feel:

- **Engineered** — precise spacing, intentional hierarchy, nothing accidental
- **Confident** — big type where it matters, generous whitespace, no clutter
- **Warm** — not sterile corporate, not cold tech. The ivory background and warm tones set this.
- **Subtle sophistication** — the kind of site where you notice the craft after a second look, not a site that screams "look at me"
- **Physical** — the sliding animations should feel like moving real objects, not toggling divs

Think of it as: the intersection of a Swiss design grid and a warm Istanbul café. Technical precision with human warmth.

---

## Technical Constraints

- This will be built as a single HTML page first (prototyping), then converted to Go + Next.js
- External images are blocked by CSP — all visual richness must come from CSS (gradients, SVG patterns, shadows, blend modes)
- Google Fonts can be loaded, all other CSS must be inline
- Must work at phone width (stack to single column, panels stack vertically)
- Panel textures must be pure CSS — no image files

## Deliverables I Need

1. **Color palette** — full set of tokens for light mode (and dark if recommended)
2. **Panel design** — exactly how each of the 4 panels should look (colors, gradients, overlays, hover states)
3. **Strip design** — the narrow close-button strip treatment
4. **Typography scale** — sizes for headings, body, labels, chips
5. **Overall layout dimensions** — padding, gaps, proportions
6. **Any design details** I haven't thought of that would elevate the site

## Attached

- Logo Option 1: Script "Gg" monogram
- Logo Option 2: Bold block letters with orange diacritic dots
- Reference site: https://prium.github.io/Boots4/v3.2.0/nav-four-item-two-column.html
