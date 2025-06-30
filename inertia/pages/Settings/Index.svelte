<script>
  import { router } from '@inertiajs/svelte';
  import { DashboardLayout } from '../../app';

  // Props
  export let currentSection = 'hosters';
  export let user = null;

  // Sections disponibles
  const sections = [
    {
      id: 'hosters',
      name: 'Hébergeurs',
      icon: '🏢',
      description: 'Gérer les hébergeurs disponibles'
    },
    {
      id: 'general',
      name: 'Général',
      icon: '⚙️',
      description: 'Paramètres généraux de l\'application'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: '🔔',
      description: 'Préférences de notifications'
    },
    {
      id: 'security',
      name: 'Sécurité',
      icon: '🔐',
      description: 'Paramètres de sécurité'
    }
  ];

  function navigateToSection(sectionId) {
    router.visit(`/settings/${sectionId}`);
  }
</script>

<DashboardLayout {user} currentRoute="settings">
  <div class="min-h-screen">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-base-content mb-2">⚙️ Paramètres</h1>
        <p class="text-base-content/70">Configurez votre application selon vos préférences</p>
      </div>

      <!-- Layout principal -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Menu vertical gauche -->
        <div class="lg:col-span-1">
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body p-4">
              <h2 class="card-title text-lg mb-4">Navigation</h2>
              <ul class="menu menu-compact p-0 gap-1">
                {#each sections as section}
                  <li>
                    <button
                      on:click={() => navigateToSection(section.id)}
                      class="flex items-start p-3 rounded-lg transition-all duration-200 {currentSection === section.id ? 'bg-primary text-primary-content shadow-md' : 'hover:bg-base-200'}"
                    >
                      <span class="text-xl mr-3 flex-shrink-0">{section.icon}</span>
                      <div class="text-left">
                        <div class="font-medium">{section.name}</div>
                        <div class="text-xs opacity-70 mt-1">{section.description}</div>
                      </div>
                    </button>
                  </li>
                {/each}
              </ul>
            </div>
          </div>
        </div>

        <!-- Contenu principal droite -->
        <div class="lg:col-span-3">
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              {#if currentSection === 'hosters'}
                <slot name="hosters">
                  <div class="text-center py-8">
                    <div class="text-6xl mb-4">🏢</div>
                    <h3 class="text-xl font-bold mb-2">Gestion des Hébergeurs</h3>
                    <p class="text-base-content/70">Cette section sera développée prochainement</p>
                  </div>
                </slot>
              {:else if currentSection === 'general'}
                <div class="text-center py-8">
                  <div class="text-6xl mb-4">⚙️</div>
                  <h3 class="text-xl font-bold mb-2">Paramètres Généraux</h3>
                  <p class="text-base-content/70">Configuration générale de l'application</p>
                </div>
              {:else if currentSection === 'notifications'}
                <div class="text-center py-8">
                  <div class="text-6xl mb-4">🔔</div>
                  <h3 class="text-xl font-bold mb-2">Notifications</h3>
                  <p class="text-base-content/70">Gérer vos préférences de notifications</p>
                </div>
              {:else if currentSection === 'security'}
                <div class="text-center py-8">
                  <div class="text-6xl mb-4">🔐</div>
                  <h3 class="text-xl font-bold mb-2">Sécurité</h3>
                  <p class="text-base-content/70">Paramètres de sécurité et authentification</p>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</DashboardLayout>
