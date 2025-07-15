<script>
  import { page } from '@inertiajs/svelte'
  import { router } from '@inertiajs/svelte'
  import { onMount } from 'svelte'

  // Props
  export let security = {}

  // ✨ AMÉLIORATION: Récupération des données avec fallbacks
  $: apiKeys = security?.apiKeys || []
  $: totalKeys = security?.totalKeys || 0
  $: activeKeys = security?.activeKeys || 0
  $: recentlyUsedKeys = security?.recentlyUsedKeys || 0

  // ✨ NOUVEAU: Récupération des données du nouveau token depuis security.newToken
  $: newTokenData = security?.newToken || null
  $: newApiToken = newTokenData?.token
  $: newApiKeyName = newTokenData?.name
  $: newApiKeyId = newTokenData?.id
  $: isRegenerated = newTokenData?.isRegenerated || false

  // Variables d'état
  let newKeyName = ''
  let isCreating = false
  let copiedToClipboard = false
  let copyTimeout = null
  let showNewTokenCard = false

  // ✨ NOUVEAU: Afficher la carte du nouveau token au lieu de la modal
  $: if (newApiToken && newApiKeyName) {
    showNewTokenCard = true
  }

  // Nettoyage du timeout lors de la destruction du composant
  onMount(() => {
    return () => {
      if (copyTimeout) clearTimeout(copyTimeout)
    }
  })

  function createApiKey() {
    if (!newKeyName.trim()) return

    isCreating = true
    router.post('/settings/security/api-keys', {
      name: newKeyName.trim()
    }, {
      onFinish: () => {
        isCreating = false
        newKeyName = ''
      },
      onError: (errors) => {
        console.error('Erreur lors de la création:', errors)
      }
    })
  }

  function deleteApiKey(keyId, keyName) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la clé "${keyName}" ?\n\nCette action est irréversible et invalidera immédiatement tous les accès utilisant cette clé.`)) {
      router.delete(`/settings/security/api-keys/${keyId}`, {
        onError: (errors) => {
          console.error('Erreur lors de la suppression:', errors)
        }
      })
    }
  }

  function toggleApiKey(keyId, keyName, currentStatus) {
    const action = currentStatus ? 'désactiver' : 'activer'
    if (confirm(`Êtes-vous sûr de vouloir ${action} la clé "${keyName}" ?`)) {
      router.patch(`/settings/security/api-keys/${keyId}/toggle`, {}, {
        onError: (errors) => {
          console.error('Erreur lors de la modification:', errors)
        }
      })
    }
  }

  // ✨ AMÉLIORATION: Copie améliorée avec feedback visuel
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text)
      copiedToClipboard = true

      // Reset après 2 secondes
      if (copyTimeout) clearTimeout(copyTimeout)
      copyTimeout = setTimeout(() => {
        copiedToClipboard = false
      }, 2000)

    } catch (err) {
      console.error('Erreur lors de la copie:', err)
      // Fallback pour les navigateurs plus anciens
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)

      copiedToClipboard = true
      copyTimeout = setTimeout(() => {
        copiedToClipboard = false
      }, 2000)
    }
  }

  // ✨ NOUVEAU: Fermer la carte du nouveau token
  function dismissNewTokenCard() {
    showNewTokenCard = false
    copiedToClipboard = false
  }

  // ✨ NOUVEAU: Fonction pour formater les dates de manière lisible
  function formatDate(dateString) {
    if (!dateString) return 'Jamais'

    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Aujourd\'hui'
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`

    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // ✨ NOUVEAU: Fonction pour obtenir le badge de statut
  function getStatusBadge(apiKey) {
    if (!apiKey.isActive) return { class: 'badge-error', text: 'Inactive' }
    if (apiKey.isExpired) return { class: 'badge-warning', text: 'Expirée' }
    if (apiKey.usage?.isRecentlyUsed) return { class: 'badge-success', text: 'Active' }
    return { class: 'badge-info', text: 'Créée' }
  }

  // ✨ Variables réactives pour les exemples de code
  $: curlExample = newApiToken ? `curl -H "Authorization: Bearer ${newApiToken}" \\
     ${$page.url.origin}/api/v1/servers` : ''

  $: fetchExample = newApiToken ? `fetch('${$page.url.origin}/api/v1/me', {
  headers: {
    'Authorization': 'Bearer ${newApiToken}',
    'Content-Type': 'application/json'
  }
})` : ''

  $: authHeader = newApiToken ? `Authorization: Bearer ${newApiToken}` : ''
