<script lang="ts">
  import { onMount } from 'svelte'

  // Props reçues depuis le contrôleur AdonisJS
  interface Props {
    flashMessages?: {
      error?: string
      success?: string
    }
  }

  export let flashMessages: Props['flashMessages'] = undefined

  // État local réactif
  let loading = false
  let mounted = false

  // URL générée côté serveur
  const loginUrl = '/auth/login'

  // Animation d'apparition
  onMount(() => {
    mounted = true
  })

  function handleLogin() {
    loading = true
    // L'état loading sera remis à false automatiquement lors du changement de page
  }
</script>

<svelte:head>
  <title>Connexion - Kalya</title>
  <meta name="description" content="Connectez-vous à votre plateforme de gestion d'infrastructure Kalya">
</svelte:head>

<!-- Container principal avec gradient animé -->
<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 relative overflow-hidden">

  <!-- Éléments décoratifs animés -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 4s;"></div>
  </div>

  <!-- Carte de connexion principale -->
  <div
    class="card w-full max-w-md bg-base-100/80 backdrop-blur-xl shadow-2xl border border-white/20 transform transition-all duration-700 hover:scale-105"
    class:translate-y-4={!mounted}
    class:opacity-0={!mounted}
  >
    <div class="card-body p-8">

      <!-- Header avec logo animé -->
      <div class="text-center mb-8">
        <div class="inline-block p-4 bg-gradient-to-br from-primary to-secondary rounded-full mb-4 transform transition-transform duration-300 hover:rotate-12 hover:scale-110">
          <span class="text-4xl">🖥️</span>
        </div>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Kalya
        </h1>
        <p class="text-base-content/70 mt-2">
          Plateforme de gestion d'infrastructure
        </p>
        <div class="w-16 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mt-3 rounded-full"></div>
      </div>

      <!-- Messages flash avec animations -->
      {#if flashMessages?.error}
        <div class="alert alert-error mb-6 animate-pulse shadow-lg">
          <div class="flex items-center gap-3">
            <span class="text-xl">❌</span>
            <span class="font-medium">{flashMessages.error}</span>
          </div>
        </div>
      {/if}

      {#if flashMessages?.success}
        <div class="alert alert-success mb-6 animate-pulse shadow-lg">
          <div class="flex items-center gap-3">
            <span class="text-xl">✅</span>
            <span class="font-medium">{flashMessages.success}</span>
          </div>
        </div>
      {/if}

      <!-- Section de connexion -->
      <div class="space-y-6">

        <!-- Bouton de connexion OAuth principal -->
        <a
          href={loginUrl}
          class="btn btn-primary w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-secondary border-0 hover:shadow-xl transform transition-all duration-300 hover:-translate-y-1 group"
          class:loading
          on:click={handleLogin}
        >
          {#if loading}
            <span class="loading loading-spinner loading-md"></span>
            <span>Connexion en cours...</span>
          {:else}
            <span class="text-2xl group-hover:scale-110 transition-transform duration-300">🔐</span>
            <span>Se connecter avec OAuth</span>
            <span class="text-xl group-hover:translate-x-1 transition-transform duration-300">→</span>
          {/if}
        </a>

        <!-- Informations supplémentaires -->
        <div class="bg-gradient-to-r from-base-200/50 to-base-300/50 rounded-xl p-4 text-center">
          <div class="flex items-center justify-center gap-2 text-sm text-base-content/70">
            <span class="text-lg">🛡️</span>
            <span>Connexion sécurisée via OAuth Kalya</span>
          </div>
          <p class="text-xs text-base-content/50 mt-2">
            Utilisez vos identifiants Kalya pour accéder à l'application
          </p>
        </div>

        <!-- Fonctionnalités de l'app -->
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-base-content/80 text-center">
            Fonctionnalités disponibles :
          </h3>
          <div class="grid grid-cols-1 gap-2 text-sm">
            <div class="flex items-center gap-3 text-base-content/70 hover:text-base-content transition-colors">
              <span class="text-lg">📊</span>
              <span>Dashboard interactif des services</span>
            </div>
            <div class="flex items-center gap-3 text-base-content/70 hover:text-base-content transition-colors">
              <span class="text-lg">🖥️</span>
              <span>Gestion des serveurs</span>
            </div>
            <div class="flex items-center gap-3 text-base-content/70 hover:text-base-content transition-colors">
              <span class="text-lg">⚙️</span>
              <span>Cartographie des dépendances</span>
            </div>
            <div class="flex items-center gap-3 text-base-content/70 hover:text-base-content transition-colors">
              <span class="text-lg">🔗</span>
              <span>Visualisation réseau temps réel</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="text-center mt-8 pt-6 border-t border-base-300/50">
        <p class="text-xs text-base-content/40 flex items-center justify-center gap-2">
          <span>© 2025 Kalya</span>
          <span class="text-primary">•</span>
          <span>Infrastructure Management Platform</span>
        </p>
        <div class="flex justify-center gap-4 mt-3">
          <div class="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <div class="w-2 h-2 bg-secondary rounded-full animate-pulse" style="animation-delay: 0.5s;"></div>
          <div class="w-2 h-2 bg-accent rounded-full animate-pulse" style="animation-delay: 1s;"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Indicateur de version (optionnel) -->
  <div class="absolute bottom-4 right-4 text-xs text-base-content/30 bg-base-100/20 backdrop-blur px-2 py-1 rounded-full">
    v2.1.0
  </div>
</div>

<style>
  /* Animations personnalisées */
  @keyframes gradientShift {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  .card {
    background: linear-gradient(135deg,
      hsl(var(--b1) / 0.95) 0%,
      hsl(var(--b1) / 0.85) 100%);
  }

  /* Animation de pulsation douce pour les éléments décoratifs */
  @keyframes softPulse {
    0%, 100% {
      opacity: 0.3;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.1);
    }
  }

  /* Effet glassmorphism pour la carte */
  .card {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  /* Hover effects pour les liens */
  .hover\:text-base-content:hover {
    transition: color 0.3s ease;
  }

  /* Animation d'entrée pour les messages flash */
  .alert {
    animation: slideInDown 0.5s ease-out;
  }

  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .card {
      margin: 1rem;
      max-width: calc(100vw - 2rem);
    }
  }
</style>
