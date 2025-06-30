<script>
  import Navbar from '../components/Navbar.svelte';
  import Alert from '../components/Alert.svelte';

  // Props
  export let title = 'Dashboard - Kalya';
  export let description = 'Server and Service Management Dashboard';
  export let user = null;
  export let currentRoute = '';
  export let flash = {};
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta charset="utf-8" />
</svelte:head>

<!-- Dashboard Layout -->
<div class="dashboard-layout">
  <!-- Navigation -->
  <Navbar {user} {currentRoute} />

  <!-- Flash Messages -->
  {#if flash.success}
    <Alert type="success" title="Success" dismissible>
      {flash.success}
    </Alert>
  {/if}

  {#if flash.error}
    <Alert type="error" title="Error" dismissible>
      {flash.error}
    </Alert>
  {/if}

  {#if flash.warning}
    <Alert type="warning" title="Warning" dismissible>
      {flash.warning}
    </Alert>
  {/if}

  {#if flash.info}
    <Alert type="info" title="Info" dismissible>
      {flash.info}
    </Alert>
  {/if}



  <!-- Main Content -->
  <main class="dashboard-layout__main p-4 md:p-6 lg:p-8">
    <div class="dashboard-layout__content max-w-screen-xl mx-auto">
      <slot />
    </div>
  </main>
</div>

<style>
  .dashboard-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: hsl(var(--b2, var(--b1)) / 1); /* Use background color from theme */
  }

  .dashboard-layout__main {
    flex-grow: 1;
    /* Padding is now applied directly via Tailwind classes */
  }

  .dashboard-layout__content {
    /* Max-width and centering are now applied directly via Tailwind classes */
  }

  /* Removed unused sidebar styles:
  .dashboard-layout__sidebar { ... }
  .dashboard-layout__sidebar-nav { ... }
  .sidebar-nav__link { ... }
  .sidebar-nav__link.active { ... }
  */
</style>
