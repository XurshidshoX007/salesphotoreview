const e=`<template>
  <card variant="outlined" :classes="{ content: 'flex items-center gap-4' }">
    <search-input
      :model-value="searchQuery"
      has-placeholder
      no-debounce
      @update:model-value="$emit('update:searchQuery', $event)"
    />

    <checkbox
      :checked="showOnlyDiff"
      title="Только различия"
      @change="$emit('update:showOnlyDiff', $event)"
    />

    <div id="localization-tabs-target" class="ml-auto" />
  </card>
</template>

<script setup lang="ts">
defineProps<{
  searchQuery: string;
  showOnlyDiff: boolean;
}>();

defineEmits<{
  (e: "update:searchQuery", value: string): void;
  (e: "update:showOnlyDiff", value: boolean): void;
}>();
<\/script>
`;export{e as default};
