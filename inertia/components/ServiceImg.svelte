<script>
  export let service = {};

  $: serviceName = service.name || service.nom || 'Service sans nom';
  $: iconUrl = service.icon;
</script>
<div class="aspect-square w-full bg-base-100 rounded-xl flex items-center justify-center shadow-lg">
  <img
    src={iconUrl}
    alt={serviceName}
    class="w-full h-full object-cover rounded-xl"
    on:error={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
  />
  <!-- Fallback icon si l'image ne charge pas -->
  <div class="w-full h-full flex items-center justify-center text-3xl text-base-content/50" style="display: none;">
    ⚙️
  </div>
</div>
