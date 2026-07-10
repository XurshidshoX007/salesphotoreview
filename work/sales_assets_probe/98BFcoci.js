const e=`<template>
  <optimized-data-table
    v-if="!!items.length"
    sticky-header
    with-information-above-header
    :loading="isLoading"
    :data="filteredItems || []"
    :columns="columns"
    :overscan="10"
    row-class="border-b border-[var(--primary-border)]"
  />
  <skeleton-block v-else-if="isLoading && !items.length" height="250px" />
  <div v-else class="grid place-items-center p-8">
    <icon-user-key :size="96" />
    <page-title
      size="lg"
      weight="600"
      class="w-60 text-center !text-neutral-600"
      :title="t('access.no_permissions_granted')"
    />
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from "@tanstack/vue-table";
import { useI18n } from "vue-i18n";

// Props
const props = withDefaults(
  defineProps<{
    items: any[];
    headers: Template[];
    checkedIds: (string | number)[];
    isLoading?: boolean;
    searchValue?: string;
    searchFields?: (item: any, search: string) => boolean;
  }>(),
  {
    searchValue: "",
  },
);

// Slots
const slots = useSlots();

// Composables
const { t } = useI18n();

// Computed
const activeHeaders = computed(() =>
  props.headers.filter((h) => h.checked !== false),
);

const normalizedSearchValue = computed(
  () => props.searchValue?.toLowerCase().trim() || "",
);

const filteredItems = computed(() => {
  if (!normalizedSearchValue.value || !props.searchFields) {
    return props.items || [];
  }

  return (props.items || []).filter((item) =>
    props.searchFields!(item, normalizedSearchValue.value),
  );
});

// TanStack ColumnDef[] built from Template[] headers
const columns = computed<ColumnDef<any>[]>(() => {
  return activeHeaders.value.map((header) => {
    const headerRenderFn = slots[\`header-\${header.key}\`];
    const cellRenderFn = slots[\`cell-\${header.key}\`];

    return {
      id: header.key,
      accessorKey: header.key,
      enableSorting: false,
      ...(header.thWidth
        ? { size: header.thWidth, maxSize: header.thWidth, grow: false }
        : {}),
      ...(header.right ? { right: true } : {}),
      header: headerRenderFn ? () => headerRenderFn() : header.name || "",
      ...(cellRenderFn
        ? {
            cell: ({ row }) => cellRenderFn({ item: row.original }),
          }
        : {}),
    };
  });
});
<\/script>
`;export{e as default};
