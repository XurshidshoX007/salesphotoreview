const n=`<template>
  <card size="compact-y" :classes="{ root: 'w-[220px] shrink-0 sticky top-4' }">
    <multi-tab
      :tabs="typeTabs"
      :active="activeType"
      :classes="{
        contentWrapper: 'hidden',
        list: 'mb-3',
        tab: 'w-full justify-center',
      }"
      @update:active="$emit('update:activeType', $event)"
    />

    <div class="flex flex-col gap-0.5">
      <button
        v-for="cat in categories"
        :key="cat.name"
        class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors text-left"
        :class="
          selectedCategory === cat.name
            ? 'bg-primary-50 text-primary-700 font-medium'
            : 'text-neutral-600 hover:bg-neutral-50'
        "
        @click="$emit('update:selectedCategory', cat.name)"
      >
        <span class="truncate">{{ cat.name }}</span>
        <span
          class="text-xs tabular-nums"
          :class="
            selectedCategory === cat.name
              ? 'text-primary-500'
              : 'text-neutral-400'
          "
        >
          {{ cat.count }}
        </span>
      </button>
    </div>
  </card>
</template>

<script setup lang="ts">
// Types
type CategoryCountType = {
  name: string;
  count: number;
};

type Props = {
  typeTabs: MultiTabProps["tabs"];
  activeType: string;
  categories: CategoryCountType[];
  selectedCategory: string;
};

// Props
defineProps<Props>();

// Emits
defineEmits<{
  "update:activeType": [value: string];
  "update:selectedCategory": [value: string];
}>();
<\/script>
`;export{n as default};
