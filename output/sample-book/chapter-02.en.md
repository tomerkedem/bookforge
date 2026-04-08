# Chapter 1: Changing Your Mental Model

## From an Assistant That Responds to a System That Creates

You use Claude Code. You give it a task, it executes, you check, you give another task. It works. The code comes out reasonable. Work progresses.

But notice what's actually happening.

You're the one holding the entire project in your head. You're the one who knows what was done, what's left, and what's the next step. The agent only does what you ask it to do at each moment. The moment you stop giving commands, everything stops.

This isn't working with an agent system. This is working with a very smart assistant that needs constant guidance.

The difference between the two isn't technical. It's a difference in approach. And this difference is what determines whether you'll build high-level software alone, or remain dependent on yourself at every step.

## Three Comparative Scenarios

To understand the difference concretely, let's take one task and see it in three different approaches.

The task: "Build a home page for the Yuval platform that displays a list of books."

### Approach A: Linear

**You:** "Write a React component that displays a list of books."

**Claude:** Writes BookList.tsx

**You:** "Now add styling."

**Claude:** Adds CSS

**You:** "Now add pagination."

**Claude:** Adds pagination

**You:** "Now..."

Each step depends on you. You're the orchestrator. Claude is the hands. The moment you stop, everything stops.

### Approach B: One Big Task

**You:** "Build a complete home page for the Yuval platform with a book list, impressive design, pagination, and support for Hebrew and English."

**Claude:** Writes everything at once

Sounds efficient. But what comes out is code that tries to do everything in one file, without architecture, without consistency with the rest of the project, and without any review of what was created. When something doesn't work, it's hard to know where the problem is.

### Approach C: Agent System

**You:** "Build a home page for the Yuval platform that displays a list of books.

Follow CLAUDE.md Explorer will scan the existing components before we start.

UI Designer will define the design. Builder will implement. Code Reviewer will check. Quality Gate will approve before we're done."

You give the task once. The system decides how to execute. You get a result that has gone through self-review before it reached you.

The difference is not in what was written. The difference is in who holds the responsibility along the way.

In approach A and approach B the responsibility is with you. In approach C the responsibility is with the system.

## Architectural Planning Exercise

Before you write a single line of code in BookForge, stop and answer three questions.

**First question:** What decisions do you want the system to make on its own?

For example: how to break down a chapter, how to organize MD files, how to translate content, how to check code quality.

**Second question:** What decisions must remain with you?

For example: overall design direction, approval of merge before code goes up, decisions about architecture that affects the entire project.

**Third question:** How will the system know it did good work?

For example: code passes tests, output is correct in Hebrew and English, no duplication between components.

Write your answers in the following file in the repository:

```
docs/architecture-thinking.md
```

This is the first file you'll write in the project. Not code. Not a component. Decisions.

Because a good agent system starts with thinking, not commands.

## The Code in Action

The full code for this chapter is available at: https://github.com/tomkedem/bookforge

Check out the changes, run, and ask questions directly in Issues.

### What's on GitHub Now

```
bookforge/
├── README.md
└── docs/
    └── architecture-thinking.md
```
