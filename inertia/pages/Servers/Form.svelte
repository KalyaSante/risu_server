<script>
  import { DashboardLayout } from '../../app';
  import { ActionButton, MarkdownEditor } from '../../components';
  import { router } from '@inertiajs/svelte';

  // Props from Inertia
  export let server = null;
  export let user = {};
  export let flash = {};
  export let errors = {};
  export let servers = [];

  // Data
  const hebergeurs = ['OVH', 'Scaleway', 'AWS', 'Azure', 'Google Cloud', 'DigitalOcean', 'Hetzner', 'Local', 'Autre'];

  // Form state
  let form = {
    nom: server?.nom || '',
    ip: server?.ip || '',
    hebergeur: server?.hebergeur || '',
    localisation: server?.localisation || '',
    parentServerId: server?.parentServerId || null,
    note: server?.note || ''
  };

  // Reactive variables
  $: isEdit = !!server;
  $: submitUrl = isEdit ? `/servers/${server.id}` : '/servers';
  $: cancelUrl = isEdit ? `/servers/${server.id}` : '/servers';

  // Functions
  function handleSubmit() {
    const options = {
      data: { ...form, parentServerId: form.parentServerId ? Number(form.parentServerId) : null },
      preserveScroll: true
    };

    if (isEdit) {
      router.put(submitUrl, options);
    } else {
      router.post(submitUrl, options);
    }
  }

  function handleCancel() {
    router.visit(cancelUrl);
  }

  function confirmDelete() {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce serveur ?\n\nCette action supprimera également tous les services associés et ne peut pas être annulée.')) {
      router.delete(`/servers/${server.id}`, {
        onSuccess: () => {
          router.visit('/servers');
        }
      });
    }
  }

  // Breadcrumbs
  $: breadcrumbs = [
    { label: 'Serveurs', href: '/servers' },
    ...(isEdit ? [
      { label: server.nom, href: `/servers/${server.id}` },
      { label: 'Modifier' }
    ] : [
      { label: 'Nouveau serveur' }
    ])
  ];
</script>

<svelte:head>
  <title>{isEdit ? 'Modifier' : 'Nouveau'} serveur - Kalya</title>
</svelte:head>

