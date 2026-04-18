import os


def detect_environment() -> str:
    """
    Detect if running in Claude Code CLI or VS Code Copilot.

    Returns:
        'claude-code' - Full subagent support with file tools
        'vscode-copilot' - Limited, main agent must handle files
        'unknown' - Fallback to main agent mode
    """
    if os.getenv("CLAUDE_CODE") or os.getenv("CLAUDE_SESSION_ID"):
        return "claude-code"

    if os.getenv("VSCODE_PID") or os.getenv("VSCODE_IPC_HOOK"):
        return "vscode-copilot"

    return "unknown"


def supports_parallel_subagents() -> bool:
    """Check if current environment supports parallel subagents with file access."""
    return detect_environment() == "claude-code"