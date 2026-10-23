<script lang="ts">
  import { onMount } from 'svelte';
  let progress = 0;
  onMount(() => {
    const update = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      progress = total > 0 ? Math.max(0, Math.min(100, Math.round(window.scrollY / total * 100))) : 0;
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  });
</script>
<div class="track" aria-hidden="true"><div class="fill" style:width={progress + '%'}></div></div>
<style>.track{position:fixed;top:0;left:0;right:0;height:3px;z-index:20;pointer-events:none}.fill{background:#8ba8ff;height:100%;transition:width .12s linear}</style>
