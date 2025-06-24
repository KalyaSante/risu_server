<script lang="ts">
  import { page, router } from '@inertiajs/svelte'
  import { onMount } from 'svelte'

  // Props globales disponibles sur toutes les pages
  export let auth: { user?: { fullName?: string, email: string } } = {}
  export let flashMessages: Record<string, string> = {}

  // Navigation réactive
  let loading = false

  // Écouter les changements de page pour le loading
  router.on('start', () => loading = true)
  router.on('finish', () => loading = false)

  // Auto-hide flash messages après 5 secondes
  onMount(() => {
    if (Object.keys(flashMessages).length > 0) {
      setTimeout(() => flashMessages = {}, 5000)
    }
  })

  function logout() {
    router.visit('/logout', { method: 'get' })
  }

  // Determine active page for navigation
  $: currentPath = $page.url
</script>

<svelte:head>
  <title>{$page.props.title || 'Kalya - Cartographie Services'}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content={$page.props.csrfToken}>
</svelte:head>

<div class="min-h-screen bg-base-300">
  <!-- Navigation Bar -->
  <div class="navbar bg-base-100 shadow-lg sticky top-0 z-50">
    <div class="navbar-start">
      <div class="dropdown lg:hidden">
        <div tabindex="0" role="button" class="btn btn-ghost">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </div>
        <ul class="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
          <li><a href="/" class:font-bold={currentPath === '/'}>Dashboard</a></li>
          <li><a href="/servers" class:font-bold={currentPath.startsWith('/servers')}>Serveurs</a></li>
          <li><a href="/services" class:font-bold={currentPath.startsWith('/services')}>Services</a></li>
        </ul>
      </div>

      <a href="/" class="btn btn-ghost text-xl font-bold">
        🗺️ Kalya Services
      </a>
    </div>

    <div class="navbar-center hidden lg:flex">
      <ul class="menu menu-horizontal px-1">
        <li>
          <a href="/" class="btn btn-ghost" class:btn-active={currentPath === '/'}>
            📊 Dashboard
          </a>
        </li>
        <li>
          <a href="/servers" class="btn btn-ghost" class:btn-active={currentPath.startsWith('/servers')}>
            🖥️ Serveurs
          </a>
        </li>
        <li>
          <a href="/services" class="btn btn-ghost" class:btn-active={currentPath.startsWith('/services')}>
            ⚙️ Services
          </a>
        </li>
      </ul>
    </div>

    <div class="navbar-end">
      <!-- Loading indicator -->
      {#if loading}
        <span class="loading loading-spinner loading-sm mr-2"></span>
      {/if}

      {#if auth.user}
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
            <div class="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
              {auth.user.fullName?.charAt(0) || auth.user.email?.charAt(0) || '?'}
            </div>
          </div>
          <ul class="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
            <li>
              <span class="text-sm opacity-70 pointer-events-none">
                {auth.user.fullName || auth.user.email}
              </span>
            </li>
            <li><hr class="my-1"></li>
            <li><a href="/profile">👤 Profil</a></li>
            <li><a href="/settings">⚙️ Paramètres</a></li>
            <li><hr class="my-1"></li>
            <li><button on:click={logout} class="text-error">🚪 Déconnexion</button></li>
          </ul>
        </div>
      {:else}
        <a href="/login" class="btn btn-primary">Se connecter</a>
      {/if}
    </div>
  </div>

  <!-- Loading Progress Bar -->
  {#if loading}
    <div class="w-full bg-base-300 h-1">
      <div class="bg-primary h-1 animate-pulse inertia-progress"></div>
    </div>
  {/if}

  <!-- Flash Messages -->
  <div class="sticky top-16 z-40">
    {#if flashMessages.error}
      <div class="alert alert-error mx-4 mt-4 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{flashMessages.error}</span>
        <button class="btn btn-sm btn-ghost" on:click={() => flashMessages.error = ''}>✕</button>
      </div>
    {/if}

    {#if flashMessages.success}
      <div class="alert alert-success mx-4 mt-4 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{flashMessages.success}</span>
        <button class="btn btn-sm btn-ghost" on:click={() => flashMessages.success = ''}>✕</button>
      </div>
    {/if}
  </div>

  <!-- Page Content -->
  <main class="container mx-auto px-4 py-6">
    <slot />
  </main>

  <!-- Footer -->
  <footer class="footer footer-center p-4 bg-base-300 text-base-content mt-8">
    <aside>
      <p class="text-sm">
        © 2025 <strong>Kalya</strong> - Outil interne de cartographie des services
        <br>
        <span class="opacity-70">Développé avec ❤️ et AdonisJS + Svelte</span>
      </p>
    </aside>
  </footer>
</div>

<style>
  @reference "../css/app.css"

  /* Transitions pour la navigation */
  .btn-active {
    @apply bg-primary/20 text-primary;
  }

  /* Animation pour l'avatar */
  .avatar {
    @apply transition-transform duration-200 hover:scale-110;
  }

  /* Style pour les flash messages */
  .alert {
    /*@apply animate-in slide-in-from-top-2 duration-300;*/
  }
</style>
