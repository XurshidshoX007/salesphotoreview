const n=`<template>
  <d-modal
    data-container-width="1700px"
    :name="t('invoices.details')"
    @close-dialog="closeDialog"
  >
    <div class="dialog-content space-y-5">
      <access-history-filter
        :id="grantAccessSerialId"
        :extra-filters="extraFilters"
      />
      <access-history-data-table :id="grantAccessSerialId" />
    </div>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { FilterParams } from "~/interfaces/api/params/list-parameters";

// Tyoes
type Props = {
  grantAccessSerialId: string;
};

type Emits = {
  (e: "closeDialog"): void;
};

// Props
const props = defineProps<Props>();

// Emits
const emit = defineEmits<Emits>();

// Composables
const { t } = useI18n();

// Stores
const historyStore = useAccessHistoryStore(props.grantAccessSerialId);
const filtersStore = useFiltersStore(
  \`access/history/\${props.grantAccessSerialId}\`,
);

// Variables
const extraFilters: FilterParams[] = [
  { field: "grant_access_serial_id", value: [props.grantAccessSerialId] },
];

// Methods
const closeDialog = () => emit("closeDialog");

// Hooks
onUnmounted(() => {
  filtersStore.$reset();
  filtersStore.$dispose();
  historyStore.$dispose();
});
<\/script>

<style scoped lang="scss">
.dialog-content :deep(.filter-content-container) {
  padding: 0 !important;
}
</style>
`;export{n as default};
