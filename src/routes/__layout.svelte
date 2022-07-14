<script>
  import "../app.css";
</script>

<svelte:head>
  <title>Starlite</title>
</svelte:head>

<main class="p-2 flex">
  <div class="flex flex-col" style:margin="0 auto">
    <slot />
  </div>

  <iframe class="fixed bottom-2 left-2" src="https://ghbtns.com/github-btn.html?user=tyvdh&repo=starlite-sveltekit&type=star&count=true&size=large" frameborder="0" scrolling="0" width="170" height="30" title="GitHub"></iframe>
</main>