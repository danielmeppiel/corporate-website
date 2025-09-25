---
mode: agent
description: Guide an AI agent through a structured process to assess documentation coverage, identify **AI Agent Instructions:**
author: Daniel Meppiel
mcp:
  - ghcr.io/github/github-mcp-server
---

# Documentation Assistant: Coverage Analysis and Issue Creation

This workflow guides AI agents through a systematic approach to analyze documentation coverage, identify gaps, and create concise, actionable GitHub issues for documentation improvements.

## AI Agent Instructions

**Core Principles:**
- Keep documentation issues SHORT and ACTIONABLE (max 250 words per issue)
- Focus on essential documentation that developers need
- Create issues that can be completed independently
- Use clear, unambiguous language
- Prioritize user-facing and contributor-facing documentation

**Documentation Standards:**
- **README.md**: Project overview, installation, basic usage
- **ARCHITECTURE.md**: System design, components, data flow with mermaid diagrams. Ensure you verify mermaid syntax is correct and create the diagrams taking accessibility guidelines into account (styling, colors, etc.).
- **Code Comments**: All public classes, methods, and complex logic documented in any programming language

## 0. Project Assessment Phase (MANDATORY FIRST STEP)

**AI Agent Actions:**
1. Use `file_search` to find existing documentation files:
   - README.md, ARCHITECTURE.md, CONTRIBUTING.md
   - Any /docs folder or documentation directories
   - API documentation, user guides, etc.

2. Use `semantic_search` to find major code components:
   - Main classes and their purposes
   - Key functions and their roles
   - Entry points and core workflows

**Documentation Inventory Checklist:**
- [ ] README.md exists and covers basics?
- [ ] ARCHITECTURE.md exists with system overview?
- [ ] Major classes have docstrings?
- [ ] Public methods have clear comments?
- [ ] Complex logic has explanatory comments?
- [ ] Installation/setup instructions present?

**Output:** 2-3 sentence summary of current documentation state.

## 1. Documentation Coverage Analysis

**AI Agent Actions:**
- Use `read_file` to examine existing documentation quality
- Use `grep_search` to find undocumented classes and functions
- Use `list_dir` to understand project structure for architecture analysis

**Quality Assessment Criteria:**

### README.md Analysis
- [ ] Project name and one-sentence description
- [ ] Installation instructions
- [ ] Basic usage examples
- [ ] Contribution guidelines link
- [ ] License information

### ARCHITECTURE.md Analysis (if exists)
- [ ] High-level system overview
- [ ] Main components and their responsibilities
- [ ] Data flow diagrams (mermaid)
- [ ] Key architectural decisions
- [ ] Module interaction patterns

### Code Documentation Analysis
- [ ] Public classes have docstrings/comments
- [ ] Public methods have parameter descriptions
- [ ] Complex algorithms have explanatory comments
- [ ] Module-level documentation exists
- [ ] Return values and exceptions documented (language-appropriate format)

**Output:** Structured assessment of current vs. target documentation coverage.

## 2. Gap Identification Phase (Maximum 8-10 grouped tasks)

**AI Agent Actions:**
- Compare current documentation against standards
- Use `semantic_search` to find complex code lacking comments
- Identify missing architectural documentation
- **GROUP related gaps to avoid issue explosion**
- Focus on logical modules/components, not individual files

**Grouping Strategy:**
1. **File-level gaps**: Group by document type (README, ARCHITECTURE, CONTRIBUTING)
2. **Module-level gaps**: Group by functional area/package/namespace
3. **Component-level gaps**: Group related classes/interfaces together
4. **Layer-level gaps**: Group by architectural layer (API, core, data, etc.)

**Gap Categories:**
1. **Missing Files**: README, ARCHITECTURE, or key documentation files
2. **Incomplete Content**: Existing docs missing critical sections
3. **Undocumented Modules**: Groups of related source files without proper documentation
4. **Missing Diagrams**: Architecture lacks visual representation
5. **Setup Issues**: Installation or contribution instructions unclear

**SCOPE PREVENTION:**
- ❌ Do NOT create one issue per file
- ❌ Do NOT suggest extensive user manuals unless project is user-facing
- ❌ Do NOT require documentation for internal/private methods
- ❌ Do NOT create separate issues for similar files in same module
- ✅ Group related files by functional area or component
- ✅ Focus on documentation that helps contributors understand and extend the code

