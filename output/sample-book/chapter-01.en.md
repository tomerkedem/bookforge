# Preparation Chapter: The Demo Project and Environment

## What is BookForge and Yuval, and Why

This book is about building agent systems. But unlike most books on the subject, we won't discuss theory. We'll build a real product.

The project is called BookForge, and everything learned in this book will be implemented through it. BookForge is a software development project that demonstrates how to use the advanced capabilities of Claude Code — multi-agent systems, agent teams, and self-review — to build a real product. It receives a book in Hebrew in Word or PDF format, breaks it down into chapters, generates a separate MD file for each chapter, and automatically translates each chapter into English. The final output is two complete versions of the book, Hebrew and English, from which Yuval is built.

Yuval is a digital reading platform. Not another book site that looks like everyone else's. A platform with a design that doesn't exist anywhere today, supporting Hebrew and English from day one, allowing readers to read books on any device comfortably and intelligently.

The technology: Astro as the framework, Tailwind CSS for full responsive design, TypeScript throughout the project.

Design: Mobile-first. The interface is designed first for small screens and then expanded to large screens. On mobile, clean text that fills the entire screen. On desktop, a luxurious design with side menus.

The three first-version features: Reading Progress — the reader continues reading from exactly the same place on every device. Quote Sharing — highlighting text generates a beautiful image to share. Mobile-first design — a perfect reading experience on every screen.

The first book to launch on Yuval is AI Developer Fitness, written by the same developer who built the platform.

The two projects are connected: BookForge is the engine, Yuval is the product. Together they prove the central point of this book: with the right design of an agent system, a single developer can build what an entire team could not.

## The BookForge Agent Map

Explanation:

The diagram shows the complete agent system we'll build throughout the book. Each agent is responsible for one role only. The green agents execute, the orange agents review, and the red quality gate is the final checkpoint before output leaves the system. The dashed loop at the bottom represents the self-review that runs throughout the entire process.

## Environment Setup

Before continuing, ensure the following are installed:

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

After installation you will see the Claude Code launch screen with your account details, the current version, and the directory you are working in. This means everything is ready.

## Downloading the Project

All the code from this book is available at: https://github.com/tomkedem/bookforge

To download it to your computer:

```bash
git clone https://github.com/tomkedem/bookforge.git
cd bookforge
```

From here you can follow along with each chapter, see the code in action, and ask questions in Issues.

## README.md

In the repository you'll find the following file:

```markdown
# BookForge

A software development project demonstrating the use of advanced capabilities
of Claude Code to build a real product.

Receives a book in Word or PDF format and builds from it Yuval,
a world-class digital reading platform.

## Agents in the System

## Requirements

Node.js 18 and above
Claude Code v2.1.32 and above
Git

## Project Structure

Will be updated chapter by chapter throughout the book.
```

That's all there is right now. An empty project with a clear direction. The agents haven't been born yet.