<DashboardLayout {user} {flash} title="{isEdit ? 'Modifier' : 'Nouveau'} serveur - Kalya" currentRoute="servers">
  <!-- En-tête -->
  <div class="mb-6">
    <div class="breadcrumbs text-sm">
      <ul>
        {#each breadcrumbs as crumb}
          <li>
            {#if crumb.href}
              <a href={crumb.href} class="link" on:click|preventDefault={() => router.visit(crumb.href)}>
                {crumb.label}
              </a>
            {:else}
              {crumb.label}
            {/if}
          </li>
        {/each}
      </ul>
    </div>
    <h1 class="text-3xl font-bold mt-2">
      {isEdit ? '✏️ Modifier' : '➕ Nouveau'} serveur
    </h1>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Formulaire -->
    <div class="lg:col-span-2">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <form on:submit|preventDefault={handleSubmit}>
            <div class="space-y-6">
              <!-- Nom du serveur -->
              <div class="form-control">
                <label class="label" for="server_nom">
                  <span class="label-text font-semibold">Nom du serveur *</span>
                </label>
                <input
                  type="text"
                  id="server_nom"
                  bind:value={form.nom}
                  placeholder="ex: Serveur Production"
                  class="input input-bordered {errors.nom ? 'input-error' : ''}"
                  required
                >
                {#if errors.nom}
                  <label class="label" for="server_nom_error">
                    <span class="label-text-alt text-error">{errors.nom}</span>
                  </label>
                {/if}
              </div>

              <!-- Adresse IP -->
              <div class="form-control">
                <label class="label" for="server_ip">
                  <span class="label-text font-semibold">Adresse IP *</span>
                </label>
                <input
                  type="text"
                  id="server_ip"
                  bind:value={form.ip}
                  placeholder="ex: 192.168.1.100 ou 51.210.45.123"
                  class="input input-bordered {errors.ip ? 'input-error' : ''}"
                  required
                >
                {#if errors.ip}
                  <label class="label" for="server_ip_error">
                    <span class="label-text-alt text-error">{errors.ip}</span>
                  </label>
                {/if}
              </div>

              <!-- Hébergeur -->
              <div class="form-control">
                <label class="label" for="server_hebergeur">
                  <span class="label-text font-semibold">Hébergeur *</span>
                </label>
                <select
                  id="server_hebergeur"
                  bind:value={form.hebergeur}
                  class="select select-bordered {errors.hebergeur ? 'select-error' : ''}"
                  required
                >
                  <option value="">Choisir un hébergeur</option>
                  {#each hebergeurs as hebergeur}
                    <option value={hebergeur}>{hebergeur}</option>
                  {/each}
                </select>
                {#if errors.hebergeur}
                  <label class="label" for="server_hebergeur_error">
                    <span class="label-text-alt text-error">{errors.hebergeur}</span>
                  </label>
                {/if}
              </div>

              <!-- Localisation -->
              <div class="form-control">
                <label class="label" for="server_localisation">
                  <span class="label-text font-semibold">Localisation *</span>
                </label>
                <input
                  type="text"
                  id="server_localisation"
                  bind:value={form.localisation}
                  placeholder="ex: Strasbourg, France ou Bureau Kalya"
                  class="input input-bordered {errors.localisation ? 'input-error' : ''}"
                  required
                >
                {#if errors.localisation}
                  <label class="label" for="server_localisation_error">
                    <span class="label-text-alt text-error">{errors.localisation}</span>
                  </label>
                {/if}
              </div>

              <!-- Serveur parent -->
              <div class="form-control">
                <label class="label" for="server_parentServerId">
                  <span class="label-text font-semibold">Hébergé dans</span>
                </label>
                <select
                  id="server_parentServerId"
                  bind:value={form.parentServerId}
                  class="select select-bordered"
                >
                  <option value="">Aucun</option>
                  {#each servers as s}
                    <option value={s.id}>{s.name}</option>
                  {/each}
                </select>
                {#if errors.parentServerId}
                  <label class="label" for="server_parentServerId_error">
                    <span class="label-text-alt text-error">{errors.parentServerId}</span>
                  </label>
                {/if}
              </div>

              <!-- ✅ NOUVEAU: Champ Note avec éditeur Markdown -->
              <MarkdownEditor
                bind:value={form.note}
                label="📝 Notes"
                placeholder="Ajoutez des notes sur ce serveur : configuration, accès, informations importantes..."
                error={errors.note}
                rows="8"
              />
            </div>

            <!-- Actions -->
            <div class="card-actions justify-end mt-8 pt-6 border-t border-base-300">
              <ActionButton variant="ghost" on:click={handleCancel}>
                Annuler
              </ActionButton>
              <ActionButton variant="primary" type="submit">
                {isEdit ? '💾 Mettre à jour' : '➕ Créer le serveur'}
              </ActionButton>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Aide et informations -->
    <div class="lg:col-span-1">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-lg">💡 Conseils</h2>
          <div class="space-y-4 text-sm">
            <div>
              <h3 class="font-semibold">🏷️ Nom du serveur</h3>
              <p class="text-base-content/70">Utilisez un nom descriptif et unique (ex: "Serveur Production", "DB Master").</p>
            </div>

            <div>
              <h3 class="font-semibold">🌐 Adresse IP</h3>
              <p class="text-base-content/70">IP publique ou privée selon votre infrastructure. Format IPv4 ou IPv6 accepté.</p>
            </div>

            <div>
              <h3 class="font-semibold">🏢 Hébergeur</h3>
              <p class="text-base-content/70">Sélectionnez l'hébergeur ou "Local" pour vos serveurs internes.</p>
            </div>

            <div>
              <h3 class="font-semibold">📍 Localisation</h3>
              <p class="text-base-content/70">Précisez la ville/pays ou le lieu physique pour une meilleure organisation.</p>
            </div>

            <div>
              <h3 class="font-semibold">📝 Notes</h3>
              <p class="text-base-content/70">Documentez les informations importantes : credentials, procédures, configurations spéciales...</p>
            </div>
          </div>
        </div>
      </div>

      {#if isEdit}
        <!-- Actions avancées -->
        <div class="card bg-base-100 shadow-xl mt-6">
          <div class="card-body">
            <h2 class="card-title text-lg text-error">⚠️ Zone de danger</h2>
            <p class="text-sm text-base-content/70 mb-4">
              Ces actions sont irréversibles. Assurez-vous de bien comprendre les conséquences.
            </p>
            <ActionButton variant="error" size="sm" class="w-full" on:click={confirmDelete}>
              🗑️ Supprimer ce serveur
            </ActionButton>
          </div>
        </div>
      {/if}
    </div>
  </div>
</DashboardLayout>