**Output:** List of 5-10 grouped documentation tasks with:
- Task type (Missing File/Incomplete Content/Module Documentation/Missing Diagram)
- Scope: specific module/component/document affected
- Files included: list of related files to document together
- Why it matters for developers/users

## 3. Documentation Specification Phase

- Validate list of GitHub Issues to be created (only their titles and scopes) with the user.
- You MUST get the user's confirmation before proceeding to the next phase!

## 4. GitHub Issue Creation Phase

**AI Agent Instructions:**
- Keep each specification under 200 words
- Focus on specific, measurable deliverables
- Include examples of good documentation when helpful
- Specify exact files and sections to create/update

**AI Agent Actions:**
- Use `mcp_github_create_issue` for each documentation task
- Keep title under 50 characters
- Keep body under 250 words total
- Add labels: `documentation`, `good first issue`, and effort level (`small`, `medium`, `large`)

**Issue Template (MANDATORY FORMAT):**

```
## What
[One sentence: what documentation to create/improve]

## Why
[One sentence: who benefits and how]

## Deliverables
- **Target:** `src/module_name/` or `documentation/file.md` (update multiple files/create new)
- **Content:** 
  - [Specific module/component to document] or [Specific section to add]
  - [Related classes/functions in same functional area]
- **Format:** [Language-appropriate comments/docstrings/markdown]
- **Scope:** [Target coverage, e.g., "all public APIs in user management module"]

## Content Guidelines
- [Specific requirement 1]
- [Specific requirement 2]
- [Style/format requirement]

## Done ✅
- [ ] [Specific measurable outcome]
- [ ] [Another specific outcome]
- [ ] Follows project documentation standards

**Effort:** [Small/Medium/Large]
**Good first issue:** [Yes/No]
```

**Documentation Batch Logic:**
- **Batch 1**: Critical missing files (README.md, ARCHITECTURE.md)
- **Batch 2**: Core module documentation (main packages/namespaces in source files)
- **Batch 3**: Supporting files and remaining module documentation
- **Batch 4**: Enhanced documentation (diagrams, examples, advanced guides)

## 5. Validation and Summary Phase

**AI Agent Final Checks:**
- [ ] All issues are under 250 words
- [ ] Each issue produces specific, measurable documentation
- [ ] Issues are properly batched for parallel work
- [ ] All issues use the mandatory template format
- [ ] Effort estimates are realistic
- [ ] All identified gaps have corresponding issues

**Summary Output:**
```
Created [X] documentation issues for [project name]:

Batch 1 (Critical Files - Start First):
1. [Issue title] - [Small/Medium/Large] - [README.md/ARCHITECTURE.md]

Batch 2 (Core Modules - Can run in parallel):
2. [Issue title] - [Small/Medium/Large] - [src/auth_module/ documentation]
3. [Issue title] - [Small/Medium/Large] - [src/core_package/ comments]

Batch 3 (Supporting - Mixed files and remaining modules):
4. [Issue title] - [Small/Medium/Large] - [CONTRIBUTING.md/remaining modules]

Total estimated effort: [X] hours/days
Current documentation coverage: [X]% → Target: [Y]%
```

## AI Agent Error Prevention

**Common Mistakes to Avoid:**
- ❌ Creating documentation issues longer than 250 words
- ❌ Creating one issue per source file (group by module/component instead)
- ❌ Asking for documentation of private/internal methods
- ❌ Requiring extensive user manuals for developer tools
- ❌ Creating vague deliverables like "improve documentation"
- ❌ Missing effort estimation or target modules/components
- ❌ Not specifying language-appropriate documentation format
- ❌ Ignoring project's primary programming language conventions

**Success Criteria:**
- ✅ Each issue results in specific documentation artifact
- ✅ A contributor can complete the task without clarification
- ✅ Documentation serves a clear purpose for target audience
- ✅ Issues can be worked on independently or in logical batches

**Target Documentation State:**
- README.md: Complete project overview with setup/usage
- ARCHITECTURE.md: System design with mermaid diagrams. Ensure you verify mermaid syntax is correct and create the diagrams taking accessibility guidelines into account (styling, colors, etc.).
- Code: All public modules and components documented with language-appropriate comments
- Setup: Clear contribution and development instructions
- Coverage: 80%+ of public API documented with appropriate comment style for the language
