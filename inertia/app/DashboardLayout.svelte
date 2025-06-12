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
  
  <!-- Sidebar (optional) -->
  <aside class="dashboard-layout__sidebar">
    <nav class="dashboard-layout__sidebar-nav">
      <a href="/dashboard" class="sidebar-nav__link" class:active={currentRoute === 'dashboard'}>
        📊 Dashboard
      </a>
      <a href="/servers" class="sidebar-nav__link" class:active={currentRoute === 'servers'}>
        🖥️ Servers
      </a>
      <a href="/services" class="sidebar-nav__link" class:active={currentRoute === 'services'}>
        ⚙️ Services
      </a>
    </nav>
  </aside>
  
  <!-- Main Content -->
  <main class="dashboard-layout__main">
    <div class="dashboard-layout__content">
      <slot />
    </div>
  </main>
</div>

<style>
  /* Dashboard Layout styles will go here */
  .dashboard-layout {
    /* Main layout container */
  }
  
  .dashboard-layout__sidebar {
    /* Sidebar styles */
  }
  
  .dashboard-layout__sidebar-nav {
    /* Sidebar navigation */
  }
  
  .sidebar-nav__link {
    /* Sidebar link styles */
  }
  
  .sidebar-nav__link.active {
    /* Active sidebar link */
  }
  
  .dashboard-layout__main {
    /* Main content area */
  }
  
  .dashboard-layout__content {
    /* Content container */
  }
</style>
