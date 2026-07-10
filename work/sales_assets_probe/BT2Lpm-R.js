const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="cashHeader"
        :templates="cashboxesStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="cashboxesStore.templates"
        :save-key="cashHeader"
        :disabled-headers="nonToggleableRows"
      />
      <page-size-btn
        :current-size="cashboxesStore.params.page_size"
        :total-count="cashboxesStore.data?.total_count"
        :page-number="cashboxesStore.data?.page_number"
        @setPageSize="cashboxesStore.setPageSize"
      />
      <search-input
        @change="cashboxesStore.search"
        :value="cashboxesStore.params.search"
      />
      <excel-btn
        @click="cashboxesStore.onDownloadExcelFile"
        :loading="cashboxesStore.isExcelFileDownloading"
      />
      <RefreshBtn
        @click="cashboxesStore.refresh"
        :loading="cashboxesStore.isLoading"
      />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="cashboxesStore.templates"
        :loading="cashboxesStore.isLoading"
        :is-empty="!cashboxesStore.data?.items?.length"
        :sorted="cashboxesStore.params.order_by"
        @sort="cashboxesStore.sortData"
      >
        <template #body>
          <template v-for="data in cashboxesStore.data?.items" :key="data.id">
            <c-tr>
              <c-td-no-edit
                v-for="key in cashboxesStore.templates"
                :is-checked="key.checked"
                :key="key.key"
                :type="key.type"
              >
                <div v-if="key.key === 'all_dates_closed'">
                  <rounded-icon-btn
                    icon="list"
                    :type="data.all_dates_closed ? 'checked' : 'danger'"
                    :tooltip="
                      data.all_dates_closed
                        ? t('cash.daily_state_of_closed_cash')
                        : t('cash.daily_state_of_not_closed_cash')
                    "
                    @click="openDailyStateDialog(data.id)"
                  />
                </div>
                <div v-else-if="key.type === 'date'">
                  {{ getFormattedDate(data[key.key]) }}
                </div>
                <div v-else-if="key.key === 'action'">
                  <rounded-icon-btn
                    v-if="allowToUpdate"
                    type="edit"
                    :iconSize="20"
                    :tooltip="t('edit')"
                    @click="openEditDialog(data.id)"
                  />
                </div>
                <div v-else-if="key.key === 'employee_count_by_roles'">
                  <ShowMore
                    :data="countByRolesData[data.id || '']"
                    :show-count="2"
                  />
                </div>
                <div v-else-if="key.key === 'location' && data[key.key]">
                  <rounded-icon-btn
                    icon-file-name="Location"
                    type="outlined"
                    @click="locationData = data[key.key]"
                  />
                </div>
                <div v-else-if="key.type === 'number'">
                  {{ getFormattedAmount(data[key.key]) }}
                </div>
                <div v-else>
                  {{ data[key.key] }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="cashboxesStore.params.page_size"
        :total-count="cashboxesStore?.data?.total_count"
        :page-number="cashboxesStore?.data?.page_number"
      />
      <page-index
        :available-pages="cashboxesStore.data?.total_pages"
        :current-page="cashboxesStore.data?.page_number"
        @setPage="cashboxesStore.setPage"
      />
    </div>
    <transition name="modal">
      <div v-if="editingId">
        <DashboardCashboxCashboxesDialog
          :id="editingId"
          :allow-to-save="allowToUpdate"
          @close-dialog="editingId = ''"
          @clear-fetched-tab="clearFetchedTab"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="locationData">
        <lazy-clients-equipment-location
          :location="locationData"
          @closeDialog="locationData = null"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="dailyStateId">
        <DashboardCashboxCashboxesDailyStateDialog
          :id="dailyStateId"
          @refresh="refresh"
          @close-dialog="dailyStateId = ''"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { getFormattedDate } from "~/utils/formatters";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { CashboxEventKeys } from "~/variable/event-key-constants";
import { cashHeader } from "~/variable/column-constants";
import type { Template } from "~/interfaces/ui/template";
import { useI18n } from "vue-i18n";
import { getFormattedAmount } from "#imports";

// props
const props = defineProps({
  allowToUpdate: Boolean,
  isActive: Boolean,
});

// emits
const emit = defineEmits(["clearFetchedTab"]);

// store
const { isActive } = toRefs(props);
const cashboxesStore = useCashboxesStore(isActive.value.toString());

// state
const { t } = useI18n();
const eventBus = useEventBus();
const editingId = ref<string>("");
const dailyStateId = ref<string>("");
const updateListEventKey = CashboxEventKeys.CASHBOX_TABLE_UPDATE;
const locationData = ref<{ latitude: number; longitude: number } | null>(null);
const nonToggleableRows = ref<string[]>(["all_dates_closed"]);

// hooks
eventBus.on(updateListEventKey, async (updatedIsActive) => {
  if (updatedIsActive === isActive.value) {
    await getData();
  }
});

const countByRolesData = computed(() => {
  return (
    cashboxesStore.data?.items?.reduce(
      (acc: Record<string, string[]>, item) => {
        if (!acc[item.id!]) {
          acc[item.id!] = [];
        }
        item.employee_count_by_roles?.forEach((roleItem) => {
          acc[item.id!].push(\`\${roleItem.role.name} - (\${roleItem.count})\`);
        });
        return acc;
      },
      {} as Record<string, string[]>,
    ) || {}
  );
});

onMounted(async () => await getData());

// methods
const onChangeTableHeaders = (param: Template[]) => {
  cashboxesStore.templates = param;
};

const getData = async () => {
  await cashboxesStore.getData(isActive.value.toString());
};

const clearFetchedTab = (isActive: boolean) => {
  emit("clearFetchedTab", isActive);
};

const openEditDialog = (id?: string) => {
  if (!id) return;
  editingId.value = id;
};

const openDailyStateDialog = (id?: string) => {
  if (!id) return;
  dailyStateId.value = id;
};

const refresh = async () => {
  await getData();
};
<\/script>
`;export{e as default};
