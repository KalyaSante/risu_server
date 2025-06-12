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
<nav class="navbar w-full px-4">
  <div class="navbar__container w-full flex justify-between">
    <!-- Logo/Brand -->
    <div class="navbar__brand">
      <a href="/" class="navbar__logo">
        Kalya
      </a>
    </div>
    <nav class="dashboard-layout__sidebar-nav">
      <a href="/" class="sidebar-nav__link " class:active={currentRoute === 'dashboard'}>
        📊 Dashboard
      </a>
      <a href="/servers" class="sidebar-nav__link" class:active={currentRoute === 'servers'}>
        🖥️ Servers
      </a>
      <a href="/services" class="sidebar-nav__link" class:active={currentRoute === 'services'}>
        ⚙️ Services
      </a>
    </nav>
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
  </div>
</nav>

<style>

</style>
