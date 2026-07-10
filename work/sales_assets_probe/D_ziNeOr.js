const t=`<template>
  <multi-tab
    :tabs="tabs"
    :active="modelValue"
    :classes="{ contentWrapper: 'hidden' }"
    @update:active="$emit('update:modelValue', $event)"
  >
    <template #header-wrapper="{ tabsList }">
      <card
        size="compact-y"
        :classes="{ root: 'col-span-full', header: 'mb-4' }"
      >
        <page-title size="xl" weight="500" title="Icon Catalog" class="mb-3" />
        <component :is="tabsList" class="w-fit" />
      </card>
    </template>
  </multi-tab>
</template>

<script setup lang="ts">
// Props
defineProps<{
  tabs: MultiTabProps["tabs"];
  modelValue: string;
}>();

// Emits
defineEmits<{
  "update:modelValue": [value: string];
}>();
<\/script>
`;export{t as default};
