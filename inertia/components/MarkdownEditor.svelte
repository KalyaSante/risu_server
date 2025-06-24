<script>
  import { Carta, MarkdownEditor } from 'carta-md';
  import { code } from '@cartamd/plugin-code';
  import { emoji } from '@cartamd/plugin-emoji';
  import { slash } from '@cartamd/plugin-slash';
  import { math } from '@cartamd/plugin-math';

  // Import des styles Carta
  import 'carta-md/default.css';

  // Props
  export let value = '';
  export let placeholder = 'Écrivez votre note en markdown...';
  export let label = '';
  export let error = '';
  export let rows = 6;
  export let disabled = false;
  export let required = false;

  // Instance Carta
  const carta = new Carta({
    sanitizer: false,
    extensions: [
      code(),
      emoji(),
      slash(),
      math()
    ]
  });
</script>

<!-- Composant MarkdownEditor -->
<div class="form-control w-full">
  {#if label}
    <label class="label">
      <span class="label-text font-semibold">
        {label}
        {#if required}<span class="text-error">*</span>{/if}
      </span>
    </label>
  {/if}

  <div class="carta-container {error ? 'border-error' : ''}" style="min-height: {rows * 1.5}rem;">
    <MarkdownEditor
      {carta}
      bind:value
      mode="tabs"
      {placeholder}
      {disabled}
    />
  </div>

  {#if error}
    <label class="label">
      <span class="label-text-alt text-error">{error}</span>
    </label>
  {/if}

  <label class="label">
    <span class="label-text-alt text-xs opacity-70">
      ✨ Éditeur markdown avec aperçu en temps réel
    </span>
  </label>
</div>

<style>
  @import '../css/app.css';

  .carta-container {
    @apply border border-base-300 rounded-lg overflow-hidden bg-base-100;
  }

  .carta-container.border-error {
    @apply border-error;
  }

  .carta-container:focus-within {
    @apply outline-2 outline-primary outline-offset-2;
  }

  :global(.carta-theme__default button){
    @apply text-base-content;
  }

  /* Styles globaux pour l'éditeur Carta */
  :global(.carta-container .carta-editor) {
    border: none !important;
    background: transparent !important;
  }

  :global(.carta-container .carta-input) {
    @apply bg-base-100 text-base-content text-base-content;
    border: none !important;
    padding: 1rem !important;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', monospace;
    font-size: 14px;
    line-height: 1.5;
  }

  :global(.carta-container .carta-preview) {
    @apply bg-base-100 text-base-content;
    padding: 1rem !important;
  }

  /* Thème sombre */
  :global([data-theme="dark"] .carta-container .carta-preview) {
    @apply bg-base-200;
  }

  /* Onglets */
  :global(.carta-container .carta-tabs) {
    @apply bg-base-200 border-b border-base-300;
    margin: 0 !important;
    padding: 0 !important;
  }

  :global(.carta-container .carta-tab) {
    @apply px-4 py-2 text-sm font-medium transition-colors cursor-pointer;
    border: none !important;
    background: transparent !important;
    margin: 0 !important;
  }

  :global(.carta-container .carta-tab.active) {
    @apply bg-primary text-primary-content;
  }

  :global(.carta-container .carta-tab:not(.active)) {
    @apply text-base-content/70 hover:text-base-content hover:bg-base-300;
  }

  /* Styles markdown dans l'aperçu */
  :global(.carta-container .carta-preview h1) {
    @apply text-2xl font-bold mt-6 mb-4 first:mt-0;
  }

  :global(.carta-container .carta-preview h2) {
    @apply text-xl font-bold mt-5 mb-3 first:mt-0;
  }

  :global(.carta-container .carta-preview h3) {
    @apply text-lg font-semibold mt-4 mb-2 first:mt-0;
  }

  :global(.carta-container .carta-preview h4,
          .carta-container .carta-preview h5,
          .carta-container .carta-preview h6) {
    @apply text-base font-semibold mt-3 mb-2 first:mt-0;
  }

  :global(.carta-container .carta-preview p) {
    @apply mb-4 last:mb-0;
  }

  :global(.carta-container .carta-preview ul,
          .carta-container .carta-preview ol) {
    @apply mb-4 ml-6 last:mb-0;
  }

  :global(.carta-container .carta-preview ul) {
    @apply list-disc;
  }

  :global(.carta-container .carta-preview ol) {
    @apply list-decimal;
  }

  :global(.carta-container .carta-preview li) {
    @apply mb-1;
  }

  :global(.carta-container .carta-preview blockquote) {
    @apply border-l-4 border-primary bg-base-200 pl-4 py-2 mb-4 italic last:mb-0;
  }

  :global(.carta-container .carta-preview code) {
    @apply bg-base-200 px-2 py-1 rounded text-sm font-mono;
  }

  :global(.carta-container .carta-preview pre) {
    @apply bg-base-200 p-4 rounded-lg mb-4 overflow-x-auto last:mb-0;
  }

  :global(.carta-container .carta-preview pre code) {
    @apply bg-transparent p-0;
  }

  :global(.carta-container .carta-preview a) {
    @apply link link-primary;
  }

  :global(.carta-container .carta-preview table) {
    @apply table table-zebra w-full mb-4 last:mb-0;
  }

  :global(.carta-container .carta-preview th) {
    @apply font-semibold;
  }

  :global(.carta-container .carta-preview hr) {
    @apply border-base-300 my-6;
  }

  /* Scrollbars */
  :global(.carta-container .carta-input::-webkit-scrollbar,
          .carta-container .carta-preview::-webkit-scrollbar) {
    width: 6px;
  }

  :global(.carta-container .carta-input::-webkit-scrollbar-track,
          .carta-container .carta-preview::-webkit-scrollbar-track) {
    @apply bg-base-200;
  }

  :global(.carta-container .carta-input::-webkit-scrollbar-thumb,
          .carta-container .carta-preview::-webkit-scrollbar-thumb) {
    @apply bg-base-300 rounded;
  }
</style>
