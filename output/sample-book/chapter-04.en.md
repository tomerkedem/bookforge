# Chapter 3: Subagents — Proper Division of Work

## Why One Agent Is Not Enough

Let's return for a moment to our task: take a book in Word or PDF format and build from it a digital reading platform in two languages.

If you give this task to one agent, one of three things will happen.

- It will try to do everything at once and produce code that mixes content extraction, translation, design, and construction in one unmaintainable file.

- Or it will run out of context in the middle and stop.

- Or it will make wrong decisions because it's trying to think about too many things simultaneously.

The solution is a principle every software engineer knows: separation of concerns. Each component is responsible for one thing only.

In Claude Code these components are called Subagents.

## What is a Subagent

A Subagent is a specialized agent that runs in its own separate context window. It receives a task from the main agent, executes it, and returns a result. The main agent is not filled with the details of every investigation — it only receives the final result.

This means three things in practice:

First, each agent can specialize.

Explorer doesn't need to know how to translate.

Translator doesn't need to know how to build a React component.

Second, the context window remains clean. The main agent is not filled with code reads and intermediate results.

Third, tasks can be routed to cheaper models.

Explorer that only reads files can run on Haiku.

Quality Gate that makes complex decisions will run on Sonnet.

## BookForge's Eleven Agents

Before building each agent, it is important to understand the precise role of each one and the order in which they operate.

The complete agent map of BookForge is in the preparation chapter. Here is the order in which they actually operate:

## Creation, Tools, Model for Each Agent

Each subagent in Claude Code is defined in a Markdown file in the `.claude/agents/` directory. The file contains two parts: frontmatter with the technical settings, and the file body with the agent's instructions.

## All Eleven BookForge Agents

Below are the definitions of each agent, ready to be inserted into their respective files in the `.claude/agents` directory.

**explorer.md**

```markdown
---
name: explorer
description: >
  Scans a Word or PDF file and reports on its structure.
  Activate me before any action on a new file.
model: haiku
tools:
  - read
---

You are Explorer. Your role is one: to read and report.

Do not change anything. Do not parse. Do not translate.

Read the file and return with JSON containing:
- number of chapters
- title of each chapter
- whether there are images
- source language
```

**parser.md**

```markdown
---
name: parser
description: >
  Extracts chapters from a Word or PDF file while preserving
  full structure: headings, bullets, tables, and images.
  Activate me after Explorer.
model: sonnet
tools:
  - read
  - write
---

You are Parser. Your role: to extract and save.

For each chapter create a separate MD file named chapter-XX.he.md.

Preserve all of the following in standard Markdown format:
- headings and subheadings
- bold and italic text
- numbered lists and bullet points
- tables
- quotes

Images: extract to assets/chapter-XX/ and add a reference in the MD file.

Do not translate. Do not change content. Only extract and save.
```

**content-architect.md**

```markdown
---
name: content-architect
description: >
  Receives the chapters extracted by Parser and decides on
  the final content structure before organization.
  Activate me after Parser.
model: sonnet
tools:
  - read
  - write
---

You are Content Architect. Your role: to decide on structure.

Read all chapter-XX.he.md files and create a
content-structure.json containing:
- chapter order
- relationships between chapters
- intro and summary chapters
- navigation recommendations for Yuval

Do not change content. Only map and decide on structure.
```

**organizer.md**

```markdown
---
name: organizer
description: >
  Organizes MD files in the final structure according to Content
  Architect's decisions. Activate me after content-architect.
model: haiku
tools:
  - read
  - write
---

You are Organizer. Your role: to sort and organize.

Read content-structure.json and arrange the files:
output/{book-name}/chapter-01.he.md
output/{book-name}/chapter-02.he.md
output/{book-name}/assets/chapter-01/

Do not change content. Only move and organize.
```

**translator.md**

```markdown
---
name: translator
description: >
  Translates every MD file from Hebrew to English while preserving
  full structure. Activate me after Organizer.
model: sonnet
tools:
  - read
  - write
---

You are Translator. Your role: to translate only.

For each chapter-XX.he.md file create chapter-XX.en.md.

Preserve all of the following:
- original heading structure
- emphasis and bullets
- tables
- image references

Translate naturally, not literally.

Do not change structure. Do not add content. Only translate.
```

