<script lang="ts">
  import { onMount } from 'svelte';

  type Theme = 'light' | 'dark';
  const storageKey = 'korntewin-theme';
  let theme: Theme = 'light';

  onMount(() => {
    theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  });

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // The toggle still works when localStorage is unavailable.
    }
  }
</script>

<button
  class="theme-toggle"
  type="button"
  onclick={toggleTheme}
  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
  title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
>
  <span aria-hidden="true" class="theme-icon">{theme === 'dark' ? '☀' : '☾'}</span>
  <span class="theme-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
</button>

<style>
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: .42rem;
    min-height: 2.5rem;
    padding: .35rem .75rem;
    border-radius: 9999px;
    border: 1px solid var(--theme-border, #dbe3f2);
    color: var(--theme-fg, #17213b);
    background: var(--theme-surface, white);
    font: inherit;
    font-size: .875rem;
    font-weight: 650;
    cursor: pointer;
    transition: background-color .2s, border-color .2s, transform .2s;
  }
  .theme-toggle:hover { background: var(--theme-surface-hover, #eaf2ff); transform: translateY(-1px); }
  .theme-toggle:focus-visible { outline: 3px solid var(--theme-primary, #397bea); outline-offset: 3px; }
  .theme-icon { font-size: 1.22rem; line-height: 1; }
  @media (max-width: 570px) { .theme-label { display: none; } .theme-toggle { padding: .35rem .58rem; min-width: 2.5rem; } }
</style>
