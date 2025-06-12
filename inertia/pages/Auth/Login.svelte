<script lang="ts">
  import { page } from '@inertiajs/svelte'

  // Props reçues depuis ton contrôleur AdonisJS
  interface Props {
    flashMessages?: {
      error?: string
      success?: string
    }
  }

  export let flashMessages: Props['flashMessages'] = undefined

  // État local réactif (comme Alpine.js mais en mieux !)
  let loading = false

  // URL générée côté serveur (comme ton helper route() Edge)
  const loginUrl = '/auth/login'
</script>

<svelte:head>
  <title>Connexion - Kalya Services</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
  <div class="card w-full max-w-md bg-base-100 shadow-2xl">
    <div class="card-body">
      <!-- Logo et titre -->
      <div class="text-center mb-6">
        <div class="text-6xl mb-4">🗺️</div>
        <h1 class="text-2xl font-bold">Cartographie Services</h1>
        <p class="text-base-content/70">Kalya - Infrastructure mapping</p>
      </div>

      <!-- Messages flash (équivalent @if flashMessages.has()) -->
      {#if flashMessages?.error}
        <div class="alert alert-error mb-4">
          <span>❌ {flashMessages.error}</span>
        </div>
      {/if}

      {#if flashMessages?.success}
        <div class="alert alert-success mb-4">
          <span>✅ {flashMessages.success}</span>
        </div>
      {/if}

      <!-- Bouton de connexion avec état réactif -->
      <div class="space-y-4">
        <a
          href={loginUrl}
          class="btn btn-primary w-full"
          class:loading
          on:click={() => loading = true}
        >
          {#if loading}
            <span class="loading loading-spinner"></span>
            Connexion...
          {:else}
            🔐 Se connecter avec OAuth Kalya
          {/if}
        </a>

        <div class="text-center text-sm text-base-content/50">
          <p>Utilisez vos identifiants Kalya pour accéder à l'application</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8 pt-6 border-t border-base-300">
        <p class="text-xs text-base-content/40">
          © 2025 Kalya - Outil interne de cartographie des services
        </p>
      </div>
    </div>
  </div>
</div>
