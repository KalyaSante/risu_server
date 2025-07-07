<script>
  import { router } from '@inertiajs/svelte';
  import { DashboardLayout } from '../../app';
  import Form from './Form.svelte';

  // Props from Inertia
  export let servers = [];
  export let selectedServer = null;
  export let availableServices = []; // ✅ NOUVEAU
  export let availableImages = []; // ✅ NOUVEAU
  export let user = {};
  export let errors = {};
  export let flash = {};
</script>

<svelte:head>
  <title>Nouveau service - Kalya</title>
</svelte:head>

<DashboardLayout {user} {flash} title="Nouveau service - Kalya" currentRoute="services">

  <!-- Header -->
  <div class="mb-6">
    <!-- Breadcrumbs -->
    <div class="breadcrumbs text-sm">
      <ul>
        <li><button class="link" on:click={() => router.visit('/services')}>Services</button></li>
        <li>Nouveau service</li>
      </ul>
    </div>

    <!-- Title -->
    <h1 class="text-3xl font-bold mt-2">➕ Nouveau service</h1>
  </div>

  <!-- Form -->
  <Form
    {servers}
    {selectedServer}
    {availableServices}
    {availableImages}
    {errors}
    isEdit={false}
  />

</DashboardLayout>
