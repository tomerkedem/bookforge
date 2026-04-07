# Chapter 2: CLAUDE.md as Architecture

## CLAUDE.md as a Constitution

Most developers who use Claude Code write CLAUDE.md once, add a few general instructions, and forget about it. The result is an agent that behaves differently in every session, makes wrong decisions, and causes you to keep coming back to fix the same things over and over.

CLAUDE.md is not a README. It is not documentation. It is the constitution of the project.

The difference between a document and a constitution is simple: a document describes. A constitution mandates. When you write in CLAUDE.md "do not touch output files without explicit approval," that is not a recommendation. It is a rule the agent respects in every session and for every task it performs.

The agent reads CLAUDE.md at the start of every session. Whatever you don't write there, it will decide on its own. And not always the way you'd want.

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

The first file to fill in is `.gitignore`. It defines which files Git will never upload to GitHub.

Open `.gitignore` and add:

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

Some settings belong to the project, and some settings belong only to your machine.

CLAUDE.md is uploaded to GitHub and shared with everyone working on the project. Therefore it contains universal rules: architecture, boundaries, standards.

CLAUDE.local.md stays with you only. It is in `.gitignore` and goes nowhere. Personal things go there:

```markdown
# CLAUDE.local.md

## Local Environment
- Python is at: C:\Python312
- Node is at: C:\Program Files\nodejs
- Book file to process: D:\Books\AI_Developer_Fitness.docx

## Personal Preferences
- Always show progress in Hebrew
- Ask me before any destructive action
```

Open CLAUDE.local.md and write in it the paths of your environment. This is the only file in the project that no one but you will ever see.

## tasks/todo.md and tasks/lessons.md

These two files are the living memory of the project.

`tasks/todo.md` is the work plan. Before every task the agent performs, it writes the plan there and does not start writing code before you approve it. This prevents one of the most common problems: an agent that starts executing and only then discovers it understood the task differently.

```markdown
# tasks/todo.md

## Current Task
Breaking AI_Developer_Fitness.docx into chapters

## Plan
- [ ] Explorer scans the file and reports on structure
- [ ] Parser extracts each chapter to a separate file
- [ ] Translator translates each chapter to English
- [ ] Organizer arranges the files in the correct structure

## Status
In progress
```

`tasks/lessons.md` is the cumulative memory. Every time you correct the agent, it writes the lesson there. At the start of a new session, the agent reads this file before it starts working.

```markdown
# tasks/lessons.md

## Lessons

### 2026-04-05
When extracting images from Word, the original variable name
must be preserved without changing it. An image whose name
has changed breaks the reference inside the MD file.

### 2026-04-05
Translator does not translate headings with numbers. Need
to add an explicit instruction for this.
```

After a week of work, lessons.md is the most valuable document in the project. It contains everything you've learned about how your agents behave.

Who writes to lessons.md? Both. The agent writes when it fixes an error on its own; Error Handler is configured to write after every fix. You write when you discover an architectural insight the agent cannot know on its own.

Who reads lessons.md? The agent reads it at the start of every session before it starts working. This is what allows it to know in advance what not to do, without asking you and without repeating old mistakes.

Claude Code does not remember between sessions. Every session starts from scratch. lessons.md is what connects sessions and prevents the system from repeating the same mistakes over and over. It is the memory of the system.

Open both files and add an initial heading:

**tasks/todo.md:**
```markdown
# tasks/todo.md

## Current Task
_Will be updated before each task_
```

**tasks/lessons.md:**
```markdown
# tasks/lessons.md

## Lessons
_Will be updated after each fix_
```

## The Code in Action

The complete code for this chapter is available at: https://github.com/tomkedem/bookforge

Review the changes, run them, and ask questions directly in Issues.

## Project Index to Prevent Duplicate Reads

One of the most common problems in agent systems is duplicate reads. The agent opens the same file over and over, burns unnecessary tokens, and slows down the entire project. Research conducted on 132 sessions showed that 71% of all file reads were files the agent had already opened in the same session.

The solution is a Project Index — a map of the project that the agent reads once at the start of each session and uses to know what is in each file before opening it.

The Project Index is written directly inside CLAUDE.md:

```markdown
## Project Index

### Source Files
src/pipeline/ingest.py       Read Word or PDF file and extract raw text
src/pipeline/parse.py        Break down into chapters by headings
src/pipeline/organize.py     Build MD file structure by language
src/pipeline/build.py        Create Astro application skeleton

### Agents
.claude/agents/explorer.md      Scans file structure
.claude/agents/parser.md        Extracts chapters and images
.claude/agents/translator.md    Translates Hebrew to English
.claude/agents/organizer.md     Organizes MD files
.claude/agents/ui-designer.md   Designs components
.claude/agents/builder.md       Builds Astro code

### Output
output/{book-name}/chapter-01.he.md    Chapter in Hebrew
output/{book-name}/chapter-01.en.md    Chapter in English
output/{book-name}/assets/             Images
```

Every time a new file is added to the project, update the Index. The agent doesn't need to scan the project from scratch every session — it already knows what's there and where.

Open CLAUDE.md and add your Project Index. Update it according to your specific project structure.

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
└── tasks/
    ├── todo.md
    └── lessons.md
```

The preparation chapter brought README.md. Chapter 1 brought architecture-thinking.md. Chapter 2 brought CLAUDE.md, .gitignore, and the tasks directory.

The project is starting to take shape. Still no code. Still no agents. But there is architecture, a constitution, and memory.
