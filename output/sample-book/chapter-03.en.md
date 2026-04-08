# Chapter 2: CLAUDE.md as Architecture

## CLAUDE.md as Constitution

Most developers using Claude Code write CLAUDE.md once, put a few general instructions in it, and forget about it. The result is an agent that behaves differently in each session, makes wrong decisions, and causes you to go back and fix the same things over and over again.

CLAUDE.md is not a README. It's not documentation. It's the constitution of the project.

The difference between a document and a constitution is simple: a document describes. A constitution mandates. When you write in CLAUDE.md "don't touch output files without explicit approval," that's not a recommendation. It's a rule that the agent respects in every session and every task it performs.

The agent reads CLAUDE.md at the beginning of each session. What you didn't write there, it will decide on its own. And not always the way you want.

## Setting Up Project Files

Before continuing, create the following files in the project root:

**Mac / Linux:**

```bash
touch CLAUDE.md
touch CLAUDE.local.md
touch .gitignore
mkdir tasks
touch tasks/todo.md
touch tasks/lessons.md
```

**Windows:**

```powershell
ni CLAUDE.md
ni CLAUDE.local.md
ni .gitignore
ni -ItemType Directory tasks
ni tasks\todo.md
ni tasks\lessons.md
```

## .gitignore

The first file we fill is .gitignore which defines which files Git will never upload to GitHub.

Open .gitignore and add:

```
# Personal files that don't go to GitHub
CLAUDE.local.md

# Dependencies
node_modules/

# Environment files
.env
.env.local
```

**Mac / Linux:**

```bash
echo "CLAUDE.local.md" >> .gitignore
```

**Windows:**

```powershell
Add-Content .gitignore "CLAUDE.local.md"
```

## CLAUDE.local.md for Personal Settings

There are settings that belong to the project and settings that belong to your machine alone.

CLAUDE.md goes to GitHub and is shared with everyone working on the project. So it contains universal rules: architecture, boundaries, standards.

CLAUDE.local.md stays with you alone. It's in .gitignore and doesn't go anywhere. We put personal things there:

```markdown
# CLAUDE.local.md

## Local Environment

- Python is located at: C:\Python312
- Node is located at: C:\Program Files\nodejs
- Book file to process: D:\Books\AI_Developer_Fitness.docx

## Personal Preferences

- Always show progress in Hebrew
- Before every destructive action ask me
```

Open CLAUDE.local.md and write the paths of your environment in it. It's the only file in the project that no one but you will see.

## tasks/todo.md and tasks/lessons.md

These two files are the living memory of the project.

**tasks/todo.md** is the work plan. Before each task the agent performs, it writes the plan there and doesn't start writing code before you approve. This prevents one of the most common problems: an agent that starts executing and only later discovers it understood the task differently.

```markdown
# tasks/todo.md

## Current Task

Breaking down AI_Developer_Fitness.docx into chapters

## Plan

- [ ] Explorer scans the file and reports structure
- [ ] Parser extracts each chapter into a separate file
- [ ] Translator translates each chapter to English
- [ ] Organizer arranges the files in the correct structure

## Status

In progress
```

**tasks/lessons.md** is the cumulative memory. Every time you fix the agent, it writes the lesson there. When opening a new session, the agent reads this file before starting to work.

```markdown
# tasks/lessons.md

## Lessons

### 2026-04-05

When extracting images from Word, must save the original variable name
and not change it. An image that changed its name breaks
the reference inside the MD file.

### 2026-04-05

Translator doesn't translate titles with numbers. Need to
add an explicit instruction to it.
```

After a week of work, lessons.md is the most valuable document in the project. It contains everything you've learned about how your agents behave.

Who writes to lessons.md? Both. The agent writes when it fixes an error itself, Error Handler is set to write after every fix. You write when you discover an architectural insight the agent can't know on its own.

Who reads lessons.md? The agent reads it at the beginning of every session before it starts working. That's what allows it to know in advance what not to do, without asking you and without repeating old mistakes.

Claude Code doesn't remember between sessions. Every session starts from scratch. lessons.md is what connects between sessions and prevents the system from repeating the same mistakes over and over. It's the system's memory.

## Initial File Setup

Open both files and add an initial heading:

**tasks/todo.md:**

```markdown
# tasks/todo.md

## Current Task

_Will be updated before every task_
```

**tasks/lessons.md:**

```markdown
# tasks/lessons.md

## Lessons

_Will be updated after every fix_
```

## Project Index to Prevent Duplicate Reads

One of the most common problems in agent systems is duplicate reads. The agent opens the same file over and over, burning unnecessary tokens, and slowing down the entire project. Research conducted on 132 sessions showed that 71% of all file reads were files the agent had already opened in the same session.

The solution is Project Index, a map of the project that the agent reads once at the beginning of each session and uses to know what's in each file before opening it.

Project Index is written directly inside CLAUDE.md:

```markdown
## Project Index

### Source Files

src/pipeline/ingest.py       Reading Word or PDF file and extracting raw text
src/pipeline/parse.py        Breaking into chapters by headings
src/pipeline/organize.py     Building MD file structure by language
src/pipeline/build.py        Creating skeleton of Astro application

### Agents

.claude/agents/explorer.md      Scans file structure
.claude/agents/parser.md        Extracts chapters and images
.claude/agents/translator.md    Translates Hebrew to English
.claude/agents/organizer.md     Arranges MD files
.claude/agents/ui-designer.md   Designs components
.claude/agents/builder.md       Builds Astro code

### Output

output/{book-name}/chapter-01.he.md    Chapter in Hebrew
output/{book-name}/chapter-01.en.md    Chapter in English
output/{book-name}/assets/             Images
```

Every time you add a new file to the project, update the Index. The agent doesn't need to scan the project from scratch in every session, it already knows what exists and where.

Open CLAUDE.md and add the Project Index. Update it according to your specific project structure.

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
└── tasks/
    ├── todo.md
    └── lessons.md
```

In the introduction we brought README.md. Chapter 1 brought architecture-thinking.md. Chapter 2 brought CLAUDE.md, .gitignore, and the tasks folder.

The project is starting to take shape. There's still no code. There's still no agents. But there's architecture, constitution, and memory.
