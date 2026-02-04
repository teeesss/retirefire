# Documentation Structure & Rules

**Last Updated**: 2026-01-24

---

## Core Principle

**Keep it simple. Keep it current. Keep it consolidated.**

Only maintain files that are actively used. Archive completed work. Delete obsolete files.

### Deployment & Cache Management
- **MANDATORY**: For every production release, ensure asset hashes change to bypass browser/CDN caches. Use a manual buster comment in `src/main.js` if necessary.

---

## Active Documentation (Root Level)

These are the ONLY files that should exist in the root directory:

### 1. **README.md** - Project Overview
- What the project is
- How to get started
- Links to other documentation
- **Owner**: Project lead
- **Update**: When project scope changes

### 2. **TASKS.md** - Current Work
- Active user stories
- Current sprint goals
- Task priorities (P0, P1, P2)
- Progress tracking
- **Owner**: Development team
- **Update**: Daily/as tasks change
- **Rule**: Remove completed tasks, move to archive if needed

### 3. **ISSUES.md** - Active Problems
- Current bugs
- Known issues
- Priority levels
- Fix status
- **Owner**: Development team
- **Update**: When issues found/fixed
- **Rule**: Remove fixed issues, keep only active problems

### 4. **PROJECT_STATUS.md** - Current State
- Overall project health
- Recent updates (last 2 weeks only)
- Next steps
- Metrics
- **Owner**: Project lead
- **Update**: Weekly or after major milestones
- **Rule**: Keep only current status, archive old updates

### 5. **QUICKSTART.md** - Getting Started
- Installation steps
- Running the app
- Running tests
- Common commands
- **Owner**: DevOps/Lead developer
- **Update**: When setup process changes
- **Rule**: Keep concise, link to detailed docs

---

## Documentation Folders

### `/docs/testing/` - Test Documentation
- `TEST_GUIDE.md` - How to run tests, write tests
- `TEST_RESULTS.md` - Latest test run results (auto-generated)
- **Rule**: Keep only current test guide and latest results

### `/docs/completed/` - Completed Work
- Archive of completed epics, sprints, milestones
- Named by date: `2026-01-EPIC-15-COMPLETION.md`
- **Rule**: Move here when work is done, review quarterly for deletion

### `/docs/archive/` - Historical Reference
- Old documentation that might be useful
- Design decisions
- Migration guides
- **Rule**: Move here instead of deleting, review yearly for deletion

### `/docs/guides/` - How-To Guides
- Coding standards
- Deployment guides
- Architecture decisions
- **Rule**: Keep evergreen content, update as needed

---

## File Lifecycle

### Active → Completed → Archive → Delete

1. **Active** (root level)
   - Currently being used
   - Updated frequently
   - Referenced daily/weekly

2. **Completed** (`/docs/completed/`)
   - Work is done
   - Kept for reference
   - Reviewed quarterly

3. **Archive** (`/docs/archive/`)
   - Historical value only
   - Rarely accessed
   - Reviewed yearly

4. **Delete**
   - No longer relevant
   - Information captured elsewhere
   - Outdated/obsolete

---

## Rules for Creating New Files

### ❌ DON'T Create New Files For:
- Completion summaries (update TASKS.md instead)
- Test results (use `/docs/testing/TEST_RESULTS.md`)
- Bug fixes (update ISSUES.md instead)
- Status updates (update PROJECT_STATUS.md instead)
- Temporary notes (use comments in code or delete after)

### ✅ DO Create New Files For:
- New major features (in `/docs/guides/`)
- Significant architecture changes (in `/docs/guides/`)
- Migration guides (in `/docs/guides/`)
- **But**: Always ask "Can this go in an existing file?" first

---

## File Naming Convention

### Active Files (Root)
- `UPPERCASE_WORDS.md` (e.g., `TASKS.md`, `ISSUES.md`)
- Short, descriptive names
- No dates, no version numbers

### Completed Work (`/docs/completed/`)
- `YYYY-MM-DESCRIPTION.md` (e.g., `2026-01-EPIC-15-COMPLETION.md`)
- Include date for easy sorting
- Descriptive name

### Guides (`/docs/guides/`)
- `Title_Case_With_Underscores.md` (e.g., `Coding_Standards.md`)
- Descriptive, evergreen names
- No dates

### Archive (`/docs/archive/`)
- `YYYY-MM-DESCRIPTION.md` or original name
- Include date if not already present

---

## Update Frequency

| File | Update Frequency | Trigger |
|------|------------------|---------|
| `TASKS.md` | Daily | Task changes |
| `ISSUES.md` | As needed | Bug found/fixed |
| `PROJECT_STATUS.md` | Weekly | Major milestones |
| `README.md` | Rarely | Project scope changes |
| `QUICKSTART.md` | As needed | Setup changes |
| `/docs/testing/TEST_GUIDE.md` | As needed | Test process changes |
| `/docs/guides/*` | As needed | Standards change |

---

## Consolidation Rules

### When You Find Multiple Files About the Same Thing:

