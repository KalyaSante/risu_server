<script>
  // Base layout for public pages
  export let title = 'Kalya';
  export let description = 'Server and Service Management Platform';
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta charset="utf-8" />
</svelte:head>

<!-- Base Layout -->
<div class="base-layout">
  <header class="base-layout__header">
    <!-- Public header content -->
    <nav class="base-layout__nav">
      <a href="/" class="base-layout__logo">Kalya</a>
      
      <div class="base-layout__nav-links">
        <a href="/login" class="base-layout__nav-link">Login</a>
      </div>
    </nav>
  </header>
  
  <main class="base-layout__main">
    <slot />
  </main>
  
  <footer class="base-layout__footer">
    <p>&copy; 2024 Kalya. All rights reserved.</p>
  </footer>
</div>

<style>
  /* Base Layout styles will go here */
  .base-layout {
    /* Main container styles */
  }
  
  .base-layout__header {
    /* Header styles */
  }
  
  .base-layout__nav {
    /* Navigation styles */
  }
  
  .base-layout__logo {
    /* Logo styles */
  }
  
  .base-layout__nav-links {
    /* Nav links container */
  }
  
  .base-layout__nav-link {
    /* Nav link styles */
  }
  
  .base-layout__main {
    /* Main content area */
  }
  
  .base-layout__footer {
    /* Footer styles */
  }
</style>
