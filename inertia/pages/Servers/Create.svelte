<script>
  import Form from './Form.svelte';

  // Props from Inertia
  export let user = {};
  export let flash = {};
  export let errors = {};
  export let servers = [];
</script>

<Form {user} {flash} {errors} {servers} />
