# .cursorrules Update Summary

**Date**: 2026-01-24  
**Action**: Enhanced .cursorrules with critical safety rules and project context

---

## What Was Added

### 1. 🚨 Critical Safety Rules

Added **NEVER RUN** commands section at the very top:

```bash
# ABSOLUTELY FORBIDDEN:
rm -rf /
rm -rf ~
rm -rf *
format c:
del /f /s /q
rmdir /s /q
:(){:|:&};:
dd if=
mkfs.
> /dev/sda
chmod -R 777 /
```

**Purpose**: Prevent accidental system destruction

---

### 2. 🧠 AI Assistant Context

Added project overview section:

- **Project Name**: RetireFire
- **Purpose**: High-fidelity financial planning application
- **Target**: Rival RightCapital, eMoney, ProjectionLab
- **Tech Stack**: React, Vite, Tailwind CSS, Chart.js
- **Audience**: CFA/CFP-level professionals

**Purpose**: Give AI context about what it's working on

---

### 3. 📋 Mandatory Workflow

Added workflow requirements:

**Before Answering Complex Questions:**
- Query Pinecone for past context
- Check existing documentation
- Review .cursorrules

**When User Makes Design Decisions:**
- Automatically save to Pinecone
- Update relevant documentation
- Document in code comments

**Purpose**: Ensure AI uses available context and saves decisions

---

### 4. 📝 Continuous Documentation Updates

Added "Update As You Go" section:

**Always update during work:**
1. **TASKS.md** - Mark complete (✅), don't remove
2. **ISSUES.md** - Add issues, document resolutions
3. **PROJECT_STATUS.md** - Update after milestones
4. **README.md** - Update when scope changes
5. **QUICKSTART.md** - Update when setup changes

**Purpose**: Keep documentation current, not just at end

---

### 5. 🧪 Testing Requirements

Added testing rules:

**Before Marking Task as Done:**
1. Run `npm test`
2. Fix any failures
3. Check for regressions
4. Update test results

**Lint Errors:**
- Run and fix all lint errors
- No warnings in production
- Follow ESLint rules strictly

**Purpose**: Ensure quality before completion

---

### 6. 🧹 Cleanup Rules

Added cleanup requirements:

**Log Files:**
- Clean up old *.txt log files after use
- Move to `/docs/completed/` if needed
- Delete if no longer needed

**White Screen Issues:**
- Always verify app is working
- Check console for errors
- Test in browser before marking complete

**Purpose**: Keep project clean and functional

---

## File Structure

### New .cursorrules Structure

```
1. 🚨 CRITICAL SAFETY RULES
   - NEVER RUN commands
   - Safety warnings

2. 🧠 AI ASSISTANT CONTEXT
   - Project overview
   - Tech stack
   - Target audience

3. 📋 MANDATORY WORKFLOW
   - Before answering questions
   - When user makes decisions
   - Files to always follow

4. 📝 CONTINUOUS DOCUMENTATION UPDATES
   - Update as you go
   - Which files to update
   - When to update them

5. 🧪 TESTING REQUIREMENTS
   - Before marking done
   - Lint errors
   - Quality standards

6. 🧹 CLEANUP RULES
   - Log files
   - White screen issues
   - General cleanup

7. 📂 DOCUMENTATION STRUCTURE RULES
   - [Existing rules]
   - Only 5 MD files in root
   - File lifecycle
   - Etc.

8. [All other existing sections]
```

---

## Key Changes

### What's New

1. **Safety First** - NEVER RUN commands at the very top
2. **Project Context** - AI knows what it's working on
3. **Pinecone Integration** - Query before answering, save decisions
4. **Continuous Updates** - Update docs as you go, not at end
5. **Testing Mandatory** - Run tests before marking done
6. **Cleanup Required** - Clean up log files, verify app works

### What Stayed the Same

- All existing documentation rules
- File structure rules (5 MD files in root)
- File lifecycle (Active → Completed → Archive → Delete)
- Mandatory actions (when completing tasks, fixing bugs, etc.)
- Code quality rules
- Project-specific rules

---

## Impact

### For AI Assistants

- ✅ Clear safety boundaries (NEVER RUN commands)
- ✅ Project context (knows what RetireFire is)
- ✅ Workflow guidance (query Pinecone, check docs)
- ✅ Documentation requirements (update as you go)
- ✅ Quality standards (test before done)

### For Developers

- ✅ Clear rules to follow
- ✅ Safety guardrails
- ✅ Documentation standards
- ✅ Testing requirements
- ✅ Cleanup expectations

### For Project

- ✅ Prevents destructive commands
- ✅ Maintains documentation quality
- ✅ Ensures testing coverage
- ✅ Keeps codebase clean
- ✅ Preserves institutional knowledge (Pinecone)

---

## Compliance

### How to Verify Compliance

**Before Every Commit:**

1. **Safety Check**
   ```bash
   # Review commands - none should be in NEVER RUN list
   git diff
   ```

2. **Documentation Check**
   ```bash
   # Verify TASKS.md and ISSUES.md updated
   git status
   ```

3. **Testing Check**
   ```bash
   # All tests must pass
   npm test
   ```

4. **File Structure Check**
   ```bash
   # Only 5 MD files in root
   ls *.md
   ```

5. **Cleanup Check**
   ```bash
   # No stray log files
   ls *.txt
   ```

---

## Summary

**What Changed**: Enhanced .cursorrules with safety rules, project context, and workflow requirements

**Why**: To ensure AI assistants and developers follow best practices, maintain documentation, and avoid destructive actions

**Result**: Comprehensive project rules that cover safety, quality, documentation, testing, and cleanup

**Enforcement**: Mandatory - review before every commit

---

**Last Updated**: 2026-01-24  
**File Modified**: `.cursorrules`  
**Lines Added**: ~130  
**Status**: ✅ Complete
