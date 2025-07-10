<script>
  import { onMount } from 'svelte';

  // State pour la gestion des thèmes
  let currentTheme = 'light';

  // Thèmes DaisyUI officiels (35 thèmes disponibles dans v5)
  const themes = [
    { value: 'light', name: '☀️ Clair', icon: '☀️' },
    { value: 'dark', name: '🌙 Sombre', icon: '🌙' },
    { value: 'cupcake', name: '🧁 Cupcake', icon: '🧁' },
    { value: 'bumblebee', name: '🐝 Bumblebee', icon: '🐝' },
    { value: 'emerald', name: '💚 Emerald', icon: '💚' },
    { value: 'corporate', name: '🏢 Corporate', icon: '🏢' },
    { value: 'synthwave', name: '🌆 Synthwave', icon: '🌆' },
    { value: 'retro', name: '📺 Retro', icon: '📺' },
    { value: 'cyberpunk', name: '🤖 Cyberpunk', icon: '🤖' },
    { value: 'valentine', name: '💝 Valentine', icon: '💝' },
    { value: 'halloween', name: '🎃 Halloween', icon: '🎃' },
    { value: 'garden', name: '🌻 Garden', icon: '🌻' },
    { value: 'forest', name: '🌲 Forest', icon: '🌲' },
    { value: 'aqua', name: '🌊 Aqua', icon: '🌊' },
    { value: 'lofi', name: '🎵 Lo-Fi', icon: '🎵' },
    { value: 'pastel', name: '🎨 Pastel', icon: '🎨' },
    { value: 'fantasy', name: '🦄 Fantasy', icon: '🦄' },
    { value: 'wireframe', name: '📐 Wireframe', icon: '📐' },
    { value: 'black', name: '⚫ Black', icon: '⚫' },
    { value: 'luxury', name: '💎 Luxury', icon: '💎' },
    { value: 'dracula', name: '🧛 Dracula', icon: '🧛' },
    { value: 'cmyk', name: '🖨️ CMYK', icon: '🖨️' },
    { value: 'autumn', name: '🍂 Autumn', icon: '🍂' },
    { value: 'business', name: '💼 Business', icon: '💼' },
    { value: 'acid', name: '🧪 Acid', icon: '🧪' },
    { value: 'lemonade', name: '🍋 Lemonade', icon: '🍋' },
    { value: 'night', name: '🌌 Night', icon: '🌌' },
    { value: 'coffee', name: '☕ Coffee', icon: '☕' },
    { value: 'winter', name: '❄️ Winter', icon: '❄️' },
    { value: 'dim', name: '🔅 Dim', icon: '🔅' },
    { value: 'nord', name: '🧊 Nord', icon: '🧊' },
    { value: 'sunset', name: '🌅 Sunset', icon: '🌅' }
  ];

  // State pour les autres paramètres
  let autoRefresh = true;
  let refreshInterval = '10';
  let reducedAnimations = false;

  // Functions
  function changeTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kalya-theme', theme);
  }

  function saveSettings() {
    // Ici tu peux ajouter la logique pour sauvegarder tous les paramètres
    localStorage.setItem('kalya-auto-refresh', autoRefresh.toString());
    localStorage.setItem('kalya-refresh-interval', refreshInterval);
    localStorage.setItem('kalya-reduced-animations', reducedAnimations.toString());

    alert('Paramètres sauvegardés avec succès !');
  }

  function resetSettings() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      currentTheme = 'light';
      autoRefresh = true;
      refreshInterval = '10';
      reducedAnimations = false;

      changeTheme('light');
      localStorage.removeItem('kalya-auto-refresh');
      localStorage.removeItem('kalya-refresh-interval');
      localStorage.removeItem('kalya-reduced-animations');

      alert('Paramètres réinitialisés !');
    }
  }

  // Lifecycle
  onMount(() => {
    // Charger les paramètres sauvegardés
    const savedTheme = localStorage.getItem('kalya-theme') || 'light';
    const savedAutoRefresh = localStorage.getItem('kalya-auto-refresh');
    const savedRefreshInterval = localStorage.getItem('kalya-refresh-interval') || '10';
    const savedReducedAnimations = localStorage.getItem('kalya-reduced-animations');

    currentTheme = savedTheme;
    changeTheme(savedTheme);

    if (savedAutoRefresh !== null) {
      autoRefresh = savedAutoRefresh === 'true';
    }

    refreshInterval = savedRefreshInterval;

    if (savedReducedAnimations !== null) {
      reducedAnimations = savedReducedAnimations === 'true';
    }
  });

  // Reactive
  $: currentThemeData = themes.find(t => t.value === currentTheme) || themes[0];
</script>

<!-- Section Header -->
<div class="mb-6">
  <h3 class="text-2xl font-bold text-base-content mb-2">⚙️ Paramètres Généraux</h3>
  <p class="text-base-content/70">Configuration générale de l'application</p>
</div>

<!-- Contenu de la section -->
<div class="space-y-6">
  <!-- Apparence -->
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <h4 class="card-title text-lg">🎨 Apparence</h4>
      <div class="space-y-4">
        <!-- Sélecteur de thème -->
        <div class="form-control">
          <div class="label">
            <span class="label-text font-medium">Thème actuel</span>
          </div>
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">{currentThemeData.icon}</span>
            <span class="font-medium">{currentThemeData.name}</span>
          </div>

          <!-- Grille de thèmes -->
          <div class="bg-base-100 rounded-lg p-4 border border-base-300">
            <h5 class="font-medium mb-3">Choisir un thème :</h5>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {#each themes as theme}
                <button
                  class="btn btn-sm justify-start {currentTheme === theme.value ? 'btn-primary' : 'btn-ghost'}"
                  on:click={() => changeTheme(theme.value)}
                >
                  <span class="mr-2">{theme.icon}</span>
                  <span class="text-xs">{theme.name.replace(/^.+?\s/, '')}</span>
                </button>
              {/each}
            </div>
          </div>
        </div>

        <div class="form-control">
          <label class="cursor-pointer label justify-start gap-3">
            <input type="checkbox" class="checkbox" bind:checked={reducedAnimations} />
            <span class="label-text">Animations réduites</span>
          </label>
          <div class="label-text-alt text-sm ml-10 -mt-2"> <!-- Ajustement pour aligner sous le checkbox text -->
            Réduit les animations pour améliorer les performances
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>

</style>
