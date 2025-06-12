<script>
  import { router } from '@inertiajs/svelte';
  import { DashboardLayout } from '../../app';
  import Form from './Form.svelte';

  // Props from Inertia
  export let service = {};
  export let servers = [];
  export let user = {};
  export let errors = {};
  export let flash = {};
</script>

<svelte:head>
  <title>Modifier {service.nom} - Kalya</title>
</svelte:head>

<DashboardLayout {user} {flash} title="Modifier {service.nom} - Kalya" currentRoute="services">

  <!-- Header -->
  <div class="mb-6">
    <!-- Breadcrumbs -->
    <div class="breadcrumbs text-sm">
      <ul>
        <li><button class="link" on:click={() => router.visit('/services')}>Services</button></li>
        <li><button class="link" on:click={() => router.visit(`/services/${service.id}`)}>
          {service.nom}
        </button></li>
        <li>Modifier</li>
      </ul>
    </div>

    <!-- Title -->
    <h1 class="text-3xl font-bold mt-2">✏️ Modifier {service.nom}</h1>
  </div>

  <!-- Form -->
  <Form
    {service}
    {servers}
    {errors}
    isEdit={true}
  />

</DashboardLayout>
