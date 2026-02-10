# Corporate Website - APM Enterprise Showcase

> **🚀 This project demonstrates [APM CLI](https://github.com/danielmeppiel/apm) capabilities** - Skills give agents powers, guardrails keep them compliant.

**Enterprise-grade web development with AI capabilities + automatic compliance** - Watch `form-builder` skill create contact forms while `compliance-rules` ensures GDPR compliance.

## What APM Dependencies Provide

📦 **Skills + Guardrails working together**:

- **[form-builder](https://github.com/danielmeppiel/form-builder)** - React Hook Form + Zod validation patterns (Skill: what agents CAN DO)
- **[compliance-rules](https://github.com/danielmeppiel/compliance-rules)** - GDPR, security, audit requirements (Guardrail: what agents MUST FOLLOW)
- **[design-guidelines](https://github.com/danielmeppiel/design-guidelines)** - Accessibility, UI/UX standards (Guardrail)

## The Skill + Guardrails Tension

🎯 **The narrative**: `form-builder` gives your agent the *power* to build forms. `compliance-rules` ensures those forms are *GDPR compliant*.

```
User: "Build a contact form"

┌─ form-builder (Skill) ──────────────────────────┐
│ ✓ React Hook Form for controlled inputs        │
│ ✓ Zod schema for validation                    │
│ ✓ Accessible form patterns                     │
└─────────────────────────────────────────────────┘
            ↓ constrained by ↓
┌─ compliance-rules (Guardrail) ──────────────────┐
│ ✓ GDPR consent checkbox required                │
│ ✓ Data minimization (only collect what's needed)│
│ ✓ Audit logging for form submissions           │
└─────────────────────────────────────────────────┘
```

**Result**: AI builds a production-ready, compliant contact form.

## Quick Start (2 minutes)

> [!NOTE] 
> **📋 APM Setup Required**: First install APM CLI from [github/apm-cli](https://github.com/github/apm-cli) - follow their setup guide for tokens and runtime configuration.

```bash
# 1. Clone and enter the project
git clone https://github.com/github/corporate-website
cd corporate-website

# 2. Install APM dependencies (compliance + design packages)
apm install

# 3. Generate AGENTS.md with enterprise context
apm compile

# 4. Run your first enterprise workflow
# This will trigger hello-world.prompt.md as defined in apm.yml
apm run start
```

**That's it!** Your project now has enterprise-grade AI workflows with automatic compliance and design enforcement.

### Example `apm.yml` - Skills + Guardrails Composition

Here's how skills and guardrails compose together:

```yaml
name: corporate-website
version: 1.0.0
description: Corporate website with form building and compliance
author: Corporate Team

dependencies:
  apm:
    - danielmeppiel/form-builder        # Skill: form building capability
    - danielmeppiel/compliance-rules    # Guardrail: GDPR, security
    - danielmeppiel/design-guidelines   # Guardrail: UI/UX standards

scripts:
  start: "codex --skip-git-repo-check hello-world.prompt.md"
  
  # Compliance workflows (automatically discovered from dependencies)
  audit: "codex --skip-git-repo-check compliance-audit.prompt.md"
  gdpr-check: "codex gdpr-assessment.prompt.md"
  legal-review: "codex --skip-git-repo-check legal-review.prompt.md"
  
  # Design workflows (automatically discovered from dependencies)
  accessibility: "codex --skip-git-repo-check accessibility-audit.prompt.md"
  design-review: "codex --skip-git-repo-check design-review.prompt.md"
  style-check: "codex style-guide-check.prompt.md"
```

## What You Just Built

- **Enterprise Workflows** - Compliance audits, accessibility checks, legal reviews (.prompt.md files)
- **Context Enforcement** - GDPR rules, design standards automatically applied to AI responses
- **Dependency Composition** - `apm_modules/` with proven enterprise packages from other projects  
- **Universal Compatibility** - Works with any coding agent supporting the [Agents.md standard](https://github.com/joggrdocs/agents.md) (GitHub Copilot, Codex, etc.)

## Key Enterprise Workflows

```bash
apm run audit              # Run GDPR compliance audit
apm run accessibility      # Check WCAG 2.1 AA compliance
apm run design-review      # Validate design system adherence
apm run legal-review       # Legal compliance verification
apm run gdpr-check         # Data handling assessment
```

## 📦 Contoso Product Catalog Migration (Q2 2026)

**Status**: ✅ COMPLETED

This project includes a complete migration of legacy product pages from the Contoso platform to the new Corporate Inc. CMS. The migration ensures full GDPR compliance and WCAG 2.1 AA accessibility standards.

**Features**:
- 5 enterprise products migrated with complete metadata
- GDPR-compliant data transformation with PII sanitization
- WCAG AA accessibility attributes (ARIA labels, semantic HTML)
- Responsive product showcase with grid layout
- Automated migration script with audit trail

**Quick Start**:
```bash
# Run the Contoso migration
npm run migrate:contoso

# View migrated products
npm run dev
# Navigate to http://localhost:3000/#products
```

**Documentation**: See [`contoso-migration/MIGRATION-GUIDE.md`](contoso-migration/MIGRATION-GUIDE.md) for complete migration documentation.

## 🧠 Context Optimization Engine

**The Challenge**: AI agents need exactly the right context for their current task, but loading everything creates cognitive overload, while missing key information breaks workflows.

**APM's Innovation**: Mathematical algorithms that automatically figure out the best places to put your context (standards, rules, guidelines, policies) so AI agents get exactly what they need, when they need it, without information overload.

### How It Works (No Math Degree Required!)

Think of it like organizing a company handbook. You could put everything in one giant manual that everyone carries around, or you could smartly distribute relevant sections to different departments.

APM does this automatically for your project context:

```bash
# See what APM is planning to do
apm compile --verbose --dry-run
```

**Real example from this project** - APM found 9 different context files (standards, compliance rules, guidelines) and had to decide where to put each one:

```
🎯 Smart Distribution Results:
• Design standards → Root level (affects 6 different folder types)
• GDPR compliance → Root level (affects 10 different folder types) 
• API development → backend/api/ only (affects 1 specific folder)
• Testing strategy → tests/ only (affects 3 test-related folders)
• React components → Root level (affects 3 component folders)
```

### The Mathematical Magic (Simplified)

**The Core Problem**: Every instruction needs to be accessible to files that need it, but agents shouldn't be overwhelmed with irrelevant instructions.

**APM's Solution**: Uses "distribution scores" to decide placement:
- **0-30% distribution** → Place locally (like `backend/**/*.py` → goes in `backend/api/AGENTS.md`)
- **30-70% distribution** → Smart multi-placement (verify coverage, fallback to root if needed)
- **70%+ distribution** → Place at root (like `**/*.{py,js,ts,tsx}` → goes in root `AGENTS.md`)

**Why This Matters**: 
- ✅ **Coverage Guarantee**: Every file can access the instructions it needs
- ⚡ **Efficiency**: Agents see mostly relevant context (49.6% efficiency in this project)
- 🧠 **Cognitive Load**: No more overwhelming agents with irrelevant standards

### Real Results: 5 Smart AGENTS.md Files

Instead of one massive file, APM created 5 targeted context files:

1. **Root `/AGENTS.md`** - Design standards, compliance rules, React patterns (broad patterns)
2. **`backend/api/AGENTS.md`** - FastAPI security, database patterns (backend-specific)  
3. **`tests/AGENTS.md`** - Testing strategy, pytest patterns (testing-specific)
4. **`docs/AGENTS.md`** - Documentation standards (docs-specific)
5. **`scripts/deployment/AGENTS.md`** - DevOps patterns (deployment-specific)

**The Result**: When an AI agent works on `backend/api/auth.py`, it automatically inherits:
- Root standards (design + compliance) ← Always relevant
- Backend-specific API patterns ← Highly relevant
- No testing or documentation noise ← Clean context

### Universal Agent Compatibility

✅ Works with **any** coding agent that supports [AGENTS.md](https://agents.md): GitHub Copilot, Cursor, Claude, Codex, etc.

**Architectural Advantage**: APM bridges the gap between maintainable governance (modular `.instructions.md` source files) and universal compatibility (standard `AGENTS.md` output), with smart optimization ensuring agents get exactly the context they need.

---

## Why APM for Enterprise Development?

Replace inconsistent compliance with engineered enterprise standards:

**❌ Before APM**: 
- "Add authentication" → unpredictable compliance violations across team
- Manual accessibility audits catch issues in production  
- Design system violations slip through code review

**✅ With APM Dependencies**: 
- Shared context + structured workflows → consistent, compliant outcomes
- AI agents know GDPR requirements **before** they start coding
- Accessibility and design standards enforced automatically

**The Power**: Your AI agents understand enterprise compliance, accessibility requirements, and design standards from day one.

## Technology Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript with Vite build system
- **APM Dependencies**: Enterprise compliance + design packages
- **AI Compatibility**: Works with GitHub Copilot, Claude Code, Codex, and other [Agents.md](https://github.com/joggrdocs/agents.md) compatible tools

## What APM Dependencies Provide

### From `compliance-rules` Package:
- **🔒 GDPR Compliance**: Data handling, retention policies, audit trails
- **⚖️ Legal Review**: Automated compliance checking workflows  
- **📊 Audit Trails**: User interaction logging for compliance
- **🛡️ Security Standards**: Encryption, authentication requirements

### From `design-guidelines` Package:
- **♿ Accessibility**: WCAG 2.1 AA compliance, screen reader support
- **🎨 Design System**: Color palettes, typography scales, component standards
- **📱 Responsive Design**: Mobile-first, touch target requirements
- **⚡ Performance**: Optimization guidelines, loading strategies

## Available Workflows

### Enterprise Compliance
```bash
apm run audit           # Full enterprise compliance audit
apm run gdpr-check      # GDPR assessment and data handling review
apm run legal-review    # Legal compliance verification
```

### Design & Accessibility
```bash
apm run accessibility   # WCAG 2.1 AA compliance check
apm run design-review   # Design system adherence validation
apm run style-check     # Style guide compliance verification
```

### Development
```bash
npm run dev             # Start development server (http://localhost:3000)
npm run build           # Build for production
apm compile             # Generate AGENTS.md from dependencies
```

## Installation Options

### Enterprise Setup (Recommended)
```bash
git clone https://github.com/github/corporate-website
cd corporate-website
apm install
```

### Development Dependencies
```bash
npm install             # Install Node.js dependencies
apm compile             # Generate context from dependencies
```

## Next Steps

- 📖 [APM CLI Documentation](https://github.com/danielmeppiel/apm) - Complete APM usage guide
- 🚀 [Getting Started with AI-Native Development](https://danielmeppiel.github.io/awesome-ai-native) - Learning path and framework
- 🔧 [form-builder Skill](https://github.com/danielmeppiel/form-builder) - React Hook Form + Zod patterns
- 🏢 [compliance-rules Guardrail](https://github.com/danielmeppiel/compliance-rules) - GDPR compliance package
- 🎨 [design-guidelines Guardrail](https://github.com/danielmeppiel/design-guidelines) - Accessibility and design system
- 🤖 [Agents.md Standard](https://agents.md) - Universal AI agent compatibility

---

**Learning Guide — Awesome AI Native**  
A practical companion guide for AI-Native Development: <https://danielmeppiel.github.io/awesome-ai-native>

A friendly, step-by-step example-driven learning path for AI-Native Development — leveraging APM CLI patterns.

---

**APM transforms enterprise development with reliable, compliant AI workflows**