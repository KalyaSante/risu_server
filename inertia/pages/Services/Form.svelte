<script>
  import { router } from '@inertiajs/svelte';
  import { ActionButton, MarkdownEditor } from '../../components';
  import PortsEditor from '../../components/PortsEditor.svelte';
  import DependenciesEditor from '../../components/DependenciesEditor.svelte';

  // Props
  export let service = {};
  export let servers = [];
  export let selectedServer = null;
  export let availableServices = []; // ✅ NOUVEAU
  export let errors = {};
  export let isEdit = false;

  // Form data
  let formData = {
    nom: service.nom || '',
    serverId: service.serverId || selectedServer?.id || '',
    icon: service.icon || '',
    path: service.path || '',
    repoUrl: service.repoUrl || '',
    docPath: service.docPath || '',
    description: service.description || '',
    note: service.note || '',
    lastMaintenanceAt: service.lastMaintenanceAt ? formatDatetimeLocal(service.lastMaintenanceAt) : ''
  };

  // ✅ NOUVEAU: Ports multiples
  let ports = service.ports || [{ port: '', label: 'web' }];

  // ✅ NOUVEAU: Dépendances
  let dependencies = service.dependencies || [];

  // State
  let iconPreview = formData.icon;
  let isSubmitting = false;

  // Functions
  function formatDatetimeLocal(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function handleSubmit() {
    if (isSubmitting) return;

    isSubmitting = true;

    const submitData = { ...formData };

    // ✅ NOUVEAU: Ajouter les ports et dépendances au payload
    submitData.ports = ports;
    submitData.dependencies = dependencies;

    // Convert empty strings to null for optional fields
    if (!submitData.icon) submitData.icon = null;
    if (!submitData.path) submitData.path = null;
    if (!submitData.repoUrl) submitData.repoUrl = null;
    if (!submitData.docPath) submitData.docPath = null;
    if (!submitData.description) submitData.description = null;
    if (!submitData.note) submitData.note = null;
    if (!submitData.lastMaintenanceAt) submitData.lastMaintenanceAt = null;

    if (isEdit) {
      router.put(`/services/${service.id}`, submitData, {
        onFinish: () => {
          isSubmitting = false;
        }
      });
    } else {
      router.post('/services', submitData, {
        onFinish: () => {
          isSubmitting = false;
        }
      });
    }
  }

  function handleCancel() {
    if (isEdit) {
      router.visit(`/services/${service.id}`);
    } else {
      router.visit('/services');
    }
  }

  function confirmDelete() {
    if (!isEdit || !service.id) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer ce service ?\n\nCette action supprimera également toutes les dépendances associées et ne peut pas être annulée.')) {
      router.delete(`/services/${service.id}`);
    }
  }

  // Reactive statements
  $: iconPreview = formData.icon;

  // Suggested icons
  const suggestedIcons = [
    { icon: '🌐', name: 'laravel.svg' },
    { icon: '⚡', name: 'angular.svg' },
    { icon: '🗄️', name: 'mysql.svg' },
    { icon: '🔄', name: 'nginx.svg' },
    { icon: '⚡', name: 'redis.svg' },
    { icon: '📊', name: 'monitoring.svg' }
  ];
</script>

