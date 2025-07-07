<script>
  // Props pour futures données de sécurité
  export let security = {};
</script>

<!-- Section Header -->
<div class="mb-6">
  <h3 class="text-2xl font-bold text-base-content mb-2">🔐 Sécurité</h3>
  <p class="text-base-content/70">Paramètres de sécurité et authentification</p>
</div>

<!-- Contenu de la section -->
<div class="space-y-6">
  <!-- Authentification -->
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <h4 class="card-title text-lg">🔑 Authentification</h4>
      <div class="space-y-3">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Durée de session</span>
          </label>
          <select class="select select-bordered max-w-xs">
            <option>1 heure</option>
            <option>4 heures</option>
            <option>1 jour</option>
            <option>1 semaine</option>
          </select>
        </div>
        
        <div class="form-control">
          <label class="cursor-pointer label justify-start gap-3">
            <input type="checkbox" class="checkbox" />
            <span class="label-text">Déconnexion automatique</span>
          </label>
        </div>
      </div>
    </div>
  </div>

  <!-- Accès API -->
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <h4 class="card-title text-lg">🔌 Accès API</h4>
      <div class="space-y-3">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Clé API personnelle</span>
          </label>
          <div class="join max-w-md">
            <input 
              type="text" 
              value="sk-************************************" 
              class="input input-bordered join-item flex-1" 
              readonly 
            />
            <button class="btn btn-outline join-item">🔄</button>
          </div>
          <label class="label">
            <span class="label-text-alt">Utilisée pour les intégrations externes</span>
          </label>
        </div>
        
        <div class="form-control">
          <label class="cursor-pointer label justify-start gap-3">
            <input type="checkbox" class="checkbox" checked />
            <span class="label-text">Activer l'accès API</span>
          </label>
        </div>
      </div>
    </div>
  </div>

  <!-- Logs de sécurité -->
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <h4 class="card-title text-lg">📋 Logs de Sécurité</h4>
      <div class="space-y-2">
        <div class="text-sm">
          <div class="flex justify-between">
            <span>Dernière connexion</span>
            <span class="font-mono">2024-01-15 14:32:18</span>
          </div>
          <div class="flex justify-between">
            <span>IP de connexion</span>
            <span class="font-mono">192.168.1.100</span>
          </div>
          <div class="flex justify-between">
            <span>Sessions actives</span>
            <span class="badge badge-success">1</span>
          </div>
        </div>
        
        <button class="btn btn-outline btn-sm">
          📜 Voir tous les logs
        </button>
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
