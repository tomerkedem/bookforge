# Chapter 1: Shifting the Mental Model

## From a Reactive Assistant to a Producing System

You use Claude Code. You give it a task, it executes, you review, give another task. It works. The code comes out reasonable. The work moves forward.

But notice what is actually happening.

You're the one holding the entire project in your head. You're the one who knows what's been done, what remains, and what the next step is. The agent only executes what you ask of it at any given moment. The moment you stop giving commands, everything stops.

This is not working with an agent system. It's working with a very smart assistant that needs constant guidance.

The difference between the two is not technical. It's a difference in approach. And that difference determines whether you'll build high-quality software on your own, or remain dependent on yourself at every step.

## Three Comparative Scenarios

To understand the difference concretely, let's take one task and see it through three different approaches.

The task: "Build a home page for the Yuval platform that displays a list of books."

**Approach A: Linear**

You: "Write a React component that displays a list of books."

Claude: writes BookList.tsx

You: "Now add styling."

Claude: adds CSS

You: "Now add pagination."

Claude: adds pagination

You: "Now..."

Every step depends on you. You are the orchestrator. Claude is the hands. The moment you stop, everything stops.

**Approach B: One big task**

You: "Build a complete home page for the Yuval platform with a book list, impressive design, pagination, and support for Hebrew and English."

Claude: writes everything at once

Sounds efficient. But what comes out is code that tries to do everything in one file, without architecture, without consistency with the rest of the project, and without any self-review of what was created. When something doesn't work, it's hard to know where the problem is.

**Approach C: Agent system**

You: "Build a home page for the Yuval platform that displays a list of books.

Work according to CLAUDE.md. Explorer will scan the existing components before we start.

UI Designer will define the design. Builder will implement. Code Reviewer will check. Quality Gate will approve before we finish."

You give the task once. The system decides how to execute it. You receive a result that has gone through self-review before reaching you.

The difference is not in what was written. The difference is in who holds responsibility along the way.

In approaches A and B, responsibility is with you. In approach C, responsibility is with the system.

## Architecture Planning Exercise

Before writing a single line of code in BookForge, stop and answer three questions.

**First question:** What decisions do you want the system to make on its own?

For example: how to break down a chapter, how to organize MD files, how to translate content, how to check code quality.

**Second question:** What decisions must remain with you?

For example: general design direction, approving merges before code goes live, architecture decisions that affect the entire project.

**Third question:** How will the system know it has done good work?

For example: the code passes tests, output is valid in Hebrew and English, no duplication between components.

Write the answers in the following file in the repository:

```
docs/architecture-thinking.md
```

This is the first file you'll write in the project. Not code. Not a component. Decisions.

Because a good agent system starts with thinking, not with commands.

## The Code in Action

The complete code for this chapter is available at: https://github.com/tomkedem/bookforge

Review the changes, run them, and ask questions directly in Issues.

**What's on GitHub now**

```
bookforge/
├── README.md
└── docs/
    └── architecture-thinking.md
```
