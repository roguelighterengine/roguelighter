<script module>
  interface Props {
    button?: import('svelte').Snippet;
    items?: import('svelte').Snippet;
  }
</script>

<script lang="ts">
  import { createMenu } from 'svelte-headlessui';
  import Transition from 'svelte-transition';

  let { button, items }: Props = $props();
  const dropdown = createMenu({ label: 'Actions' });
</script>

<div class="relative inline-block text-left">
  <button use:dropdown.button class="btn-ghost flex items-center justify-center">
    {#if button}{@render button()}{:else}<!-- optional fallback -->{/if}
  </button>

  <Transition
    show={$dropdown.expanded}
    enter="transition ease-out duration-100"
    enterFrom="transform opacity-0 scale-95"
    enterTo="transform opacity-100 scale-100"
    leave="transition ease-in duration-75"
    leaveFrom="transform opacity-100 scale-100"
    leaveTo="transform opacity-0 scale-95"
  >
    <div
      use:dropdown.items
      class="absolute right-0 mt-2 z-20 w-64 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
    >
      {#if items}{@render items()}{:else}<!-- optional fallback -->{/if}
    </div>
  </Transition>
</div>
