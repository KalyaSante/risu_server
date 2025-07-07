<script>
  // Props pour futures notifications
  export let notifications = {};
</script>

<!-- Section Header -->
<div class="mb-6">
  <h3 class="text-2xl font-bold text-base-content mb-2">🔔 Notifications</h3>
  <p class="text-base-content/70">Gérer vos préférences de notifications</p>
</div>

<!-- Contenu de la section -->
<div class="space-y-6">
  <!-- Notifications système -->
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <h4 class="card-title text-lg">🚨 Alertes Système</h4>
      <div class="space-y-3">
        <div class="form-control">
          <label class="cursor-pointer label justify-start gap-3">
            <input type="checkbox" class="checkbox" checked />
            <span class="label-text">Serveur hors ligne</span>
          </label>
        </div>
        
        <div class="form-control">
          <label class="cursor-pointer label justify-start gap-3">
            <input type="checkbox" class="checkbox" checked />
            <span class="label-text">Service arrêté</span>
          </label>
        </div>
        
        <div class="form-control">
          <label class="cursor-pointer label justify-start gap-3">
            <input type="checkbox" class="checkbox" />
            <span class="label-text">Utilisation CPU élevée</span>
          </label>
        </div>
        
        <div class="form-control">
          <label class="cursor-pointer label justify-start gap-3">
            <input type="checkbox" class="checkbox" />
            <span class="label-text">Espace disque faible</span>
          </label>
        </div>
      </div>
    </div>
  </div>

  <!-- Canaux de notification -->
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <h4 class="card-title text-lg">📢 Canaux</h4>
      <div class="space-y-3">
        <div class="form-control">
          <label class="cursor-pointer label justify-start gap-3">
            <input type="checkbox" class="checkbox" checked />
            <span class="label-text">Notifications navigateur</span>
          </label>
        </div>
        
        <div class="form-control">
          <label class="cursor-pointer label justify-start gap-3">
            <input type="checkbox" class="checkbox" />
            <span class="label-text">Email</span>
          </label>
        </div>
        
        <div class="form-control">
          <label class="label">
            <span class="label-text">Email de notification</span>
          </label>
          <input 
            type="email" 
            placeholder="votre@email.com" 
            class="input input-bordered max-w-xs" 
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Actions -->
  <div class="flex gap-3">
    <button class="btn btn-primary">
      💾 Sauvegarder
    </button>
    <button class="btn btn-outline">
      🧪 Tester les notifications
    </button>
  </div>
</div>