**ui-designer.md**

```markdown
---
name: ui-designer
description: >
  Defines Yuval's design system before Builder starts building.
  Activate me once at the start of the project.
model: sonnet
tools:
  - read
  - write
---

You are UI Designer. Your role: to define the design system.

Create a design-system.json containing:
- color palette
- fonts and sizes
- basic components: book card, reading page, navigation
- RTL rules for Hebrew
- LTR rules for English

Every component that Builder writes must be based on this document.
```

**builder.md**

```markdown
---
name: builder
description: >
  Builds Astro components based on the design system
  and MD content. Activate me after ui-designer.
model: sonnet
tools:
  - read
  - write
  - bash
---

You are Builder. Your role: to build code only.

Build Astro components according to design-system.json.

Every component must:
- support Hebrew and English
- use existing shared components
- comply with SOLID principles
- include TypeScript types

Do not decide on design. Do not change design-system.json.
```

**memory-keeper.md**

```markdown
---
name: memory-keeper
description: >
  Maintains consistency throughout the project. Activate me
  before every new architectural decision.
model: sonnet
memory: user
tools:
  - read
  - write
---

You are Memory Keeper. Your role: to remember and ensure consistency.

Before every new decision check that it is consistent with:
- design-system.json
- content-structure.json
- all decisions recorded in tasks/lessons.md

If there is a conflict, report to the main agent before continuing.
```

**error-handler.md**

```markdown
---
name: error-handler
description: >
  Identifies errors and fixes them. Activate me when another
  agent encounters an error it cannot resolve.
model: sonnet
tools:
  - read
  - write
  - bash
---

You are Error Handler. Your role: to identify and fix errors.

When you receive an error:
1. Identify the root cause
2. Check if the solution exists in tasks/lessons.md
3. Fix the problem
4. Document the solution in tasks/lessons.md

Do not continue if you are not sure of the solution. Report to the main agent.
```

**code-reviewer.md**

```markdown
---
name: code-reviewer
description: >
  Reviews code that Builder wrote before moving to the next stage.
  Activate me after every new component that is written.
model: sonnet
tools:
  - read
---

You are Code Reviewer. Your role: to review only.

For each component you receive, check:
- compliance with SOLID principles
- use of existing shared components
- Hebrew and English support
- valid TypeScript types
- no duplicated code

Return a findings report only. Do not fix yourself.
```

**quality-gate.md**

```markdown
---
name: quality-gate
description: >
  The final quality gate. Activate me before every commit.
  If I don't approve, the work is not done.
model: sonnet
tools:
  - read
  - bash
---

You are Quality Gate. Your role: to approve or reject.

Before every commit ask one question:

"Would a staff engineer approve this?"

If the answer is not clear, return the work.

Check:
- all tests pass
- no files forgotten
- code-reviewer has approved
- memory-keeper has approved consistency

Only if everything is correct, approve to continue.
```

Choose the most recent Haiku model available in your account. Check the list of available models at code.claude.com.

Note three things:

First, `model: claude-haiku-4-5`. Explorer only reads and reports. There is no reason to run it on Sonnet. Haiku is cheaper and faster for scanning.

Second, `tools: read` only. Explorer cannot write, cannot delete, cannot run commands. Limiting the tools is a safety layer.

Third, the description is written in a way that explains to the main agent when to call it. Claude Code autonomously decides when to pass a task to each agent based on the description.

*Current as of April 2026. Check the official documentation at code.claude.com before implementing.*

## What to Do Now

Create all the files in the `.claude/agents/` directory:

**Windows:**
```powershell
ni .claude\agents\explorer.md
ni .claude\agents\parser.md
ni .claude\agents\content-architect.md
ni .claude\agents\organizer.md
ni .claude\agents\translator.md
ni .claude\agents\ui-designer.md
ni .claude\agents\builder.md
ni .claude\agents\memory-keeper.md
ni .claude\agents\error-handler.md
ni .claude\agents\code-reviewer.md
ni .claude\agents\quality-gate.md
```

