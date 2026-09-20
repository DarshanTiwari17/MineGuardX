# MineGuardX Visual Redesign Brief

## Objective

Redesign the **existing** MineGuardX React application so it looks and feels like the Stitch “Warm Tactical Precision” design system — cream/sand canvas, charcoal pill navigation, large typographic telemetry — **without cloning Stitch screens, content, or structure**.

This is a **visual/presentation-only** change to a real Vite + React 19 app.

**Result:** “The existing mine rescue command center, redesigned in the Stitch visual language.”
**Not:** “The Stitch app with our data.”

## Target audience

Mine rescue operators using a desktop command console (also laptop/tablet/mobile). Multi-hour shifts. Need calm, high-legibility UI under pressure.

## Output path (REAL APPLICATION)

Work in: `C:\Users\Lenovo\Desktop\MineGuardX`

Primary styling: `src/index.css` (custom CSS + CSS variables, **no Tailwind in this project**, **do not add Tailwind or new UI libraries**).

Do **not** generate standalone HTML mockups. Do **not** copy files from the Stitch folder into the app.

## Aesthetic direction

**Warm Tactical Minimalism + Organic Neo-Tactile UI**

- Soft sand/ivory canvas gradient (not flat white, not neon yellow)
- Charcoal pill controls and active nav
- Hairline borders, ultra-soft shadows, tonal surface layers
- Large Space Grotesk stats; Plus Jakarta Sans UI; JetBrains Mono telemetry
- Generous 24px panel padding; 24px outer radius on primary surfaces
- Full pills for buttons, nav, badges
- Occasional **tactical dark pods** (`#1E1F22`) for emergency/SOS/critical action clusters only
- Asymmetric compositions: large workspace + supporting rail; typography-driven metrics; connected sections inside one surface rather than a grid of identical cards

**Memorable signature:** cream-to-sand page atmosphere + charcoal capsule nav + giant live numbers.

## Authoritative design system

Read and follow tokens from:

`C:\Users\Lenovo\Desktop\MineGuardX\stitch_mine_rescue_command_center (1)\stitch_mine_rescue_command_center\warm_tactical_precision\DESIGN.md`

Reference HTML (visual language only, **do not copy content/structure**):

- `...\command_center\code.html`
- `...\live_monitoring\code.html`
- `...\mine_map\code.html`
- `...\miner_wearables\code.html`

Screenshots in those folders are atmosphere references only.

### Fonts (use these — they are what Stitch actually uses)

User mentioned Google Sans as a fallback **if** the reference used it. The Stitch folder does **not** use Google Sans. Use:

- **Space Grotesk** — page titles, display, stat counters (`font-weight` 400–600, tight tracking)
- **Plus Jakarta Sans** — body, nav, labels, buttons
- **JetBrains Mono** — IDs, timestamps, coordinates, ppm, latency

Load via Google Fonts `@import` in `src/index.css` (same approach already used). Replace Outfit/Google Sans stack.

### Light canvas (must be visibly warm)

```
body background: linear-gradient(180deg, #F6F3ED 0%, #ECE7DC 100%);
panels: #FDFCF7
elevated: #FFFFFF
hairline: #E5E0D5 / rgba(30,31,34,0.08)
text: #18191B / #686A71 / #8F9199
charcoal pod: #1E1F22
amber highlight: #FACC15 / #F59E0B
emerald: #10B981
danger: #EF4444
telemetry blue: #0284C7
```

Light theme is primary. Dark theme: `#121316` canvas, `#1C1D21` panels, `rgba(255,255,255,0.09)` borders. Keep semantic red/amber/green/blue meanings.

Primary buttons: charcoal `#18191B` white text pills (not blue). Ghost: tonal sand. Emergency: vermilion with pulse ring. Accent industrial: `#FACC15` charcoal text.

Shadows from DESIGN.md Layer 1/2/3. Avoid heavy drop shadows and thick dark outlines.

## Hard constraints (functionality)

