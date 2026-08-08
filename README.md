# CSUF Criminal Justice Undergraduate Advising Handbook

Welcome to the **California State University, Fullerton (CSUF) Department of Criminal Justice** undergraduate advising handbook repository. This site is the digital version of the CRJU Undergraduate Advising Handbook (Fall 2026) for the Bachelor of Arts in Criminal Justice.

## About the Program

The Criminal Justice major is the study of the causes, consequences, and control of crime. It prepares students for careers in law enforcement, law and courts, corrections, forensics, victim services, policy and research, and federal agencies, as well as for graduate and professional study.

The department is part of the **Division of Politics, Administration & Justice** in the College of Humanities and Social Sciences.

## The Handbook

The handbook is a single-page, accessible website built with HTML, CSS, and JavaScript — no frameworks, no tracking. It includes:

- **Career Explorer** — pick a career area and see recommended courses, minors, internship tips, and faculty contacts
- **Course Tracker** — check off major requirements as you complete them (progress saves in your browser)
- **Path Planner** — answer three questions and get a personalized semester-by-semester road map
- **The Major** — core, breadth, elective, related-fields, and writing requirements by catalog year
- **Minors** — the CJ minor plus complementary minors by career interest
- **Policies & GPA** — grade requirements, repeat policy, academic notice, and graduation check
- **Opportunities** — research courses, internships, special programs, student organizations, and scholarships
- **Faculty** — the Criminal Justice faculty roster with teaching areas and research interests
- **Contacts & Resources** — department, advising, and campus support contacts

## Accessibility

The site targets WCAG 2.2 AA. It currently scores 9.9/10 on [WAVE](https://wave.webaim.org), and 10/10 on the Terms, Privacy, and Accessibility pages.

Colour contrast is checked by a script in this repo:

```bash
node tools/contrast-audit.mjs                # every page, both themes
node tools/contrast-audit.mjs index.html     # a single page
node tools/contrast-audit.mjs --json         # machine-readable
```

It serves the repo, drives headless Chromium, and measures the computed contrast of every text node against its real backdrop. It exits non-zero if anything fails, so it can gate a commit. Requires Node 18+ and a Chromium build (set `CHROME_PATH` if one isn't on your `PATH`).

Each page is measured twice, because the two passes answer different questions:

- **true** — what a sighted reader actually sees. Resolves gradients to their worst-case colour stop and composites translucent layers up the ancestor chain.
- **checker** — what WAVE and axe-style tools see. They read `background-color` only.

Three rules keep the site passing both:

1. **Every gradient background also sets an explicit `background-color`.** A gradient is a `background-image`, so the `background` shorthand leaves `background-color` transparent. A checker then falls through to the page background and reports white text on white — this is exactly what produced 24 spurious WAVE errors before the fallbacks were added. Use the gradient's lightest stop so the fallback is the genuine worst case. It also matters in forced-colours mode, with background images disabled, and in print.
2. **Links on a coloured panel need their own colour.** In `policy_styles.css` the `header` and `footer` are navy while the global link colour is the same navy, so links there must be overridden (the site uses `#FFD34D`). A breadcrumb link once sat at 1:1 — invisible — because of this.
3. **Text on a tinted panel is measured against the composited colour, not the swatch.** A translucent tint over white lands somewhere lighter than it looks in the palette, which quietly eats contrast margin.

## Credits

Created by Dr. Christie Gardiner. Updated Fall 2024 by Nallely Pratz, M.S. Ed. Updated Summer 2026 by Dr. Alissa R. Ackerman.

## License

This handbook is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-nc-sa/4.0/).

## Contact

- PAJ Division Office: (657) 278-3521 — GH 511 — <pajdiv@fullerton.edu>
- CRJU Advising: <https://crju.fullerton.edu/advising/cj-advising.html>

---

© 2026 California State University, Fullerton. All rights reserved.
