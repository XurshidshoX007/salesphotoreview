const n=`<template>
  <div
    class="font-medium text-neutral-950 flex items-center gap-2.5 text-right min-w-0 overflow-hidden"
  >
    <span class="truncate block w-full">{{ person?.name || "-" }}</span>
    <div class="size-8 rounded-full shrink-0 text-neutral-300">
      <img
        v-if="person?.photo_url"
        :src="person?.photo_url"
        class="w-full h-full object-cover rounded-full"
      />
      <icon-avatar v-else :size="32" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Types
type Props = {
  person?: BasicEntity & {
    photo_url?: string;
  };
};

// Props
defineProps<Props>();
<\/script>
`;export{n as default};
