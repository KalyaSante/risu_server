<script>
  import { onMount } from 'svelte';
  
  // Props
  export let autoStart = true;
  export let interval = 5000; // 5 seconds default
  
  // State
  let networkStatus = 'checking';
  let servers = [];
  let services = [];
  
  // Functions
  async function checkNetworkStatus() {
    try {
      networkStatus = 'checking';
      
      // Check servers status
      const serversResponse = await fetch('/api/servers/status');
      if (serversResponse.ok) {
        servers = await serversResponse.json();
      }
      
      // Check services status  
      const servicesResponse = await fetch('/api/services/status');
      if (servicesResponse.ok) {
        services = await servicesResponse.json();
      }
      
      networkStatus = 'online';
    } catch (error) {
      console.error('Network check failed:', error);
      networkStatus = 'offline';
    }
  }
  
  function startNetworkMonitoring() {
    return setInterval(checkNetworkStatus, interval);
  }
  
  function stopNetworkMonitoring(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
    }
  }
  
  // Lifecycle
  onMount(() => {
    let intervalId;
    
    if (autoStart) {
      checkNetworkStatus(); // Initial check
      intervalId = startNetworkMonitoring();
    }
    
    // Cleanup on component destroy
    return () => {
      stopNetworkMonitoring(intervalId);
    };
  });
  
  // Expose data to parent component
  $: if ($$props.onStatusChange) {
    $$props.onStatusChange({
      networkStatus,
      servers,
      services
    });
  }
</script>

<!-- Network Script Component -->
<!-- This component runs network monitoring in the background -->
<!-- It can be included in layouts or pages that need real-time status updates -->

{#if $$slots.default}
  <div class="network-status">
    <div class="network-status__indicator" class:online={networkStatus === 'online'} class:offline={networkStatus === 'offline'} class:checking={networkStatus === 'checking'}>
      {networkStatus}
    </div>
    <slot {networkStatus} {servers} {services} />
  </div>
{/if}

<style>
  /* Network Status styles will go here */
  .network-status {
    /* Container styles */
  }
  
  .network-status__indicator {
    /* Indicator styles */
  }
  
  .network-status__indicator.online {
    /* Online indicator styles */
  }
  
  .network-status__indicator.offline {
    /* Offline indicator styles */
  }
  
  .network-status__indicator.checking {
    /* Checking indicator styles */
  }
</style>
