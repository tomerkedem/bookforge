# Chapter 3: Subagents, Proper Division of Labor

## Why One Agent Isn't Enough

Let's go back for a moment to our task: take a book in Word or PDF format and build a digital reading platform from it in two languages.

If you give that task to one agent, one of three things will happen.

- It will try to do everything at once and generate code that mixes content breakdown, translation, design, and building in one unmaintainable file.

- Or it will run out of context in the middle and stop.

- Or it will make wrong decisions because it's trying to think about too many things at once.

The solution is a principle every software engineer knows: separation of responsibility. Each component is responsible for one thing only.

In Claude Code these components are called Subagents.

## What is a Subagent

A Subagent is a specialized agent that runs in its own separate context window. It receives a task from the main agent, performs it, and returns a result. The main agent doesn't get bogged down in the details of each investigation, it just receives the final result.

This means three things in practice:

**First, each agent can specialize.**

Explorer doesn't need to know how to translate.

Translator doesn't need to know how to build a React component.

**Second, context window stays clean.** The main agent doesn't get bogged down with code reads and intermediate results.

**Third, you can route tasks to cheaper models.**

Explorer that only reads files can run on Haiku.

Quality Gate that makes complex decisions will run on Sonnet.

## The Eleven Agents of BookForge

Before building each agent, it's important to understand the exact role of each one and the order in which they operate.

The complete map of BookForge's agents is in the introduction chapter. Here's the order they actually operate:

1. **Explorer** - Scans the file structure and reports
2. **Parser** - Extracts chapters while preserving structure
3. **Content Architect** - Decides on content organization
4. **Organizer** - Arranges files in final structure
5. **Translator** - Translates to English
6. **UI Designer** - Defines design system
7. **Builder** - Builds Astro components
8. **Memory Keeper** - Maintains consistency
9. **Error Handler** - Identifies and fixes errors
10. **Code Reviewer** - Reviews code quality
11. **Quality Gate** - Final approval

## Creation, Tools, Model for Each Agent

Each subagent in Claude Code is defined in a Markdown file in the /claude/agents/ folder. The file contains two parts: frontmatter with technical settings, and the file body with agent instructions.

The key properties are:

- **name**: The agent's identifier
- **description**: When Claude Code should call this agent
- **model**: Which Claude model to use (Haiku for simple tasks, Sonnet for complex decisions)
- **tools**: What capabilities the agent has (read, write, bash)

## All Eleven Agents of BookForge

Below is the definition of each agent ready to insert into its file in the /claude/agents folder.

### explorer.md

```markdown
---
name: explorer
description: >
  Scans Word or PDF file and reports its structure.
  Run me before any operation on a new file.
model: haiku
tools:
  - read
---

You are Explorer. Your job is one: read and report.

Don't change anything. Don't break down. Don't translate.

Read the file and come back with JSON containing:
- Number of chapters
- Title of each chapter
- Whether there are images
- Source language
```

### parser.md

```markdown
---
name: parser
description: >
  Extracts chapters from Word or PDF file while preserving
  full structure: headings, bullets, tables, and images.
  Run me after Explorer.
model: sonnet
tools:
  - read
  - write
---

You are Parser. Your job: extract and preserve.

For each chapter create a separate MD file named chapter-XX.he.md.

Preserve all of these in standard Markdown format:
- Headings and subheadings
- Bold and italic text
- Numbered and bulleted lists
- Tables
- Quotes

Images: Extract to assets/ folder and add reference in MD file.

Don't translate. Don't change content. Just extract and preserve.
```

### content-architect.md

```markdown
---
name: content-architect
description: >
  Receives chapters extracted by Parser and decides
  on the final content structure before organization.
  Run me after Parser.
model: sonnet
tools:
  - read
  - write
---

You are Content Architect. Your job: decide on structure.

Read all chapter-XX.he.md files and create
content-structure.json containing:
- Order of chapters
- Links between chapters
- Introduction and summary chapters
- Recommendations for navigation in Yuval

Don't change content. Just map and decide on structure.
```

### organizer.md

```markdown
---
name: organizer
description: >
  Arranges MD files in final structure according to decisions
  by Content Architect. Run me after content-architect.
model: haiku
tools:
  - read
  - write
---

You are Organizer. Your job: arrange and organize.

Read content-structure.json and arrange the files:
output/{book-name}/chapter-01.he.md
output/{book-name}/chapter-02.he.md
output/{book-name}/assets/chapter-01/

Don't change content. Just move and arrange.
```

### translator.md

```markdown
---
name: translator
description: >
  Translates each MD file from Hebrew to English while preserving
  full structure. Run me after Organizer.
model: sonnet
tools:
  - read
  - write
---

You are Translator. Your job: translate only.

For each chapter-XX.he.md file create chapter-XX.en.md.

Preserve all of these:
- Original heading structure
- Bold and bullets
- Tables
- Image references

Translate naturally, not literally.

Don't change structure. Don't add content. Just translate.
```

### ui-designer.md

