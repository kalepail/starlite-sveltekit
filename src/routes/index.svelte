<script>
  let name1
  let name2

  function open() {
    location.assign(`/${name1}/${name2}`)
  }
</script>

<div class="mx-auto">
  <h1><strong>Starlite</strong></h1>
  <h2 class="mb-2">Open payment channel</h2>

  <form on:submit|preventDefault={open} class="mb-4">
    <input class="border" type="text" placeholder="Your name" bind:value={name1}>
    <input class="border" type="text" placeholder="Your friend's name" bind:value={name2}>
    <button>Open</button>
  </form>
</div>

<hr class="border mb-4">

<video src="https://user-images.githubusercontent.com/4383610/179084257-1d7d08f5-1b98-4518-bfb1-fc643a0be8c4.mp4" controls style:width="100%" style:max-width="480px">
  <track kind="captions">
</video>

<style>
  h2 {
    font-size: 12px;
  }
  form {
    display: flex;
    flex-direction: column;
  }
  input {
    margin-bottom: 5px;
    padding: 0 5px;
  }
  button {
    background-color: black;
    color: white;
    padding: 5px;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    width: 100%;
  }
</style>