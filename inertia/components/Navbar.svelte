<script>
  import { router } from '@inertiajs/svelte';
  
  // Props
  export let user = null;
  export let currentRoute = '';
  
  // State
  let mobileMenuOpen = false;
  
  // Functions
  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }
  
  function logout() {
    router.post('/logout');
  }
</script>

<!-- Navbar Component -->
<nav class="navbar">
  <div class="navbar__container">
    <!-- Logo/Brand -->
    <div class="navbar__brand">
      <a href="/" class="navbar__logo">
        Kalya
      </a>
    </div>
    
    <!-- Navigation Links -->
    <div class="navbar__nav" class:open={mobileMenuOpen}>
      <a href="/dashboard" class="navbar__link" class:active={currentRoute === 'dashboard'}>
        Dashboard
      </a>
      <a href="/servers" class="navbar__link" class:active={currentRoute === 'servers'}>
        Servers
      </a>
      <a href="/services" class="navbar__link" class:active={currentRoute === 'services'}>
        Services
      </a>
    </div>
    
    <!-- User Menu -->
    {#if user}
      <div class="navbar__user">
        <span class="navbar__username">{user.name}</span>
        <button class="navbar__logout" on:click={logout}>
          Logout
        </button>
      </div>
    {:else}
      <div class="navbar__auth">
        <a href="/login" class="navbar__link">Login</a>
      </div>
    {/if}
    
    <!-- Mobile Menu Button -->
    <button 
      class="navbar__mobile-toggle" 
      on:click={toggleMobileMenu}
      aria-label="Toggle navigation"
    >
      ☰
    </button>
  </div>
</nav>

<style>
  /* Navbar styles will go here */
  .navbar {
    /* Base navbar styles */
  }
  
  .navbar__container {
    /* Container styles */
  }
  
  .navbar__brand {
    /* Brand styles */
  }
  
  .navbar__logo {
    /* Logo styles */
  }
  
  .navbar__nav {
    /* Navigation styles */
  }
  
  .navbar__nav.open {
    /* Mobile menu open state */
  }
  
  .navbar__link {
    /* Link styles */
  }
  
  .navbar__link.active {
    /* Active link styles */
  }
  
  .navbar__user {
    /* User menu styles */
  }
  
  .navbar__username {
    /* Username styles */
  }
  
  .navbar__logout {
    /* Logout button styles */
  }
  
  .navbar__auth {
    /* Auth section styles */
  }
  
  .navbar__mobile-toggle {
    /* Mobile toggle button styles */
  }
</style>
