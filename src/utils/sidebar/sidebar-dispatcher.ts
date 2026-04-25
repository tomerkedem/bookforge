/**
 * Tiny dispatcher to break the import cycle between sidebar-render
 * and sidebar-navigation.
 *
 * Both modules need each other:
 *   - render needs to navigate when the user clicks a section in a
 *     non-active chapter ("go to chapter X, then scroll to section
 *     Y")
 *   - navigation needs to re-render after a chapter swap
 *
 * Importing both directly creates a cycle that ESM resolves by
 * partial loading — fragile. Instead, navigation registers itself
 * here on init; render reads through a getter.
 */

type Navigator = (url: string) => Promise<void>;

let navigator: Navigator | null = null;

/** Called once at init (by sidebar-init) to wire up the navigator. */
export function setNavigator(fn: Navigator): void {
  navigator = fn;
}

/** Used by render code to navigate without importing navigation. */
export async function navigateTo(url: string): Promise<void> {
  if (!navigator) {
    /* Failsafe: hard navigation if init order somehow ran wrong. */
    window.location.href = url;
    return;
  }
  await navigator(url);
}