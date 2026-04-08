# Setup Chapter: The Demo Project and Environment

## What is BookForge and Yuval and Why

This book deals with building agent systems. But unlike most books on the subject, we won't discuss theory. We'll build a real product.

The project is called BookForge, and everything learned in the book will be implemented through it. BookForge is a software development project that demonstrates how to use Claude Code's advanced capabilities, multiple agents, agent teams, and self-review to build a real product. It takes a book in Hebrew in Word or PDF format, breaks it down into chapters, generates a separate MD file for each chapter, and automatically translates each chapter to English. The final output is two complete versions of the book, Hebrew and English, from which Yuval is built.

Yuval is a digital reading platform. No more website that looks like every other books site. A platform with a design that doesn't exist anywhere today, that supports Hebrew and English from day one, and allows reading books on any device in a comfortable and smart way.

The technology: Astro as the framework, Tailwind CSS for fully responsive design, TypeScript throughout the project.

Design: Mobile-first. The interface is designed first for a small screen then expanded for a large screen. On a phone, clean text that fills the entire screen. On a computer, a luxurious design with side menus.

Three features of the first version: Reading Progress, the reader continues reading from exactly the same place on every device. Share a quote, highlighting text generates a beautiful image to share. Mobile-first design, perfect reading experience on any screen.

The first book to go live on Yuval is AI Developer Fitness, written by the same developer who built the platform.

The two projects are related: BookForge is the engine, Yuval is the product. And together they prove the central point of the book: with proper planning of an agent system, one developer can build what an entire team failed to accomplish.

## Map of BookForge's Agents

Explanation:

The diagram shows the complete agent system built throughout the book. Each agent is responsible for one task only. The green agents execute, the orange agents verify, and the red quality gate is the final entry point before output goes out. The dotted loop at the bottom represents the self-review that runs throughout the entire process.

## Environment Setup

Before continuing, make sure the following are installed:

```bash
node --version      # 18 and above
git --version
claude --version    # Claude Code v2.1.32 and above
python --version    # 3.8 and above
pip install python-docx
```

Installing Claude Code:

```bash
npm install -g @anthropic-ai/claude-code
claude login
```

After installation you'll see the Claude Code welcome screen with your account details, the current version, and the folder you're working in. That means everything is ready.

## Downloading the Project

All the book's code is available at: https://github.com/tomkedem/bookforge

To download it to your computer:

```bash
git clone https://github.com/tomkedem/bookforge.git
cd bookforge
```

From here you can follow each chapter, see the code in action, and ask questions in Issues.

## README.md

In the repository you'll find the following file:

```markdown
# BookForge

A software development project demonstrating the use of Claude Code's advanced capabilities
to build a real product.

Takes a book in Word or PDF format and builds Yuval from it,
a global-level digital reading platform.

## Agents in the System

## Requirements

- Node.js 18 and above
- Claude Code v2.1.32 and above
- Git

## Project Structure

Will be updated chapter by chapter throughout the book.
```

That's all there is now. An empty project with a clear direction. The agents haven't been born yet.
