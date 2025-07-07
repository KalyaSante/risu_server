<script>
  import { router } from '@inertiajs/svelte';
  import { ActionButton, MarkdownEditor } from '../../components';
  import PortsEditor from '../../components/PortsEditor.svelte';
  import DependenciesEditor from '../../components/DependenciesEditor.svelte';
  import ImageSelector from '../../components/ImageSelector.svelte';

  // Props
  export let service = {};
  export let servers = [];
  export let selectedServer = null;
  export let availableServices = [];
  export let availableImages = [];
  export let errors = {};
  export let isEdit = false;

  // 🔍 DEBUG: Log des props reçues
  $: {
    console.log('🔍 DEBUG Form.svelte: availableImages reçues:', availableImages.length, availableImages);
  }

  // Form data
  let formData = {
    nom: service.nom || '',
    serverId: service.serverId || selectedServer?.id || '',
    selectedImageId: null, // ✅ NOUVEAU: ID de l'image sélectionnée
    icon: service.icon || '', // ✅ CHANGÉ: Garde pour rétrocompatibilité/URL custom
    path: service.path || '',
    repoUrl: service.repoUrl || '',
    docPath: service.docPath || '',
    description: service.description || '',
    note: service.note || '',
    lastMaintenanceAt: service.lastMaintenanceAt ? formatDatetimeLocal(service.lastMaintenanceAt) : ''
  };

  // Ports et dépendances
  let ports = service.ports || [{ port: '', label: 'web' }];
  let dependencies = service.dependencies || [];

  // État pour la modal de sélection d'images
  let showImageSelector = false;
  let selectedImage = null;

  // State
  let isSubmitting = false;

  // ✅ NOUVEAU: Initialiser l'image sélectionnée au chargement
  $: {
    if (availableImages.length > 0) {
      // Si le service a une imageMetadata (nouvelle relation)
      if (service.imageMetadata) {
        selectedImage = availableImages.find(img => img.id === service.imageMetadata.id) || null;
        formData.selectedImageId = service.imageMetadata.id;
        formData.icon = ''; // Clear l'URL custom
      }
      // Sinon, chercher par URL (ancien système)
      else if (formData.icon && !selectedImage) {
        selectedImage = availableImages.find(img => img.url === formData.icon) || null;
        if (selectedImage) {
          formData.selectedImageId = selectedImage.id;
          formData.icon = ''; // Migrer vers le nouveau système
        }
      }
    }
  }

  // ✅ NOUVEAU: Gestionnaire de sélection d'image amélioré
  function handleImageSelect(event) {
    const image = event.detail;
    if (image) {
      formData.selectedImageId = image.id; // ✅ NOUVEAU: Envoie l'ID
      formData.icon = ''; // Clear l'URL custom
      selectedImage = image;
      console.log('🔍 DEBUG: Image sélectionnée:', { id: image.id, label: image.label });
    } else {
      formData.selectedImageId = null;
      formData.icon = '';
      selectedImage = null;
      console.log('🔍 DEBUG: Aucune image sélectionnée');
    }
  }

  // ✅ NOUVEAU: Support pour URL custom (fallback)
  function handleCustomIconUrl(event) {
    const url = event.target.value.trim();
    if (url) {
      formData.icon = url;
      formData.selectedImageId = null; // Clear la sélection gérée
      selectedImage = null;
      console.log('🔍 DEBUG: URL custom définie:', url);
    }
  }

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

  function openImageSelector() {
    console.log('🔍 DEBUG: Ouverture du sélecteur avec', availableImages.length, 'images');
    showImageSelector = true;
  }

  function closeImageSelector() {
    showImageSelector = false;
  }

  function handleSubmit() {
    if (isSubmitting) return;

    isSubmitting = true;

    const submitData = { ...formData };

    // Ajouter les ports et dépendances au payload
    submitData.ports = ports;
    submitData.dependencies = dependencies;

    // ✅ NOUVEAU: Debug du payload
    console.log('🔍 DEBUG: Payload envoyé:', {
      selectedImageId: submitData.selectedImageId,
      icon: submitData.icon,
      hasSelectedImage: !!selectedImage
    });

    // Convert empty strings to null for optional fields
    if (!submitData.icon) submitData.icon = null;
    if (!submitData.selectedImageId) submitData.selectedImageId = null;
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
</script>

<!-- Service Form Component -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

  <!-- Form -->
  <div class="lg:col-span-2">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">

        <!-- 🔍 DEBUG: Affichage du nombre d'images -->
        <div class="mb-4 p-2 bg-base-200 rounded text-sm">
          <strong>DEBUG Form.svelte:</strong> {availableImages.length} images disponibles
          {#if selectedImage}
            • Image sélectionnée: {selectedImage.label} (ID: {selectedImage.id})
          {/if}
          {#if formData.icon}
            • URL custom: {formData.icon}
          {/if}
        </div>

        <form on:submit|preventDefault={handleSubmit}>
          <div class="space-y-6">

            <!-- Service name -->
            <div class="form-control">
              <label class="label" for="service_nom">
                <span class="label-text font-semibold">Nom du service *</span>
              </label>
              <input
                type="text"
                id="service_nom"
                bind:value={formData.nom}
                placeholder="ex: API Principale Laravel"
                class="input input-bordered {errors.nom ? 'input-error' : ''}"
                required
              />
              {#if errors.nom}
                <label class="label" for="service_nom_error">
                  <span class="label-text-alt text-error">{errors.nom}</span>
                </label>
              {/if}
            </div>

            <!-- Server -->
            <div class="form-control">
              <label class="label" for="service_serverId">
                <span class="label-text font-semibold">Serveur *</span>
              </label>
              <select
                id="service_serverId"
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
                <label class="label" for="service_serverId_error">
                  <span class="label-text-alt text-error">{errors.serverId}</span>
                </label>
              {/if}
            </div>

            <!-- ✅ AMÉLIORÉ: Sélection d'image avec support URL custom -->
            <div class="form-control">
              <label class="label" for="service_icon">
                <span class="label-text font-semibold">Icône du service</span>
                <span class="label-text-alt">Optionnel</span>
              </label>

              <!-- Onglets pour choisir le mode -->
              <div class="tabs tabs-boxed mb-4">
                <button
                  type="button"
                  class="tab {!formData.icon ? 'tab-active' : ''}"
                  on:click={() => {
                    formData.icon = '';
                    if (!selectedImage) openImageSelector();
                  }}
                >
                  🎨 Bibliothèque
                </button>
                <button
                  type="button"
                  class="tab {formData.icon ? 'tab-active' : ''}"
                  on:click={() => {
                    formData.selectedImageId = null;
                    selectedImage = null;
                  }}
                >
                  🔗 URL custom
                </button>
              </div>

              <!-- Mode bibliothèque -->
              {#if !formData.icon}
                <div class="flex items-center gap-4">
                  <!-- Prévisualisation -->
                  <div class="flex-shrink-0">
                    {#if selectedImage}
                      <div class="w-16 h-16 bg-base-100 rounded-lg flex items-center justify-center">
                        <img
                          src={selectedImage.url}
                          alt={selectedImage.label}
                          class="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    {:else}
                      <div class="w-16 h-16 bg-base-200 border-2 border-base-300 rounded-lg flex items-center justify-center text-base-content/50">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    {/if}
                  </div>

                  <!-- Informations et actions -->
                  <div class="flex-1">
                    {#if selectedImage}
                      <div class="mb-2">
                        <div class="font-semibold text-base-content">{selectedImage.label}</div>
                        {#if selectedImage.description}
                          <div class="text-sm text-base-content/70">{selectedImage.description}</div>
                        {/if}
                        <div class="text-xs text-base-content/50 mt-1">
                          ID: {selectedImage.id} • {selectedImage.filename}
                        </div>
                      </div>
                    {:else}
                      <div class="text-base-content/70 mb-2">
                        Aucune image sélectionnée
                      </div>
                    {/if}

                    <!-- Boutons d'action -->
                    <div class="flex gap-2">
                      <button
                        type="button"
                        class="btn btn-outline btn-sm"
                        on:click={openImageSelector}
                      >
                        🎨 {selectedImage ? 'Changer' : 'Choisir'} l'image
                      </button>
                      {#if selectedImage}
                        <button
                          type="button"
                          class="btn btn-ghost btn-sm"
                          on:click={() => { formData.selectedImageId = null; selectedImage = null; }}
                        >
                          🗑️ Supprimer
                        </button>
                      {/if}
                    </div>
                  </div>
                </div>
              {:else}
                <!-- Mode URL custom -->
                <div class="space-y-3">
                  <input
                    type="url"
                    placeholder="ex: https://example.com/icon.png"
                    bind:value={formData.icon}
                    on:input={handleCustomIconUrl}
                    class="input input-bordered w-full"
                  />

                  <!-- Prévisualisation URL custom -->
                  {#if formData.icon}
                    <div class="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                      <div class="w-12 h-12 bg-base-100 flex items-center justify-center">
                        <img
                          src={formData.icon}
                          alt="Icône custom"
                          class="w-full h-full object-cover"
                          on:error={(e) => e.target.style.display = 'none'}
                        />
                      </div>
                      <div class="text-sm">
                        <div class="font-medium">URL custom</div>
                        <div class="text-base-content/70 break-all">{formData.icon}</div>
                      </div>
                    </div>
                  {/if}
                </div>
              {/if}

              {#if errors.icon || errors.selectedImageId}
                <label class="label">
                  <span class="label-text-alt text-error">
                    {errors.icon || errors.selectedImageId}
                  </span>
                </label>
              {/if}

              <!-- Info sur la gestion des images -->
              <label class="label">
                <span class="label-text-alt">
                  💡 Utilisez la bibliothèque pour une gestion centralisée ou une URL pour des icônes externes.
                  <button
                    type="button"
                    class="link link-primary"
                    on:click={() => window.open('/settings/service-images', '_blank')}
                  >
                    Gérer les images
                  </button>
                </span>
              </label>
            </div>

            <!-- ✅ Ports multiples -->
            <PortsEditor bind:ports disabled={isSubmitting} />

            <!-- ✅ Gestion des dépendances -->
            <DependenciesEditor
              bind:dependencies
              {availableServices}
              disabled={isSubmitting}
            />

            <!-- Description -->
            <div class="form-control">
              <label class="label" for="service_description">
                <span class="label-text font-semibold">Description</span>
              </label>
              <textarea
                id="service_description"
                bind:value={formData.description}
                placeholder="Description courte du service et de son rôle"
                class="textarea textarea-bordered {errors.description ? 'textarea-error' : ''}"
                rows="3"
              ></textarea>
              {#if errors.description}
                <label class="label" for="service_description_error">
                  <span class="label-text-alt text-error">{errors.description}</span>
                </label>
              {/if}
            </div>

            <!-- ✅ Champ Note avec éditeur Markdown -->
            <MarkdownEditor
              bind:value={formData.note}
              label="📝 Notes techniques"
              placeholder="Documentez la configuration, les procédures de déploiement, les dépendances particulières, les solutions aux problèmes connus..."
              error={errors.note}
              rows="10"
            />

            <!-- Installation path -->
            <div class="form-control">
              <label class="label" for="service_path">
                <span class="label-text font-semibold">Chemin d'installation</span>
              </label>
              <input
                type="text"
                id="service_path"
                bind:value={formData.path}
                placeholder="ex: /var/www/api ou C:\inetpub\wwwroot\api"
                class="input input-bordered {errors.path ? 'input-error' : ''}"
              />
              {#if errors.path}
                <label class="label" for="service_path_error">
                  <span class="label-text-alt text-error">{errors.path}</span>
                </label>
              {/if}
            </div>

            <!-- Repository URL -->
            <div class="form-control">
              <label class="label" for="service_repoUrl">
                <span class="label-text font-semibold">URL du repository</span>
              </label>
              <input
                type="url"
                id="service_repoUrl"
                bind:value={formData.repoUrl}
                placeholder="ex: https://github.com/kalya/mon-service"
                class="input input-bordered {errors.repoUrl ? 'input-error' : ''}"
              />
              {#if errors.repoUrl}
                <label class="label" for="service_repoUrl_error">
                  <span class="label-text-alt text-error">{errors.repoUrl}</span>
                </label>
              {/if}
            </div>

            <!-- Documentation path -->
            <div class="form-control">
              <label class="label" for="service_docPath">
                <span class="label-text font-semibold">Documentation</span>
              </label>
              <input
                type="text"
                id="service_docPath"
                bind:value={formData.docPath}
                placeholder="ex: /docs/service.md ou https://docs.example.com"
                class="input input-bordered {errors.docPath ? 'input-error' : ''}"
              />
              {#if errors.docPath}
                <label class="label" for="service_docPath_error">
                  <span class="label-text-alt text-error">{errors.docPath}</span>
                </label>
              {/if}
            </div>

            <!-- Last maintenance -->
            <div class="form-control">
              <label class="label" for="service_lastMaintenanceAt">
                <span class="label-text font-semibold">Dernière maintenance</span>
              </label>
              <input
                type="datetime-local"
                id="service_lastMaintenanceAt"
                bind:value={formData.lastMaintenanceAt}
                class="input input-bordered {errors.lastMaintenanceAt ? 'input-error' : ''}"
              />
              {#if errors.lastMaintenanceAt}
                <label class="label" for="service_lastMaintenanceAt_error">
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
            <h3 class="font-semibold">🎨 Icône</h3>
            <p class="text-base-content/70">Sélectionnez une image depuis la bibliothèque ou utilisez une URL custom pour des icônes externes.</p>
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

    <!-- ✅ Types de dépendances -->
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

    <!-- ✅ Gestion des images -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-lg">🎨 Gestion des images</h2>
        <div class="space-y-3 text-sm">
          <p class="text-base-content/70">
            Utilisez la bibliothèque d'images pour une gestion centralisée de vos icônes de services.
          </p>

          <div class="flex flex-col gap-2">
            <button
              type="button"
              class="btn btn-outline btn-sm"
              on:click={openImageSelector}
            >
              🖼️ Parcourir les images
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              on:click={() => window.open('/settings/service-images', '_blank')}
            >
              ⚙️ Gérer les images
            </button>
          </div>

          <div class="text-xs text-base-content/60 pt-2 border-t border-base-300">
            <strong>Avantages :</strong>
            <ul class="list-disc list-inside mt-1 space-y-1">
              <li>Images centralisées et réutilisables</li>
              <li>Prévisualisation en temps réel</li>
              <li>Gestion des métadonnées</li>
              <li>Organisation par labels</li>
            </ul>
          </div>
        </div>
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

<!-- Modal de sélection d'images -->
<ImageSelector
  {availableImages}
  selectedImageUrl={selectedImage?.url || ''}
  bind:isOpen={showImageSelector}
  on:select={handleImageSelect}
  on:close={closeImageSelector}
/>