<!-- Service Form Component -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

  <!-- Form -->
  <div class="lg:col-span-2">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">

        <form on:submit|preventDefault={handleSubmit}>
          <div class="space-y-6">

            <!-- Service name -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Nom du service *</span>
              </label>
              <input
                type="text"
                bind:value={formData.nom}
                placeholder="ex: API Principale Laravel"
                class="input input-bordered {errors.nom ? 'input-error' : ''}"
                required
              />
              {#if errors.nom}
                <label class="label">
                  <span class="label-text-alt text-error">{errors.nom}</span>
                </label>
              {/if}
            </div>

            <!-- Server -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Serveur *</span>
              </label>
              <select
                bind:value={formData.serverId}
                class="select select-bordered {errors.serverId ? 'select-error' : ''}"
                required
              >
                <option value="">Choisir un serveur</option>
                {#each servers as server}
                  <option value={server.id}>
                    {server.name} ({server.ip})
                  </option>
                {/each}
              </select>
              {#if errors.serverId}
                <label class="label">
                  <span class="label-text-alt text-error">{errors.serverId}</span>
                </label>
              {/if}
            </div>

            <!-- ✅ NOUVEAU: Ports multiples -->
            <PortsEditor bind:ports disabled={isSubmitting} />

            <!-- ✅ NOUVEAU: Gestion des dépendances -->
            <DependenciesEditor
              bind:dependencies
              {availableServices}
              disabled={isSubmitting}
            />

            <!-- Description -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Description</span>
              </label>
              <textarea
                bind:value={formData.description}
                placeholder="Description courte du service et de son rôle"
                class="textarea textarea-bordered {errors.description ? 'textarea-error' : ''}"
                rows="3"
              ></textarea>
              {#if errors.description}
                <label class="label">
                  <span class="label-text-alt text-error">{errors.description}</span>
                </label>
              {/if}
            </div>

            <!-- ✅ NOUVEAU: Champ Note avec éditeur Markdown -->
            <MarkdownEditor
              bind:value={formData.note}
              label="📝 Notes techniques"
              placeholder="Documentez la configuration, les procédures de déploiement, les dépendances particulières, les solutions aux problèmes connus..."
              error={errors.note}
              rows="10"
            />

            <!-- Icon -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Icône</span>
                <span class="label-text-alt">Format: nom.svg</span>
              </label>
              <div class="flex gap-2">
                <input
                  type="text"
                  bind:value={formData.icon}
                  placeholder="ex: laravel.svg"
                  class="input input-bordered flex-1 {errors.icon ? 'input-error' : ''}"
                />
                {#if iconPreview}
                  <div class="flex items-center px-3 border border-base-300 rounded-lg bg-base-50">
                    <img
                      src="/icons/{iconPreview}"
                      alt="Icône"
                      class="w-6 h-6"
                      on:error={(e) => e.target.style.display='none'}
                    />
                  </div>
                {/if}
              </div>
              {#if errors.icon}
                <label class="label">
                  <span class="label-text-alt text-error">{errors.icon}</span>
                </label>
              {/if}
              <label class="label">
                <span class="label-text-alt">Placez vos icônes dans <code>public/icons/</code></span>
              </label>
            </div>

            <!-- Installation path -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Chemin d'installation</span>
              </label>
              <input
                type="text"
                bind:value={formData.path}
                placeholder="ex: /var/www/api ou C:\inetpub\wwwroot\api"
                class="input input-bordered {errors.path ? 'input-error' : ''}"
              />
              {#if errors.path}
                <label class="label">
                  <span class="label-text-alt text-error">{errors.path}</span>
                </label>
              {/if}
            </div>

            <!-- Repository URL -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">URL du repository</span>
              </label>
              <input
                type="url"
                bind:value={formData.repoUrl}
                placeholder="ex: https://github.com/kalya/mon-service"
                class="input input-bordered {errors.repoUrl ? 'input-error' : ''}"
              />
              {#if errors.repoUrl}
                <label class="label">
                  <span class="label-text-alt text-error">{errors.repoUrl}</span>
                </label>
              {/if}
            </div>

            <!-- Documentation path -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Documentation</span>
              </label>
              <input
                type="text"
                bind:value={formData.docPath}
                placeholder="ex: /docs/service.md ou https://docs.example.com"
                class="input input-bordered {errors.docPath ? 'input-error' : ''}"
              />
              {#if errors.docPath}
                <label class="label">
                  <span class="label-text-alt text-error">{errors.docPath}</span>
                </label>
              {/if}
            </div>

            <!-- Last maintenance -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Dernière maintenance</span>
              </label>
              <input
                type="datetime-local"
                bind:value={formData.lastMaintenanceAt}
                class="input input-bordered {errors.lastMaintenanceAt ? 'input-error' : ''}"
              />
              {#if errors.lastMaintenanceAt}
                <label class="label">
                  <span class="label-text-alt text-error">{errors.lastMaintenanceAt}</span>
                </label>
              {/if}
            </div>

          </div>

          <!-- Actions -->
          <div class="card-actions justify-end mt-8 pt-6 border-t border-base-300">
            <ActionButton variant="ghost" on:click={handleCancel} disabled={isSubmitting}>
              Annuler
            </ActionButton>
            <ActionButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isEdit ? '💾 Mettre à jour' : '➕ Créer le service'}
            </ActionButton>
          </div>

        </form>

      </div>
    </div>
  </div>

  <!-- Sidebar with help and suggestions -->
  <div class="lg:col-span-1 space-y-6">

    <!-- Tips -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-lg">💡 Conseils</h2>
        <div class="space-y-4 text-sm">

          <div>
            <h3 class="font-semibold">🏷️ Nom du service</h3>
            <p class="text-base-content/70">Utilisez un nom descriptif qui identifie clairement le service et sa fonction.</p>
          </div>

          <div>
            <h3 class="font-semibold">🔌 Ports</h3>
            <p class="text-base-content/70">Ajoutez tous les ports exposés par votre service. Le premier port sera considéré comme principal.</p>
          </div>

          <div>
            <h3 class="font-semibold">🔗 Dépendances</h3>
            <p class="text-base-content/70">Définissez les services dont celui-ci dépend pour fonctionner correctement. Utile pour tracer les pannes en cascade.</p>
          </div>

          <div>
            <h3 class="font-semibold">📝 Notes techniques</h3>
            <p class="text-base-content/70">Documentez tout ce qui pourrait être utile : configuration spéciale, procédures, troubleshooting, credentials...</p>
          </div>

          <div>
            <h3 class="font-semibold">🖥️ Serveur</h3>
            <p class="text-base-content/70">Sélectionnez le serveur qui héberge ce service.</p>
          </div>

          <div>
            <h3 class="font-semibold">🎨 Icône</h3>
            <p class="text-base-content/70">Nom du fichier d'icône (format SVG recommandé). Placez le fichier dans <code>public/icons/</code>.</p>
          </div>

          <div>
            <h3 class="font-semibold">📁 Chemin</h3>
            <p class="text-base-content/70">Chemin absolu où le service est installé sur le serveur.</p>
          </div>

          <div>
            <h3 class="font-semibold">🔗 Repository</h3>
            <p class="text-base-content/70">URL du repository Git (GitHub, GitLab, etc.) pour accéder au code source.</p>
          </div>

        </div>
      </div>
    </div>

    <!-- ✅ NOUVEAU: Types de dépendances -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-lg">🔗 Types de dépendances</h2>
        <div class="space-y-3 text-sm">

          <div>
            <h3 class="font-semibold text-error">🔴 Requise</h3>
            <p class="text-base-content/70">Service critique. Si cette dépendance tombe, le service principal ne peut pas fonctionner.</p>
          </div>

          <div>
            <h3 class="font-semibold text-warning">🟡 Optionnelle</h3>
            <p class="text-base-content/70">Service utile mais non critique. Le service principal peut fonctionner en mode dégradé.</p>
          </div>

          <div>
            <h3 class="font-semibold text-success">🟢 Fallback</h3>
            <p class="text-base-content/70">Service de secours ou alternatif, utilisé uniquement en cas de problème.</p>
          </div>

        </div>
      </div>
    </div>

    <!-- Suggested icons -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-lg">🎨 Icônes suggérées</h2>
        <div class="grid grid-cols-3 gap-2 text-xs">
          {#each suggestedIcons as suggestion}
            <button
              type="button"
              class="text-center hover:bg-base-200 p-2 rounded transition-colors"
              on:click={() => formData.icon = suggestion.name}
            >
              <div class="bg-red-100 p-2 rounded mb-1">{suggestion.icon}</div>
              <span>{suggestion.name}</span>
            </button>
          {/each}
        </div>
        <p class="text-xs text-base-content/70 mt-3">
          Téléchargez des icônes depuis
          <button
            type="button"
            class="link"
            on:click={() => window.open('https://simpleicons.org', '_blank')}
          >
            simpleicons.org
          </button>
        </p>
      </div>
    </div>

    <!-- Danger zone for edit mode -->
    {#if isEdit && service.id}
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-lg text-error">⚠️ Zone de danger</h2>
          <p class="text-sm text-base-content/70 mb-4">
            Ces actions sont irréversibles. Assurez-vous de bien comprendre les conséquences.
          </p>
          <ActionButton
            variant="error"
            size="sm"
            class="w-full"
            on:click={confirmDelete}
          >
            🗑️ Supprimer ce service
          </ActionButton>
        </div>
      </div>
    {/if}

  </div>

</div>
