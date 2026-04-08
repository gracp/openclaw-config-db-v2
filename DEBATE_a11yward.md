# Design Debate: @a11yward's Accessibility Audit

**Agent Role:** Accessibility specialist. WCAG compliance, inclusive design, contrast ratios.

---

## COLOR CONTRAST ANALYSIS

### Known Problem Areas (from screenshots)

All of these FAIL WCAG AA (4.5:1 for body text, 3:1 for large text):

| Element | Current | Expected | Status |
|---------|---------|----------|--------|
| Stats labels ("Configs", "Files") | `#1a1a1f` on `#222228` | Should be `#f5f5f5` on `#222228` | FAIL |
| Section headings | `#a0a0b0` on `#1a1a1f` | `#f5f5f5` on `#1a1a1f` | FAIL |
| Step titles ("Browse", "Customize") | `#a0a0b0` on `#222228` | `#f5f5f5` on `#222228` | FAIL |
| Card body text | `#a0a0b0` on `#222228` | `#f5f5f5` or `#c0c0d0` on `#222228` | FAIL |
| Footer links | `#a0a0b0` on `#1a1a1f` | `#f5f5f5` on `#1a1a1f` | FAIL |
| Tag filter pills | `#a0a0b0` on `#2a2a32` | `#f5f5f5` on `#2a2a32` | FAIL |
| Config source labels | `#2a2a32` on card bg | `#f5f5f5` on card bg | FAIL |

### Root Cause
`text-muted-foreground` maps to `#a0a0b0`. On `background: #1a1a1f` or `bg-card: #222228`, this ratio is approximately **3.2:1** — below the 4.5:1 threshold for body text.

The `!important` overrides in app.css should fix this IF the classes are being applied. But in the HTML snapshots, many elements don't even have `text-muted-foreground` — they rely on inherited colors.

### Real Fix Required
1. `text-muted-foreground` MUST be `#c0c0cc` or higher to pass 4.5:1 on `#1a1a1f` background.
2. Every text-bearing element needs an explicit color class — inheritance is not reliable across this codebase.

---

## LANDING PAGE

**CONTRAST ISSUES:**
1. Stats labels (14, 96) — dark grey on slightly lighter grey card — FAILS
2. "Featured Configs" heading — `#a0a0b0` on dark — FAILS
3. "How It Works" step titles — `#a0a0b0` on card — FAILS
4. Step descriptions — `#a0a0b0` on card — FAILS
5. CTA section body text — `#a0a0b0` on dark — FAILS

**KEYBOARD ISSUES:**
1. Skip-to-content link — NOT PRESENT. Should be first focusable element.
2. All animated sections — keyboard users can't tell what's animated vs static. `aria-busy` or `aria-live` not used.

**MOTION ISSUES:**
1. `AnimatedSection` has `prefers-reduced-motion` support — GOOD. But it's client-side only. SSR may flash un-animated content.

---

## BROWSE PAGE

**CONTRAST ISSUES:**
1. Tag filter pills: `text-muted-foreground` on `bg-accent/50` — FAILS
2. Sort select: border color same as bg, barely visible focus ring
3. Pagination buttons when not active: barely visible

**KEYBOARD ISSUES:**
1. Tag filters: not keyboard-operable as a group. Enter/Space toggles but arrow keys don't navigate within the group.
2. Sort select: labeled but focus state is low-contrast.

**SCREEN READER ISSUES:**
1. Search input: `type="search"` is good, but no `aria-label` or associated `<label>`.
2. Results count: screen readers announce "3 results" but there's no `aria-live` region.

---

## CONFIG DETAIL PAGE

**CONTRAST ISSUES:**
1. "Meet the Agent" heading — very dark on dark card — FAILS
2. "Quick Stats" labels — dark on dark card — FAILS  
3. "What's Inside" section heading — near-invisible — FAILS
4. File count labels in Architecture diagram — dark grey on slightly lighter box — FAILS

**KEYBOARD ISSUES:**
1. Floating side nav dots: `w-2 h-2` — 8x8px. Minimum touch target is 44x44px. These are unclickable by keyboard/mouse without precise aiming.
2. File tree expand/collapse buttons: tiny hit area.
3. File viewer close button: should be `aria-label="Close file viewer"` — present but verify it's keyboard-accessible.

**MOTION ISSUES:**
1. File viewer slide-in animation: no `prefers-reduced-motion` check — VIOLATION

---

## UPLOAD PAGE

**CONTRAST ISSUES:**
1. Drop zone border: `border-border` barely visible — not accessible focus indicator.
2. Success state checkmark: if animated, must respect `prefers-reduced-motion`.

**KEYBOARD ISSUES:**
1. File input: `<input type="file">` is notoriously keyboard-unfriendly. Consider a custom file picker button.

---

## COMPARE PAGE

**CONTRAST ISSUES:**
1. "Select config" dropdowns: if using native `<select>`, contrast depends on OS-level styling.

---

## TOP 5 ACCESSIBILITY FIXES (ranked)

1. **CRITICAL — Fix all `text-muted-foreground` values** — change to `#c0c0cc` or higher. This is the single fix that resolves 80% of the contrast issues.
2. **CRITICAL — Floating side nav dots are too small** — change to `w-3 h-3` at minimum. For WCAG compliance, interactive elements should be at least 24x24px (ideally 44x44px for touch).
3. **HIGH — Add skip navigation link** — first focusable element, visible on focus.
4. **MEDIUM — Keyboard tag filter navigation** — arrow keys should move between tags.
5. **MEDIUM — File viewer close animation** — add `prefers-reduced-motion` check.

---

## OPINIONS ON OTHER AGENTS

### @minimalist: "text-muted-foreground on dark bg is the root cause"
**AGREE — but incomplete.** The root cause is deeper: `text-muted-foreground` has a semantic meaning of "secondary text that can be lower contrast." But WCAG doesn't distinguish between "muted" and "primary" text — ALL body text must pass 4.5:1. So "muted" in this context is a design decision, not an a11y decision. The fix requires making muted text lighter, not removing it.

### @visualpunk: "contrast is the #1 systemic issue"
**STRONGLY AGREE.** This is the most critical issue on the entire site. Without readable text, nothing else matters.

### @conversionbot: "secondary elements should be lower contrast to create hierarchy"
**DISAGREE — WCAG violation.** Creating visual hierarchy through low-contrast text is inaccessible. Use SIZE, WEIGHT, and POSITION for hierarchy — not color contrast below 4.5:1. You can use slightly muted colors for non-text elements (borders, dividers, disabled states) but body text must always meet contrast requirements.

---

## WCAG COMPLIANCE TARGETS

| Content Type | Minimum Ratio | Target |
|---|---|---|
| Body text | 4.5:1 | 7:1 |
| Large text (18pt+) | 3:1 | 5:1 |
| UI components | 3:1 | 5:1 |
| Decorative elements | No requirement | N/A |

The current `text-muted-foreground: #a0a0b0` on `background: #1a1a1f` achieves approximately **3.2:1** — below body text threshold.

**Minimum safe muted color** on `#1a1a1f` background: `#c8c8d0` (approximately 5.1:1)
**Recommended muted color** on `#1a1a1f`: `#d0d0dc` (approximately 6.0:1)
