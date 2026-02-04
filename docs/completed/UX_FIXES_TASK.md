# TASK: UX Polish & Layout Hardening

**Priority:** High
**Focus:** Visual Alignment, Navigation Usability, and Data Context.

## TASK 1: Milestone Bar Styling (Center & Match Coach)
**Problem:** The `milestones.html` component looks disconnected and is not centered. It should match the "Plan Optimizer" row aesthetic.
**File:** `src/partials/charts/milestones.html`
**Action:**
1.  Wrap the entire content in the **Standard Card Container**:
    `w-full bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 shadow-xl`
2.  **Flex Behavior:** Ensure the internal list of milestones is **Centered** horizontally.
    *   Use: `flex flex-wrap justify-center items-center gap-8`.
    *   Ensure the text is legible (white/gray-200).

## TASK 2: Navigation Scroll Offset (The "Cut Off" Fix)
**Problem:** Clicking the Sidebar links (e.g., "Net Worth") scrolls the section behind the fixed header.
**File:** `src/index.html`
**Action:**
1.  Locate every Section ID container (e.g., `#section-networth`, `#dashboard-top`, `#section-income`).
2.  Add the Tailwind class **`scroll-mt-32`** (scroll margin top) to each of these container divs.
    *   *Logic:* This forces the browser to leave 8rem (approx 128px) of space above the element when scrolling to it, clearing the sticky header.

## TASK 3: Row 1 (Key Metrics) Strict Layout & Context
**Problem:** Row 1 is not following the 7-column rule, labels are inconsistent, and "Wellness" lacks context.
**File:** `src/partials/key-metrics.html`
**Action:**
1.  **Grid Enforcement:** Ensure the parent container is strictly:
    `grid grid-cols-7 gap-4 w-full` (Remove any flex/auto-fit).
2.  **Label Corrections:**
    *   Item 2: Change label to **"Peak Net Worth"**.
    *   Item 7: Change label to **"Projected Taxes"**.
3.  **Wellness Context (Tooltip):**
    *   Find the "Wellness" card.
    *   Add a visual indicator (e.g., a small `ⓘ` icon or just use the `title` attribute on the card).
    *   **Context Text:** Add a tooltip that explains the score: *"Composite score based on Savings Rate (40%), Debt Ratio (30%), and Risk Coverage (30%)."*
    *   *Visual:* Ensure the score (e.g., "85") is large, but add the context text either below it in small font (`text-[10px] text-gray-400`) or on hover.