- Do **not** change routes, App.tsx route table (except visual wrappers if needed — prefer not).
- Do **not** change APIs, services, AppContext, types, buses, camera config, WebSockets.
- Do **not** invent operational data, fake miners, fake SOS counts, fake mission names, fake percentages.
- Do **not** hardcode Stitch copy (“Operation Sub-Terra IV”, “Cmdr. Vance”, “14 Active Miners”, etc.).
- Keep existing labels, page names, section names, handlers, dispatch, props.
- Keep every existing component file. Do not delete components. Do not move a component to a different page.
- Components may be **visually rearranged within the same page**.
- JSX structure may change for layout. Logic, state, and event handlers stay.
- Do not add dependencies unless required for fonts (fonts via CSS import only).
- Alerts nav item: keep existing Sidebar `NAV_ITEMS`. Do not remove routes. Header already has alerts bell — keep it working.
- Theme toggle already exists in Header — restyle, do not break.

## Current architecture (foundation)

- `src/App.tsx` — routes
- `src/components/layout/MainLayout.tsx` — Header + Sidebar (already horizontal top nav) + page content
- `src/components/layout/Header.tsx` — mission badge, rover badge, alerts, clock, theme toggle, operator
- `src/components/layout/Sidebar.tsx` — brand + NavLinks (horizontal pill bar)
- `src/index.css` — entire design system (very large). Update tokens + primitives + page-specific styles here.
- Shared: `StatusCard`, `StatusBadge`, `EmptyState`, `LiveClock`
- Command Center widgets stay on Command Center: RoverStatus, MissionStatus, MineMap, CameraFeed, EnvironmentSummary, WearableStatus, HazardPanel, RescueRoutePanel, CommunicationStatus, SystemHealth, EmergencyStop, LiveClock
- Live Monitoring stays: LiveVideoViewer, RecordingControls, CameraStatusPanel, AIDetectionPanel
- Mine Map page stays: MineMapCanvas, MapControls, MapInfoPanel, MapLegend
- Wearables page stays: StationQRDisplay, WearableCard, emergency list
- Mobile wearable `/mobile-wearable` is standalone — restyle the simulated device in the same language (can be slightly denser/darker as a handheld, but still cream/charcoal language, not old cyan-on-black terminal)

Pages using PlaceholderPage: AI Detection, Rescue Operations, Rescue Route, Rover Control, Communication, Rover Health, Alerts, Mission Logs, Analytics, Reports, Settings — restyle PlaceholderPage and each page wrapper so they feel like the new system (still same titles/descriptions/phase).

## Shared primitives to update first

1. CSS variables / canvas gradient on `html, body, #root, .app-layout`
2. Typography utilities (display, headline, stat-counter, label-caps)
3. `.card` → large rounded `#FDFCF7` surfaces, hairline, soft shadow; **but pages should not be a wall of identical cards**
4. `.btn`, `.btn-primary` (charcoal pill), `.btn-ghost`, `.btn-emergency`
5. `.badge`, status dots
6. Header: floating cream/blur bar, not a hard grey strip
7. Nav: inset sand track, inactive muted, **active = solid charcoal capsule + white text**
8. Inputs/selects: white/sand, 12px radius, charcoal focus ring
9. Tables: `#FDFCF7` / `#FAF7F0` stripes, caps headers
10. StatusCard: can become a **section inside a larger composition** (optional class variants: `surface-section` without looking like a boxed widget farm)

## Page compositions (existing content only)

### Shell
- Cream gradient full viewport.
- Header: brand charcoal pill “MineGuardX” + Rescue-OS style badge **using existing product name only**; status pills from existing Header data; theme + operator.
- Nav: keep ALL existing Sidebar labels/paths/icons. Style as a wrapping/scrollable pill cluster in an inset track. Active charcoal. Alert badge if present.
- Main content: generous padding (`2.5rem` desktop). Max width ~1600px.

Layout currently stacks Header then Sidebar then content in a column (`MainLayout`). Refine that composition: consider combining brand into header/nav visually (still keep Header + Sidebar components and their existing data/links). Do not restore a left sidebar unless needed for overflow; Stitch uses top capsule nav. On small screens, nav must remain usable (horizontal scroll or wrap) — **do not hide nav items**.