</script>

<!-- Section Header -->
<div class="mb-6">
  <h3 class="text-2xl font-bold text-base-content mb-2">🔐 Sécurité</h3>
  <p class="text-base-content/70">Paramètres de sécurité et authentification</p>
</div>

<!-- Contenu de la section -->
<div class="space-y-6">
  <!-- ✨ NOUVEAU: Statistiques globales -->
  {#if totalKeys > 0}
    <div class="stats stats-horizontal shadow bg-base-200 w-full">
      <div class="stat">
        <div class="stat-title">Total</div>
        <div class="stat-value text-primary">{totalKeys}</div>
        <div class="stat-desc">clé{totalKeys > 1 ? 's' : ''} créée{totalKeys > 1 ? 's' : ''}</div>
      </div>
      <div class="stat">
        <div class="stat-title">Actives</div>
        <div class="stat-value text-success">{activeKeys}</div>
        <div class="stat-desc">en service</div>
      </div>
      <div class="stat">
        <div class="stat-title">Récentes</div>
        <div class="stat-value text-info">{recentlyUsedKeys}</div>
        <div class="stat-desc">utilisées (7j)</div>
      </div>
    </div>
  {/if}

  <!-- Gestion des clés API -->
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <h4 class="card-title text-lg">🔌 Clés API</h4>

      <!-- Formulaire de création -->
      <div class="space-y-3 mb-4">
        <div class="form-control">
          <label class="label" for="new_api_key_name">
            <span class="label-text">Créer une nouvelle clé API</span>
          </label>
          <div class="join max-w-md">
            <input
              type="text"
              id="new_api_key_name"
              bind:value={newKeyName}
              placeholder="Ex: Mon application mobile"
              class="input input-bordered join-item flex-1"
              disabled={isCreating}
              maxlength="50"
              on:keydown={(e) => e.key === 'Enter' && createApiKey()}
            />
            <button
              class="btn btn-primary join-item"
              disabled={!newKeyName.trim() || newKeyName.trim().length < 3 || isCreating}
              on:click={createApiKey}
            >
              {#if isCreating}
                <span class="loading loading-spinner loading-sm"></span>
              {:else}
                ➕ Créer
              {/if}
            </button>
          </div>
          <div class="label">
            <span class="label-text-alt text-sm">
              Les clés API permettent d'accéder aux données via les endpoints REST
            </span>
            <span class="label-text-alt text-sm">
              {newKeyName.length}/50 caractères
            </span>
          </div>
        </div>
      </div>

      {#if showNewTokenCard && newApiToken}
        <div class="alert alert-success block mb-6 relative">
          <div class="w-full">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-2xl">🎉</span>
              <div>
                <h3 class="font-bold text-lg">
                  {isRegenerated ? 'Clé API régénérée !' : 'Clé API créée avec succès !'}
                </h3>
                <p class="text-sm opacity-80">Copiez cette clé maintenant, elle ne sera plus jamais affichée !</p>
              </div>
            </div>

            <div class="space-y-3">
              <div>
                <label class="label" for="new-api-key-name-display">
                  <span class="label-text font-semibold">Nom de la clé</span>
                </label>
                <div class="bg-base-100 text-base-content p-3 rounded-lg font-medium" id="new-api-key-name-display">
                  {newApiKeyName}
                </div>
              </div>

              <div>
                <label class="label" for="new-api-token-input">
                  <span class="label-text font-semibold">Token API</span>
                </label>
                <div class="join w-full">
                  <input
                    type="text"
                    value={newApiToken}
                    class="input input-bordered join-item flex-1 font-mono text-sm bg-base-100 text-base-content"
                    readonly
                    id="new-api-token-input"
                    on:click={() => copyToClipboard(newApiToken)}
                  />
                  <button
                    class="btn join-item"
                    class:btn-success={copiedToClipboard}
                    class:btn-primary={!copiedToClipboard}
                    on:click={() => copyToClipboard(newApiToken)}
                  >
                    {#if copiedToClipboard}
                      ✅ Copié !
                    {:else}
                      📋 Copier
                    {/if}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Liste des clés existantes -->
      {#if apiKeys.length > 0}
        <div class="space-y-3">
          <h5 class="font-semibold">Clés existantes</h5>
          {#each apiKeys as apiKey}
            {@const statusBadge = getStatusBadge(apiKey)}
            <div class="border border-base-300 rounded-lg p-4 bg-base-100">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="font-medium text-lg">{apiKey.name}</span>
                    <div class="badge badge-sm {statusBadge.class}">
                      {statusBadge.text}
                    </div>
                    {#if apiKey.usage?.hasBeenUsed}
                      <div class="badge badge-sm badge-outline">
                        Utilisée
                      </div>
                    {/if}
                  </div>

                  <div class="text-sm text-base-content/70 mb-1">
                    <span class="font-mono bg-base-200 px-2 py-1 rounded text-xs">
                      {apiKey.maskedToken || `${apiKey.prefix}_${'*'.repeat(40)}`}
                    </span>
                  </div>

                  <div class="text-xs text-base-content/50 space-y-1">
                    <div>
                      📅 Créée le {formatDate(apiKey.createdAt)}
                      {#if apiKey.usage?.ageInDays}
                        ({apiKey.usage.ageInDays} jour{apiKey.usage.ageInDays > 1 ? 's' : ''})
                      {/if}
                    </div>

                    {#if apiKey.lastUsedAt}
                      <div>
                        🕐 Dernière utilisation: {formatDate(apiKey.lastUsedAt)}
                        {#if apiKey.lastUsedIp}
                          depuis {apiKey.lastUsedIp}
                        {/if}
                      </div>
                    {:else}
                      <div class="text-warning">
                        ⚠️ Jamais utilisée
                      </div>
                    {/if}

                    {#if apiKey.hasExpiration}
                      <div class="{apiKey.isExpired ? 'text-error' : 'text-info'}">
                        ⏰ {apiKey.isExpired ? 'Expirée' : `Expire dans ${apiKey.daysUntilExpiration} jours`}
                      </div>
                    {/if}
                  </div>
                </div>

                <div class="flex gap-2">
                  <button
                    class="btn btn-sm btn-outline"
                    class:btn-success={!apiKey.isActive}
                    class:btn-warning={apiKey.isActive}
                    on:click={() => toggleApiKey(apiKey.id, apiKey.name, apiKey.isActive)}
                    title={apiKey.isActive ? 'Désactiver' : 'Activer'}
                  >
                    {apiKey.isActive ? '⏸️' : '▶️'}
                  </button>
                  <button
                    class="btn btn-sm btn-error btn-outline"
                    on:click={() => deleteApiKey(apiKey.id, apiKey.name)}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-8 text-base-content/50">
          <div class="text-4xl mb-2">🔑</div>
          <p>Aucune clé API créée</p>
          <p class="text-sm">Créez votre première clé pour accéder à l'API REST</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- ✨ AMÉLIORATION: Section d'informations utiles -->
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <h4 class="card-title text-lg">📖 Documentation API</h4>
      <div class="space-y-2 text-sm">
        <p><strong>Base URL:</strong> <code class="bg-base-300 px-2 py-1 rounded">{$page.url.origin}/api/v1</code></p>
        <p><strong>Authentification:</strong> <code class="bg-base-300 px-2 py-1 rounded">Authorization: Bearer YOUR_TOKEN</code></p>
        <div class="mt-3">
          <p><strong>Endpoints disponibles:</strong></p>
          <ul class="list-disc list-inside ml-4 space-y-1">
            <li><code>GET /api/v1/me</code> - Informations du compte</li>
            <li><code>GET /api/v1/servers</code> - Liste des serveurs</li>
            <li><code>GET /api/v1/services</code> - Liste des services</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <!-- Actions -->
  <div class="flex gap-3">
    <button class="btn btn-primary">
      💾 Sauvegarder
    </button>
    <button class="btn btn-error btn-outline">
      🚪 Déconnecter toutes les sessions
    </button>
  </div>
</div>
