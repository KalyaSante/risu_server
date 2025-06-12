<script>
  import Form from './Form.svelte';

  // Props from Inertia
  export let user = {};
  export let flash = {};
  export let errors = {};
</script>

export let servers = [];

<Form {user} {flash} {errors} {servers} />
