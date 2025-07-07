<script>
  export let service = {};

  $: serviceName = service.name || service.nom || 'Service sans nom';
  // ✅ FIX: Logique intelligente pour l'icône
  $: iconUrl = service.iconUrl || service.icon || null;
  $: hasValidImage = iconUrl && iconUrl.trim() !== '';

  let imageError = false;
  let imageElement;

  // Réinitialiser l'état d'erreur quand l'URL change
  $: if (iconUrl) {
    imageError = false;
  }

  function handleImageError() {
    imageError = true;
    console.warn(`❌ Échec du chargement d'image pour ${serviceName}:`, iconUrl);
  }

  function handleImageLoad() {
    imageError = false;
    console.log(`✅ Image chargée avec succès pour ${serviceName}:`, iconUrl);
  }
</script>

<div class="aspect-square w-full bg-base-100 rounded-xl flex items-center justify-center shadow-lg">
  {#if hasValidImage && !imageError}
    <img
      bind:this={imageElement}
      src={iconUrl}
      alt={serviceName}
      class="w-full h-full object-cover rounded-xl"
      on:error={handleImageError}
      on:load={handleImageLoad}
    />
  {:else}
    <!-- Fallback icon si pas d'image ou erreur de chargement -->
    <div class="w-full h-full flex items-center justify-center text-3xl text-base-content/50">
      {#if service.imageMetadata}
        🎨 <!-- Icône pour image gérée mais non trouvée -->
      {:else if iconUrl}
        🔗 <!-- Icône pour URL externe cassée -->
      {:else}
        ⚙️ <!-- Icône par défaut -->
      {/if}
    </div>
  {/if}
</div>
