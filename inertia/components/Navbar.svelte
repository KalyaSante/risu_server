<script>
  import { router } from '@inertiajs/svelte';
  import CryptoJS from 'crypto-js';

  // Props
  export let user = null;
  export let currentRoute = '';

  // Functions
  function logout() {
    // ✅ FIX: Forcer une redirection complète pour le logout
    window.location.href = '/logout';
  }

  function getInitials(name) {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  // ✅ Fonction Gravatar corrigée avec crypto-js et SHA256
  function getUserAvatarUrl(user, size = 40) {
    // Vérifier si l'utilisateur a un avatar personnalisé
    if (user?.avatar) {
      return user.avatar;
    }

    // Utiliser Gravatar si email disponible
    if (user?.email) {
      // 1. Nettoyer et normaliser l'email
      const email = user.email.toLowerCase().trim();

      // 2. Créer le hash SHA256
      const hash = CryptoJS.SHA256(email).toString();

      // 3. Construire l'URL Gravatar avec options
      const gravatarUrl = new URL('https://www.gravatar.com/avatar/' + hash);

      // Paramètres Gravatar
      const params = {
        s: size.toString(),                    // Taille
        d: 'identicon',                       // Image par défaut (identicon génère un motif unique)
        r: 'g',                              // Rating (g = general audience)
      };

      // Ajouter les paramètres à l'URL
      Object.entries(params).forEach(([key, value]) => {
        gravatarUrl.searchParams.set(key, value);
      });

      return gravatarUrl.toString();
    }

    // Fallback : retourner null pour utiliser les initiales
    return null;
  }

  // Reactive
  $: userName = user?.fullName || user?.name || user?.email || 'Utilisateur';
  $: userAvatar = getUserAvatarUrl(user, 32); // Taille 32px pour la navbar
</script>

<!-- Modern Navbar -->
<div class="navbar bg-base-100 shadow-lg px-4">
  <!-- Logo/Brand -->
  <div class="navbar-start">
    <button
      on:click={() => router.visit('/')}
      class="btn btn-ghost text-xl font-bold text-primary flex align-items-center"
    >
      <img src="/risu_128.png" alt="logo" class="w-8 h-8">
      <span>Risu Server</span>
    </button>

    <!-- Navigation Menu -->
    <div class="hidden lg:flex ml-8">
      <ul class="menu menu-horizontal px-1 gap-2">
        <li>
          <button
            on:click={() => router.visit('/')}
            class="btn btn-ghost btn-sm {currentRoute === 'dashboard' ? 'bg-primary text-primary-content' : ''}"
          >
            📊 Dashboard
          </button>
        </li>
        <li>
          <button
            on:click={() => router.visit('/servers')}
            class="btn btn-ghost btn-sm {currentRoute === 'servers' ? 'bg-primary text-primary-content' : ''}"
          >
            🖥️ Serveurs
          </button>
        </li>
        <li>
          <button
            on:click={() => router.visit('/services')}
            class="btn btn-ghost btn-sm {currentRoute === 'services' ? 'bg-primary text-primary-content' : ''}"
          >
            ⚙️ Services
          </button>
        </li>
      </ul>
    </div>
  </div>

  <!-- User Menu -->
  <div class="navbar-end gap-2">
    {#if user}

      <!-- User Profile -->
      <div class="flex items-center gap-3">
        <div class="avatar">
          <div class="w-8 h-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1">
            {#if userAvatar}
              <img src={userAvatar} alt={userName} class="object-cover" />
            {:else}
              <div class="bg-primary text-primary-content flex items-center justify-center text-sm font-bold">
                {getInitials(userName)}
              </div>
            {/if}
          </div>
        </div>
        <span class="text-sm font-medium hidden sm:block">{userName}</span>
      </div>

      <!-- Settings Button -->
      <button
        on:click={() => router.visit('/settings')}
        class="btn btn-ghost btn-circle {currentRoute.startsWith('settings') ? 'bg-primary text-primary-content' : ''}"
        title="Paramètres"
        aria-label="Paramètres"
      >
        ⚙️
      </button>

      <!-- Logout Button -->
      <button
        class="btn btn-ghost btn-circle text-error hover:bg-error hover:text-error-content"
        on:click={logout}
        title="Se déconnecter"
        aria-label="Se déconnecter"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>

    {:else}
      <!-- Login Link -->
      <button
        on:click={() => router.visit('/login')}
        class="btn btn-primary btn-sm"
      >
        Se connecter
      </button>
    {/if}

    <!-- Mobile Menu (Hamburger) -->
    <div class="dropdown dropdown-end lg:hidden">
      <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </div>
      <div class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-xl bg-base-100 rounded-box w-52 border border-base-300">
        <li>
          <button
            on:click={() => router.visit('/')}
            class="{currentRoute === 'dashboard' ? 'active' : ''}"
          >
            📊 Dashboard
          </button>
        </li>
        <li>
          <button
            on:click={() => router.visit('/servers')}
            class="{currentRoute === 'servers' ? 'active' : ''}"
          >
            🖥️ Serveurs
          </button>
        </li>
        <li>
          <button
            on:click={() => router.visit('/services')}
            class="{currentRoute === 'services' ? 'active' : ''}"
          >
            ⚙️ Services
          </button>
        </li>
      </div>
    </div>
  </div>
</div>

<style>
  /* Styles personnalisés si nécessaire */
  .dropdown-content {
    max-height: 400px;
    overflow-y: auto;
  }

  /* Animation pour les transitions de thème */
  :global(html) {
    transition: background-color 0.3s ease, color 0.3s ease;
  }
</style>
