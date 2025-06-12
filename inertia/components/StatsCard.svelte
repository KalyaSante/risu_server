<script>
  // Props
  export let title = '';
  export let value = 0;
  export let subtitle = '';
  export let icon = '';
  export let color = 'primary'; // primary, success, warning, danger, info
  export let trend = null; // 'up', 'down', null
  export let trendValue = '';
</script>

<!-- Stats Card Component -->
<div class="stats-card stats-card--{color}">
  <div class="stats-card__content">
    {#if icon}
      <div class="stats-card__icon">
        {icon}
      </div>
    {/if}
    
    <div class="stats-card__info">
      <h3 class="stats-card__title">{title}</h3>
      <div class="stats-card__value">{value}</div>
      
      {#if subtitle}
        <p class="stats-card__subtitle">{subtitle}</p>
      {/if}
      
      {#if trend && trendValue}
        <div class="stats-card__trend" class:trend-up={trend === 'up'} class:trend-down={trend === 'down'}>
          <span class="stats-card__trend-icon">
            {trend === 'up' ? '↗' : '↘'}
          </span>
          <span class="stats-card__trend-value">{trendValue}</span>
        </div>
      {/if}
    </div>
  </div>
  
  {#if $$slots.footer}
    <div class="stats-card__footer">
      <slot name="footer" />
    </div>
  {/if}
</div>

<style>
  /* Stats Card styles will go here */
  .stats-card {
    /* Base card styles */
  }
  
  .stats-card--primary {
    /* Primary color variant */
  }
  
  .stats-card--success {
    /* Success color variant */
  }
  
  .stats-card--warning {
    /* Warning color variant */
  }
  
  .stats-card--danger {
    /* Danger color variant */
  }
  
  .stats-card--info {
    /* Info color variant */
  }
  
  .stats-card__content {
    /* Content container styles */
  }
  
  .stats-card__icon {
    /* Icon styles */
  }
  
  .stats-card__info {
    /* Info section styles */
  }
  
  .stats-card__title {
    /* Title styles */
  }
  
  .stats-card__value {
    /* Value styles */
  }
  
  .stats-card__subtitle {
    /* Subtitle styles */
  }
  
  .stats-card__trend {
    /* Trend container styles */
  }
  
  .stats-card__trend.trend-up {
    /* Trend up styles */
  }
  
  .stats-card__trend.trend-down {
    /* Trend down styles */
  }
  
  .stats-card__trend-icon {
    /* Trend icon styles */
  }
  
  .stats-card__trend-value {
    /* Trend value styles */
  }
  
  .stats-card__footer {
    /* Footer styles */
  }
</style>
