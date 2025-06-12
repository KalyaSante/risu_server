<script>
  import Form from './Form.svelte';

  // Props from Inertia
  export let server = {};
  export let servers = []; // ⚡ Déplacé ici, dans le script !
  export let user = {};
  export let flash = {};
  export let errors = {};
</script>

<Form {server} {user} {flash} {errors} {servers} />