```markdown
---
name: ui-designer
description: >
  Defines Yuval's design system before Builder starts building.
  Run me once at the beginning of the project.
model: sonnet
tools:
  - read
  - write
---

You are UI Designer. Your job: define design system.

Create design-system.json file containing:
- Color palette
- Fonts and sizes
- Basic components: book card, reading page, navigation
- RTL rules for Hebrew
- LTR rules for English

Every component Builder writes must be based on this document.
```

### builder.md

```markdown
---
name: builder
description: >
  Builds components in Astro based on design system
  and MD content. Run me after ui-designer.
model: sonnet
tools:
  - read
  - write
  - bash
---

You are Builder. Your job: build code only.

Build components in Astro according to design-system.json.

Each component must:
- Support Hebrew and English
- Use existing shared components
- Follow SOLID principles
- Include TypeScript types

Don't decide on design. Don't change design-system.json.
```

### memory-keeper.md

```markdown
---
name: memory-keeper
description: >
  Maintains consistency throughout the project. Run me
  before every new architectural decision.
model: sonnet
memory: user
tools:
  - read
  - write
---

You are Memory Keeper. Your job: remember and ensure consistency.

Before every new decision check that it's consistent with:
- design-system.json
- content-structure.json
- All decisions recorded in tasks/lessons.md

If there's a contradiction, report to the main agent before continuing.
```

### error-handler.md

```markdown
---
name: error-handler
description: >
  Identifies and fixes errors. Run me when another agent
  encounters an error it can't resolve.
model: sonnet
tools:
  - read
  - write
  - bash
---

You are Error Handler. Your job: identify and fix errors.

When you receive an error:
1. Identify the root cause
2. Check if the solution exists in tasks/lessons.md
3. Fix the problem
4. Document the solution in tasks/lessons.md

Don't continue if you're not sure about the solution. Report to the main agent.
```

### code-reviewer.md

```markdown
---
name: code-reviewer
description: >
  Reviews code written by Builder before moving to the next stage.
  Run me after every new component is written.
model: sonnet
tools:
  - read
---

You are Code Reviewer. Your job: review only.

For each component you receive check:
- Adherence to SOLID principles
- Use of existing shared components
- Support for Hebrew and English
- Valid TypeScript types
- No code duplication

Return a report with findings only. Don't fix yourself.
```

### quality-gate.md

```markdown
---
name: quality-gate
description: >
  Final quality gate. Run me before every commit.
  If I don't approve, the work isn't done.
model: sonnet
tools:
  - read
  - bash
---

You are Quality Gate. Your job: approve or reject.

Before every commit ask one question:
"Would a staff engineer approve this?"

If the answer isn't clear, return the work.

Check:
- All tests pass
- No forgotten files
- code-reviewer approved
- memory-keeper approved consistency

Only if everything is correct, approve to continue.
```

## Creating Agent Files

Create all the files in .claude/agents/ folder:

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

Copy the content of each agent into the appropriate file.

## Bilingual Output: chapter-01.he.md and chapter-01.en.md

One of the architectural decisions we made in Chapter 1 is that each chapter is generated in two languages in parallel. This is not simple automatic translation. This is a system that produces two complete products from the same source.

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

Each Hebrew file contains the original content with full structure preserved: headings, bullets, tables, and images. Each English file is a complete translation with the exact same structure.

Yuval reads both files and serves the correct one based on the user's saved preference.

## Creating Output Structure

Create the output folder:

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

Chaining is the pattern where the output of one agent becomes the input of the next. It's the heart of BookForge's system.

Without chaining, each agent works in a bubble. With chaining, agents create a pipeline that flows from end to end.

This is what chaining looks like in practice in CLAUDE.md:

```markdown
## Order of Agents Execution

When receiving a Word or PDF file to process:

1. Run Explorer on the file
   Input: File path
   Output: JSON with book structure

2. Run Parser
   Input: File path + JSON from Explorer
   Output: chapter-XX.he.md files

3. Run Content Architect
   Input: All chapter-XX.he.md files
   Output: content-structure.json

4. Run Organizer
   Input: content-structure.json + MD files
   Output: Organized folder structure in output/

5. Run Translator
   Input: All chapter-XX.he.md files
   Output: All chapter-XX.en.md files

6. Run UI Designer
   Input: content-structure.json
   Output: design-system.json

7. Run Builder
   Input: All MD files + design-system.json
   Output: Components in Astro

8. Run in parallel: Memory Keeper, Error Handler, Code Reviewer
   Input: Builder's output
   Output: Finding reports

9. Run Quality Gate
   Input: All reports
   Output: Approval or rejection
```

Three things are important in this definition:

**First**, each step defines exactly what it receives and what it returns. The main agent knows when one step is finished and when to run the next.

**Second**, step 8 runs three agents in parallel. Memory Keeper, Error Handler, and Code Reviewer are not dependent on each other and can run simultaneously.

**Third**, Quality Gate is always last. Nothing leaves the system without its approval.

Add the chaining definition to your CLAUDE.md under the heading "Order of Agents Execution".

## The Code in Action

The full code for this chapter is available at: https://github.com/tomkedem/bookforge

Check out the changes, run, and ask questions directly in Issues.

### What's on GitHub Now

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

The project's foundation is complete. All 4 chapters have been extracted, translated, and structured. The agent system is ready to build the Yuval platform from this content.
