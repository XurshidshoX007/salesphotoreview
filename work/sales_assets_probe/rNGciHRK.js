const n=`<template>
  <div class="w-full flex items-center gap-4 flex-wrap">
    <m-btn
      @click="emit('toggleAll')"
      class="!bg-gray-200 !text-neutral-600 !border-gray-200 !h-10 !gap-2"
    >
      <icon-animated-expand-collapse
        :size="20"
        :state="props.isAllExpanded ? 'expanded' : 'collapsed'"
      />
      {{
        props.isAllExpanded ? t("access.collapse_all") : t("access.expand_all")
      }}
    </m-btn>

    <search-input no-debounce class="!h-10" @change="emit('search', $event)" />

    <div class="flex items-center gap-x-8 ml-auto text-sm">
      <template v-if="props.showStats">
        <span class="text-neutral-500">
          {{ t("access.selected") }}:
          <span class="font-semibold text-neutral-950">{{
            props.initialCount
          }}</span>
        </span>

        <div class="w-px h-5 bg-neutral-200" />

        <span v-if="props.addedCount" class="text-neutral-500">
          {{ t("access.adding") }}:
          <span class="font-semibold text-green-600">
            +{{ props.addedCount }}
          </span>
        </span>

        <span v-if="props.removedCount" class="text-neutral-500">
          {{ t("access.removing") }}:
          <span class="font-semibold text-red-600">
            -{{ props.removedCount }}
          </span>
        </span>
      </template>

      <checkbox
        :title="t('filters.choose_all')"
        :checked="props.checked"
        :indeterminate="props.indeterminate"
        @change="emit('change', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Checkbox } from "#components";
import { useI18n } from "vue-i18n";

// Props
const props = withDefaults(
  defineProps<{
    isAllExpanded: boolean;
    checked: boolean;
    indeterminate: boolean;
    showStats?: boolean;
    initialCount?: number;
    addedCount?: number;
    removedCount?: number;
  }>(),
  {
    showStats: false,
    initialCount: 0,
    addedCount: 0,
    removedCount: 0,
  },
);

// Emits
const emit = defineEmits<{
  (e: "toggleAll"): void;
  (e: "change", checked: boolean): void;
  (e: "search", value: string): void;
}>();

// Composables
const { t } = useI18n();
<\/script>
`;export{n as default};