**Mac / Linux:**
```bash
touch .claude/agents/{explorer,parser,content-architect,organizer,translator,ui-designer,builder,memory-keeper,error-handler,code-reviewer,quality-gate}.md
```

Copy the content of each agent to the appropriate file.

*Current as of April 2026. Check the official documentation at code.claude.com before implementing.*

## Bilingual Output: chapter-01.he.md and chapter-01.en.md

One of the architectural decisions made in Chapter 1 is that each chapter is produced in two languages simultaneously. This is not simple automatic translation. This is a system that produces two complete products from the same source.

This is what BookForge's output looks like after the agents finish their work:

```
output/
└── ai-developer-fitness/
    ├── chapter-01.he.md
    ├── chapter-01.en.md
    ├── chapter-02.he.md
    ├── chapter-02.en.md
    └── assets/
        ├── chapter-01/
        │   ├── image-01.png
        │   └── image-02.png
        └── chapter-02/
            └── image-01.png
```

Each Hebrew file contains the original content with all structure preserved: headings, bullets, tables, and images. Each English file is a complete translation with exactly the same structure.

Yuval reads both files and serves the correct one based on the user's saved preference.

## What to Do Now

Create the output directory:

**Windows:**
```powershell
ni -ItemType Directory output
ni -ItemType Directory output\ai-developer-fitness
ni -ItemType Directory output\ai-developer-fitness\assets
```

**Mac / Linux:**
```bash
mkdir -p output/ai-developer-fitness/assets
```

## Chaining Between Agents

Chaining is the pattern where the output of one agent becomes the input of the next. This is the heart of the BookForge system.

Without chaining, each agent works in a bubble. With chaining, the agents create a pipeline that flows from end to end.

This is how chaining looks in practice in CLAUDE.md:

```markdown
## Agent Activation Order

When receiving a Word or PDF file for processing:

1. Activate Explorer on the file
   Input: file path
   Output: JSON with book structure

2. Activate Parser
   Input: file path + JSON from Explorer
   Output: chapter-XX.he.md files

3. Activate Content Architect
   Input: all chapter-XX.he.md files
   Output: content-structure.json

4. Activate Organizer
   Input: content-structure.json + MD files
   Output: organized folder structure in output/

5. Activate Translator
   Input: all chapter-XX.he.md files
   Output: all chapter-XX.en.md files

6. Activate UI Designer
   Input: content-structure.json
   Output: design-system.json

7. Activate Builder
   Input: all MD files + design-system.json
   Output: Astro components

8. Activate in parallel: Memory Keeper, Error Handler, Code Reviewer
   Input: Builder output
   Output: findings reports

9. Activate Quality Gate
   Input: all reports
   Output: approval or rejection
```

Three important things in this definition:

First, each step defines exactly what it receives and what it returns. The main agent knows when one step has ended and when to activate the next.

Second, step 8 runs three agents in parallel. Memory Keeper, Error Handler, and Code Reviewer are not dependent on each other and can run simultaneously.

Third, Quality Gate is always last. Nothing leaves the system without its approval.

Add the chaining definition to your CLAUDE.md under the heading "Agent Activation Order."

## The Code in Action

The complete code for this chapter is available at: https://github.com/tomkedem/bookforge

Review the changes, run them, and ask questions directly in Issues.

**What's on GitHub now**

```
bookforge/
├── README.md
├── CLAUDE.md
├── .gitignore
├── docs/
│   └── architecture-thinking.md
├── tasks/
│   ├── todo.md
│   └── lessons.md
├── output/
│   └── ai-developer-fitness/
│       └── assets/
└── .claude/
    └── agents/
        ├── explorer.md
        ├── parser.md
        ├── content-architect.md
        ├── organizer.md
        ├── translator.md
        ├── ui-designer.md
        ├── builder.md
        ├── memory-keeper.md
        ├── error-handler.md
        ├── code-reviewer.md
        └── quality-gate.md
```