1. **Identify the canonical file** (usually the one in root)
2. **Merge content** into canonical file
3. **Move old files** to `/docs/completed/` or `/docs/archive/`
4. **Update links** in other files
5. **Delete duplicates** after 30 days if not needed

### Example:
```
Found:
- COMPREHENSIVE_TEST_REPORT.md
- E2E_TEST_RESULTS.md
- TEST_ANALYSIS_REPORT.md
- TEST_FAILURE_ANALYSIS.md
- TEST_SUITE_SUMMARY.md
- TESTING_GUIDE_PHASE1.md

Action:
1. Create `/docs/testing/TEST_GUIDE.md` (consolidate all guides)
2. Create `/docs/testing/TEST_RESULTS.md` (latest results only)
3. Move old files to `/docs/completed/2026-01-TEST-REPORTS.md` (merged)
4. Update TASKS.md and ISSUES.md to reference new locations
5. Delete old files after verification
```

---

## Maintenance Schedule

### Weekly
- Review TASKS.md - remove completed tasks
- Review ISSUES.md - remove fixed issues
- Update PROJECT_STATUS.md - current state only

### Monthly
- Review root directory - move completed work to `/docs/completed/`
- Review `/docs/testing/` - keep only current guide and latest results
- Update README.md if needed

### Quarterly
- Review `/docs/completed/` - move to archive or delete
- Review `/docs/guides/` - update or remove outdated guides
- Clean up any stray files

### Yearly
- Review `/docs/archive/` - delete truly obsolete files
- Review entire documentation structure
- Update this guide if needed

---

## Enforcement

### Before Creating a New MD File:

1. **Ask**: Can this go in an existing file?
2. **Check**: Is there already a file for this topic?
3. **Decide**: Is this temporary or permanent?
4. **If temporary**: Use comments or delete after use
5. **If permanent**: Follow naming conventions and folder structure

### Before Committing:

1. **Check**: Are there any new MD files in root?
2. **Verify**: Do they belong there or should they be in `/docs/`?
3. **Clean**: Move completed work to appropriate folders
4. **Update**: Ensure TASKS.md and ISSUES.md are current

---

## Quick Reference

### Where Does This Go?

| Content Type | Location | Example |
|--------------|----------|---------|
| Active tasks | `TASKS.md` | User stories, sprints |
| Active bugs | `ISSUES.md` | Current bugs, issues |
| Current status | `PROJECT_STATUS.md` | Health, metrics, next steps |
| Getting started | `QUICKSTART.md` | Install, run, test |
| Project overview | `README.md` | What, why, how |
| Test guide | `/docs/testing/TEST_GUIDE.md` | How to test |
| Test results | `/docs/testing/TEST_RESULTS.md` | Latest run |
| Coding standards | `/docs/guides/Coding_Standards.md` | Code style, patterns |
| Completed work | `/docs/completed/YYYY-MM-*.md` | Done epics, sprints |
| Historical docs | `/docs/archive/` | Old decisions, migrations |

---

## Examples of Good vs. Bad

### ❌ Bad
```
Root directory:
- TASKS.md
- ISSUES.md
- PROJECT_STATUS.md
- EPIC-15_COMPLETION.md
- EPIC-14_COMPLETION.md
- PHASE2_COMPLETION_SUMMARY.md
- TEST_ANALYSIS_REPORT.md
- TEST_FAILURE_ANALYSIS.md
- TEST_SUITE_SUMMARY.md
- COMPREHENSIVE_TEST_REPORT.md
- E2E_TEST_RESULTS.md
- TESTING_GUIDE_PHASE1.md
- VERIFICATION_REPORT.md
- 100_PERCENT_ACHIEVEMENT.md
- GAP_FIXES_REPORT.md
- BUG_FIX_SUMMARY.md
- DESCRIPTIONS_TOOLTIPS_COMPLETE.md
- DOCUMENTATION_REVIEW_SUMMARY.md
- PENDING_TASKS_SUMMARY.md
- CRITICAL_DISCOVERY.md
- BOLDIN_GAP_ANALYSIS.md
- BUG-004_SETTINGS_SIDEBAR_FIX.md
```

### ✅ Good
```
Root directory:
- README.md
- TASKS.md
- ISSUES.md
- PROJECT_STATUS.md
- QUICKSTART.md

/docs/testing/:
- TEST_GUIDE.md
- TEST_RESULTS.md

/docs/guides/:
- Coding_Standards.md
- Deployment_Guide.md

/docs/completed/:
- 2026-01-EPIC-15-COMPLETION.md
- 2026-01-TEST-SUITE-IMPLEMENTATION.md

/docs/archive/:
- (empty or minimal)
```

---

## Summary

**Keep it simple:**
- 5 files in root (max)
- Organized folders for everything else
- Regular cleanup
- Delete obsolete files

**Keep it current:**
- Update TASKS.md and ISSUES.md frequently
- Archive completed work
- Remove outdated information

**Keep it consolidated:**
- One file per topic
- Merge duplicates
- Link instead of duplicate

---

**Last Updated**: 2026-01-24  
**Review Schedule**: Quarterly  
**Owner**: Project Lead
