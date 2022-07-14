<script>
  let name1
  let name2

  function open() {
    location.assign(`/${name1}/${name2}`)
  }
</script>

<h1 class=""><strong>Starlite</strong></h1>
<h2 class="mb-2">Open payment channel</h2>
<form on:submit|preventDefault={open}>
  <input class="border" type="text" placeholder="Your name" bind:value={name1}>
  <input class="border" type="text" placeholder="Your friend's name" bind:value={name2}>
  <button>Open</button>
</form>

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