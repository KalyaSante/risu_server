<script>
  import Form from './Form.svelte';

  // Props from Inertia
  export let server = {};
  export let user = {};
  export let flash = {};
  export let errors = {};
</script>

<Form {server} {user} {flash} {errors} />
