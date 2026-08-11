---
name: Luna Reader
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

This design system is built on the principles of **Ultra-Minimalism** and **Functional Precision**. It prioritizes content clarity above all else, drawing inspiration from high-end editorial layouts and modern developer tooling. The aesthetic is "quiet"—it recedes into the background to allow the act of reading to take center stage.

The target audience consists of focused professionals and digital minimalists who value speed, legibility, and a distraction-free environment. The emotional response is one of calm, control, and intellectual focus. 

**Key Stylistic Pillars:**
- **Rational Spacing:** Every element is placed with mathematical intent.
- **Subtle Affordance:** Interactivity is signaled through slight shifts in tonal contrast rather than heavy ornamentation.
- **Negative Space:** Generous white space is used as a structural element to group content and reduce cognitive load.

## Colors

The palette is rooted in a "Paper and Ink" philosophy. The primary surface is a pure white to maximize contrast and mimic the clarity of a physical page.

- **Primary (#0f172a):** Used for primary text, headings, and high-priority action buttons. This deep slate provides superior legibility over pure black.
- **Secondary / Accent (#6366f1):** A refined Indigo used sparingly for focus states, active text links, or subtle progress indicators to provide a touch of character without being distracting.
- **Muted / Neutral (#f8fafc):** Used for secondary backgrounds, such as sidebars or hover states, creating a soft distinction between UI layers.
- **Border (#e2e8f0):** A light slate used for structural definition. Borders should be thin (1px) and used only when necessary to separate distinct functional areas.

## Typography

The typography utilizes **Inter**, a typeface designed for screen legibility. The hierarchy is strictly enforced to ensure the interface feels organized and predictable.

**Usage Guidelines:**
- **Headlines:** Use tight letter spacing (-0.01em to -0.02em) for larger sizes to maintain a compact, professional look.
- **Body Text:** Optimized for long-form reading with a comfortable 1.5x line height.
- **Labels:** Use Medium weight (500) for UI elements like navigation and buttons to distinguish them from content body text.
- **Monospace (Optional):** For metadata or reading statistics (e.g., "12 min read"), a system monospace font may be used at `label-sm` for a technical, precise feel.

## Layout & Spacing

The system follows a strict 4px grid. All dimensions, padding, and margins must be multiples of 4.

- **Grid Model:** A 12-column fluid grid is used for dashboard views, while a centered, single-column "Reading Mode" (max-width 720px) is used for the actual content to ensure optimal line lengths.
- **Mobile:** Margins scale down to 16px. Sidebars collapse into a bottom drawer or a hidden navigation menu to prioritize the viewport for text.
- **Desktop:** A fixed-width sidebar (240px - 280px) is standard for library navigation, with a flexible main content area.

## Elevation & Depth

This design system avoids heavy shadows and physical metaphors. Depth is communicated through tonal layering and hair-line borders.

- **Level 0 (Background):** Pure white (#ffffff).
- **Level 1 (Cards/Sidebar):** Neutral background (#f8fafc) or white with a 1px border (#e2e8f0).
- **Level 2 (Popovers/Modals):** Pure white with a very soft, diffused shadow: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`.
- **Focus States:** High-contrast 2px ring in Indigo (#6366f1) with an offset of 2px to ensure accessibility without cluttering the base UI.

## Shapes

In alignment with the professional and clean aesthetic, shapes are geometric with subtle softening.

- **Standard Radius:** 6px (0.375rem). This applies to buttons, input fields, and small cards.
- **Large Radius:** 8px (0.5rem). Used for larger containers like modals or main content cards.
- **Interactive Elements:** Maintain consistent corner radii across all components to create a cohesive "unit" feel.

## Components

Components follow the **shadcn-ui** pattern: functional, accessible, and unstyled by default, then themed with the system's specific tokens.

- **Buttons:** 
  - *Primary:* Slate-900 background, white text. No gradient. 
  - *Secondary:* White background, 1px border (#e2e8f0), Slate-900 text.
  - *Ghost:* No background or border; appears on hover with a Slate-50 background.
- **Inputs:** 1px border (#e2e8f0) with a 6px radius. Focus state uses the Indigo ring. Placeholder text uses a muted slate gray.
- **Chips / Tags:** Small, 12px font, 4px radius. Use a light slate background (#f1f5f9) with Slate-700 text.
- **Lists:** Clean rows with a 1px bottom border. Hover state uses #f8fafc.
- **Cards:** White background, 1px border (#e2e8f0), no shadow (unless elevated).
- **Reading Progress:** A thin (2px) Indigo bar at the top of the viewport or a subtle circular indicator in the sidebar.