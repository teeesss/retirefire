# Coding Standards & Best Practices

## 1. Architecture
- **Modularity First**: All code must be broken into small, focused ES Modules. No file should exceed 500 lines.
- **HTML Injection**: Use `vite-plugin-html-inject` for all HTML components. Do not hardcode HTML in `index.html`.
- **State Management**: Use `Store.js` for global application state. Avoid direct DOM manipulation for state storage.
- **Events**: Use the `EventsHandler` for all UI interactions.

## 2. JavaScript / ES6+
- **Strict Mode**: Implicitly handled by Modules, but ensure strict adherence.
- **Async/Await**: Prefer over `.then()`.
- **Pure Functions**: core calculation logic (e.g., in `src/engine/`) *must* be pure and testable without the DOM.
- **Defensive Coding**: Always use optional chaining (`?.`) and nullish coalescing (`??`) when accessing nested config objects.

## 3. Testing
- **Vitest**: All new features *must* include unit tests.
- **Coverage**: Maintain >90% coverage on calculation engines.
- **E2E**: Critical flows must be verified with E2E tests, designed to degrade gracefully if headless chrome is unavailable.
- **Test-Driven**: Write tests for defects *before* fixing them.

## 4. Documentation
- **Self-Documenting Code**: Clear variable names (e.g., `spendingMultiplier` vs `sm`).
- **JSDoc**: Use JSDoc for all public functions in `src/engine/` and `src/utils/`.
- **Artifacts**: Keep `implementation_plan.md` and `task.md` updated.

## 5. CSS / Styling
- **Variables**: Use CSS variables for all colors and spacing in `style.css`.
- **Responsive**: All UI components must be responsive (mobile-first).
- **Dark Mode**: Support dark mode by default using CSS variables.
