<script>
  import { onMount } from 'svelte';
  import { Carta } from 'carta-md';

  // Import des plugins Carta
  import { code } from '@cartamd/plugin-code';
  import { emoji } from '@cartamd/plugin-emoji';
  import { math } from '@cartamd/plugin-math';
  import { anchor } from '@cartamd/plugin-anchor';

  // Import des styles Carta
  import 'carta-md/default.css';

  // Props
  export let content = '';
  export let title = '';
  export let class_name = '';

  let renderedContent = '';
  let carta;

  onMount(() => {
    // Configuration de Carta pour le rendu seulement
    carta = new Carta({
      sanitizer: false,
      extensions: [
        code({
          theme: 'github-light',
          languages: ['javascript', 'typescript', 'php', 'html', 'css', 'bash', 'sql', 'json', 'yaml', 'dockerfile']
        }),
        emoji(),
        math(),
        anchor()
      ]
    });

    // Rendre le contenu markdown
    if (content && content.trim()) {
      carta.render(content).then(html => {
        renderedContent = html;
      });
    }
  });

  // Reactive statement pour re-rendre si le contenu change
  $: if (carta && content && content.trim()) {
    carta.render(content).then(html => {
      renderedContent = html;
    });
  } else {
    renderedContent = '';
  }
</script>

<!-- Composant MarkdownViewer -->
{#if content && content.trim()}
  <div class="card bg-base-100 shadow-xl {class_name}">
    <div class="card-body">
      {#if title}
        <h2 class="card-title">{title}</h2>
      {/if}

      {#if renderedContent}
        <div class="markdown-content prose prose-sm max-w-none">
          {@html renderedContent}
        </div>
      {:else}
        <!-- Fallback pendant le chargement -->
        <div class="text-base-content/70 italic">
          {content}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  @import '../css/app.css';

  /* Styles pour le contenu markdown rendu */
  :global(.markdown-content) {
    @apply text-base-content;
  }

  :global(.markdown-content h1) {
    @apply text-2xl font-bold mt-6 mb-4;
  }

  :global(.markdown-content h2) {
    @apply text-xl font-bold mt-5 mb-3;
  }

  :global(.markdown-content h3) {
    @apply text-lg font-semibold mt-4 mb-2;
  }

  :global(.markdown-content h4, .markdown-content h5, .markdown-content h6) {
    @apply text-base font-semibold mt-3 mb-2;
  }

  :global(.markdown-content p) {
    @apply mb-4;
  }

  :global(.markdown-content ul, .markdown-content ol) {
    @apply mb-4 ml-6;
  }

  :global(.markdown-content ul) {
    @apply list-disc;
  }

  :global(.markdown-content ol) {
    @apply list-decimal;
  }

  :global(.markdown-content li) {
    @apply mb-1;
  }

  :global(.markdown-content blockquote) {
    @apply border-l-4 border-primary bg-base-200 pl-4 py-2 mb-4 italic;
  }

  :global(.markdown-content code) {
    @apply bg-base-200 px-2 py-1 rounded text-sm font-mono;
  }

  :global(.markdown-content pre) {
    @apply bg-base-200 p-4 rounded-lg mb-4 overflow-x-auto;
  }

  :global(.markdown-content pre code) {
    @apply bg-transparent p-0;
  }

  :global(.markdown-content a) {
    @apply link link-primary;
  }

  :global(.markdown-content table) {
    @apply table table-zebra w-full mb-4;
  }

  :global(.markdown-content th) {
    @apply font-semibold;
  }

  :global(.markdown-content hr) {
    @apply border-base-300 my-6;
  }

  :global(.markdown-content img) {
    @apply max-w-full h-auto rounded-lg shadow-md;
  }

  /* Thème sombre */
  :global([data-theme="dark"] .markdown-content code) {
    @apply bg-base-300;
  }

  :global([data-theme="dark"] .markdown-content pre) {
    @apply bg-base-300;
  }

  :global([data-theme="dark"] .markdown-content blockquote) {
    @apply bg-base-300;
  }
</style>
