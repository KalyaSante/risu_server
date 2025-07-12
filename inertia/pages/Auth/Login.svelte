<script lang="ts">
  import { onMount } from 'svelte'

  // Props reçues depuis le contrôleur AdonisJS
  interface Props {
    flashMessages?: {
      error?: string
      success?: string
    }
    version?: string
  }

  export let flashMessages: Props['flashMessages'] = undefined
  export let version: Props['version'] = '1.0.0'

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
<div class="min-h-screen flex items-center justify-center relative overflow-hidden">

  <!-- Éléments décoratifs animés -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl animate-pulse" style="animation-delay: 4s;"></div>
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
        <h1 class="text-4xl font-bold text-orange-600 flex items-center justify-center gap-2">
          <img src="/risu_512.png" class="h-20">
          <span>Risu Server</span>
        </h1>
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
            <span>Se connecter</span>
            <span class="text-xl group-hover:translate-x-1 transition-transform duration-300">→</span>
          {/if}
        </a>

      </div>
    </div>
  </div>

  <!-- Indicateur de version (optionnel) -->
  <div class="absolute bottom-4 right-4 text-xs text-base-content/30 bg-base-100/20 backdrop-blur px-2 py-1 rounded-full">
    v{version}
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