### Command Center `/`
Large operational overview — **not** 11 equal cards stacked.

Suggested visual composition (same components):
- Page title “Command Center” in Space Grotesk large; existing subtitle; LiveClock as typographic telemetry.
- Optional **header metric strip** using **existing state only** (e.g. rover connection, wearable connectedCount, hazard/alert counts, mission status) as large numbers + caps labels — **no invented numbers**. If a value is null, show existing “No data” pattern, not fake 98%.
- Primary band: RoverStatus + MissionStatus as typography-forward panels (battery/signal as large stats when present).
- Dominant workspace: MineMap as large rounded surface.
- Secondary: CameraFeed + EnvironmentSummary as one connected workspace (camera visually stronger).
- Rail or lower band: HazardPanel, WearableStatus, RescueRoutePanel, CommunicationStatus, SystemHealth as **open sections** (dividers/typography) not 5 identical cards.
- EmergencyStop as a distinctive vermilion/dark-pod action, not another white card.

Break the 1fr+340px identical-card column if it still feels like a widget farm. Asymmetric bento is OK if all widgets remain on this page.

### Live Monitoring `/live-monitoring`
Camera workspace dominates. Controls as floating/pill toolbar under or overlaying the viewer chrome. Side rail for CameraStatusPanel + AIDetectionPanel + existing hardware info. Keep all handlers.

### Mine Map `/mine-map`
Map canvas dominates (large radius workspace). Toolbar pills. Right/below: MapControls, MapInfoPanel, MapLegend as a connected inspector rail, not three stacked identical cards.

### Miner Wearables `/wearables`
Personnel monitoring composition: large title + existing metric chips as typographic counters; distress banner as emergency pod; emergency history as stream; QR pairing as a refined light panel (not cyan-dark sci-fi); roster as list/bento of WearableCards with large HR/battery numbers.

### Environment `/environment`
Large sensor readings (stat-counter for numeric values). Overall status as a strong typographic hero. Gas sensors as a connected metrics band. Tables restyled. **Keep conditional gas cards** (null values still hidden).

### Hazard Center `/hazard-center`
Strong emergency hierarchy: summary counters, critical banner, tabs as pills, list as stream (not nested cards). Keep acknowledge/resolve/expand. Keep source status + quick links on this page.

### Mobile wearable `/mobile-wearable`
Restyle pairing + SOS + telemetry + simulators. Giant SOS remains. Cream/charcoal language inside the phone shell. Keep all simulation handlers.

### Placeholder pages
Calm cream empty/coming-soon compositions with large titles — still PlaceholderPage content.

## Implementation strategy you must follow

1. Update `src/index.css` tokens, fonts, body gradient, buttons, badges, cards, header, nav, tables, forms, scrollbar (sand track, charcoal thumb).
2. Restyle Header.tsx and Sidebar.tsx (classes, not inline style soup where possible).
3. Restyle MainLayout.
4. Restyle StatusCard, StatusBadge, EmptyState.
5. Redesign each page + feature CSS sections in index.css.
6. Restyle dashboard widgets (RoverStatus etc.) for typography hierarchy without changing data.
7. Responsive: desktop spacious; tablet stack; mobile no overflow, touch 44px+; never hide functional controls.
8. Dark mode: `[data-theme="dark"]` tokens matching DESIGN.md dark canvas.

## Image needs

None. Do not add stock photos, rover hero images, or Googleusercontent images from Stitch HTML.

## What not to do

- Do not copy Stitch bento with fake portraits, fake “Sweep 15%”, fake miner counts.
- Do not reintroduce industrial blue-grey dashboard or cyan terminal look.
- Do not only recolor old cards yellow.
- Do not flatten to #FFFFFF.
- Do not break `data-testid` attributes.

## Verification

Run `npm run build` (and `npm run lint` if practical). Fix type/CSS issues you introduce.

If a dev server is already running, do not start a duplicate unless needed.
