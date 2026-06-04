# FlowOps — Landing Page

Premium, dark-mode, dashboard-style landing page for **FlowOps**, a smart queue management & business intelligence SaaS.

Built with **React 18 + Vite + Tailwind CSS**.

## Quick start

```bash
npm install
npm run dev
```

Then open the URL printed by Vite (typically http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Structure

```
src/
  App.jsx                  # Page composition
  main.jsx                 # React entry
  index.css                # Tailwind layers + design tokens
  components/
    Navbar.jsx
    Hero.jsx
    DashboardMock.jsx      # Hero dashboard mockup (pure Tailwind/SVG)
    LiveStats.jsx
    ProblemSolution.jsx
    Features.jsx
    DashboardShowcase.jsx  # Large dashboard mockup with floating labels
    HowItWorks.jsx
    Industries.jsx
    Testimonial.jsx
    ClosingCTA.jsx
    Footer.jsx
    Logo.jsx
```

## Design system

| Token            | Value     |
| ---------------- | --------- |
| Background       | `#0B1120` |
| Primary accent   | `#3B82F6` |
| Secondary accent | `#06B6D4` |
| Font             | Inter / Manrope |

All charts and dashboard visuals are crafted with Tailwind utilities and inline SVG — no chart libraries required.
