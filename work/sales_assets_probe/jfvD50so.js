const n=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <flex-row class="table-content-btn-group">
          <table-sort-columns
            :save-key="autoBonusHeader"
            :templates="bonusStore.autoTemplate"
            @onChangeTableHeaders="change"
          />
          <ShowHideColumn
            :headers="bonusStore.autoTemplate"
            :save-key="autoBonusHeader"
          />
          <page-size-btn
            :current-size="bonusStore.params.page_size"
            :total-count="bonusStore.data?.total_count"
            :page-number="bonusStore.data?.page_number"
            @setPageSize="bonusStore.setPageSize"
          />
          <search-input
            @change="bonusStore.search"
            :value="bonusStore.params.search"
          />
          <excel-btn
            @click="bonusStore.onDownloadExcelFile"
            :loading="bonusStore.isExcelFileDownloading"
          />
          <RefreshBtn @click="refresh" :loading="bonusStore.isAutoLoading" />
        </flex-row>
        <div class="filter-content-container w-full">
          <div class="filter-content">
            <dropdowns-by-filter-states
              :filter-states="filterTypeFilterStates"
              @onOpenDropdown="onOpenDropDown"
            />
          </div>
        </div>
      </div>
      <div class="table-content-body">
        <data-table
          :headers="bonusStore.autoTemplate"
          :loading="bonusStore.isAutoLoading"
          :isEmpty="!bonusStore.data?.items?.length"
          :sorted="bonusStore.params.order_by"
          :check="isTableAllChecked"
          :indeterminate="isTableIndeterminate"
          @sort="bonusStore.sortData"
          @getAllId="getAllIds"
        >
          <template #body>
            <c-tr v-for="data in bonusStore.data?.items" :key="data">
              <c-td-no-edit
                v-for="key in bonusStore.autoTemplate"
                :key="key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.key === 'checkbox'">
                  <Checkbox
                    :id="data.id"
                    :checked="isTableChecked(data.id)"
                    @change="onSelectItem(data.id)"
                  />
                </div>
                <div v-else-if="key.key === 'can_has_dependent_bonuses'">
                  <rounded-icon-btn
                    v-if="data?.can_has_dependent_bonuses"
                    icon="plus"
                    type="outlined"
                    :tooltip="t('settings.connect_bonus')"
                    @click="attachDependentBonusId = data.id"
                  />
                  <div v-else>Недоступно</div>
                  <div v-if="data?.dependent_bonus_arr?.length">
                    <div
                      v-for="(
                        dependentBonus, index
                      ) in data?.dependent_bonus_arr"
                      :key="dependentBonus.id"
                      class="underline cursor-pointer hover:text-[#299B9B]"
                      @click="detailId = dependentBonus.id"
                    >
                      {{ ++index }}) {{ dependentBonus?.name }}
                    </div>
                  </div>
                </div>
                <div v-else-if="key.key === 'bonus_type'">
                  {{ data?.bonus_type?.name }}
                </div>
                <div v-else-if="key.key === 'bonus_category_name'">
                  {{ data?.bonus_category?.name }}
                </div>
                <div v-else-if="key.type === 'date'">
                  {{ getFormattedDate(data[key.key], "DD.MM.YYYY HH:mm") }}
                </div>
                <link-component
                  v-else-if="key.key === 'name'"
                  :value="data[key.key]"
                  @click="detailId = data.id"
                />
                <div
                  v-else-if="key.key === 'action'"
                  class="flex items-center gap-x-3"
                >
                  <rounded-icon-btn
                    icon="copy"
                    type="outlined"
                    icon-size="15"
                    :tooltip="t('settings.copy_bonus')"
                    @click="copyBonus(data.id)"
                  />
                  <rounded-icon-btn
                    type="info"
                    icon-file-name="UserAdd"
                    :tooltip="t('settings.attach')"
                    @click="bonusDiscountModal = data?.id"
                  />
                  <rounded-icon-btn type="edit" :iconSize="20" @click="edit(data.id)" />
                </div>
                <div v-else-if="key.key === 'bonus_state'">
                  <StatusBtnForTable
                    :status-data="getStatusDataByName(data?.bonus_state?.id)"
                    :data-id="data?.id"
                    readonly
                  />
                </div>
                <div v-else-if="key.key === 'is_auto'">
                  <StatusBtnForTable
                    :status-data="getBonusAuto(data[key.key])"
                    :data-id="data?.id"
                    readonly
                  />
                </div>
                <div v-else-if="key.type === 'boolean'">
                  {{ data[key.key] ? t("filters.yes") : t("filters.no") }}
                </div>
                <div v-else>
                  {{ data[key.key] }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div class="table-content-footer">
        <curren-page-btn
          :current-size="bonusStore.params.page_size"
          :total-count="bonusStore.data?.total_count"
          :page-number="bonusStore.data?.page_number"
        />
        <page-index
          :available-pages="bonusStore.data?.total_pages"
          :current-page="bonusStore.data?.page_number"
          @setPage="bonusStore.setPage"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="bonusDiscountModal">
        <SettingsBonusesDiscountsDialogBody
          :bonus-id="bonusDiscountModal"
          @onCloseDialog="discountBonusesDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="detailId">
        <SettingsBonusesDiscountsBonusDetail
          :id="detailId"
          @on-close-dialog="closeBonusDetailDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="attachDependentBonusId">
        <SettingsBonusesDiscountsAttachBonusDialog
          :id="attachDependentBonusId"
          @closeDialog="attachDependentBonusId = ''"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { AppResponse } from "~/interfaces/api/response/app-response";
import type { ConstantModel } from "~/interfaces/api/constants/library-constants-model";
import type { BonusesModel } from "~/interfaces/api/settings/bonuses-discounts-models";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { autoBonusHeader } from "~/variable/column-constants";
import type { LimitTypeModel } from "~/interfaces/api/constants/limit-type-model";
import { BonusTypes } from "~/variable/static-constants";

// props
const props = defineProps({
  isActive: {
    type: Boolean,
    required: true,
  },
});

// emits
const emit = defineEmits(["onSelectItems"]);

// Stores
const { isActive } = toRefs(props);
const bonusStore = useBonusesStore(isActive.value.toString());

// State
const { t } = useI18n();
const eventBus = useEventBus();
const router = useRouter();
const detailId = ref<string | null>(null);
const bonusDiscountModal = ref<string | undefined>("");
const attachDependentBonusId = ref<string | undefined>("");
const selectedIds = ref<string[]>([]);
const bonusStatus = ref([]);
const setBonusState = ref<number>(0);
const setBonusFilterTypeState = ref<number[]>([]);
const updateListEventKey = SettingsEventKeys.BONUSES_TABLE_UPDATE;
const bonusTypes = ref<LimitTypeModel[]>();

const filterTypes = ref<Partial<AppResponse<ConstantModel>>>({
  items: undefined,
});

const filterTypeFilterStates = ref([
  {
    name: t("column.method"),
    key: "bonus-type",
    isSingleSelect: true,
    get data() {
      return bonusStore.bonusTypeState || [];
    },
    get getSelectedData() {
      return setBonusState.value;
    },
    set setSelectedData(value: number) {
      setBonusState.value = value;
      setBonusType(value);
    },
  },
  {
    name: t("column.term"),
    key: "filterTypes",
    isSingleSelect: true,
    get data() {
      return filterTypes.value || [];
    },
    get getSelectedData() {
      return bonusStore.params.filter_type;
    },
    set setSelectedData(value: number) {
      bonusStore.params.filter_type = value;
      bonusStore.params.page = 1;
    },
  },
  {
    name: t("column.bonus_type"),
    key: "bonus-types",
    get data() {
      return filteredBonusTypes.value || [];
    },
    get getSelectedData() {
      return setBonusFilterTypeState.value;
    },
    set setSelectedData(value: number[]) {
      setBonusFilterTypeState.value = value;
      setBonusFilterType(value);
    },
  },
]);

// Hooks
eventBus.on(updateListEventKey, async (updatedIsActive) => {
  if (updatedIsActive === isActive.value) {
    await getData();
  }
});

const isTableAllChecked = computed(() => {
  if (!bonusStore.data?.items.length) return false;
  return bonusStore.data?.items.every((item) =>
    selectedIds.value.includes(item.id),
  );
});

const isTableIndeterminate = computed(() => {
  if (isTableAllChecked.value || !bonusStore.data?.items.length) return false;
  return bonusStore.data?.items.some((item) =>
    selectedIds.value.includes(item.id),
  );
});

onMounted(async () => {
  await getData();
  await getFilterTypes();
  if (bonusStatus.value?.length === 0) {
    bonusStatus.value = await bonusStore.getStatuses();
  }
});

const filteredBonusTypes = computed(
  (): Partial<AppResponse<LimitTypeModel>> | undefined => {
    const filteredData = bonusTypes.value?.filter(
      (item) =>
        item.id === BonusTypes.QUANTITY || item.id === BonusTypes.AMOUNT,
    );
    return { items: filteredData };
  },
);

// Methods
const onOpenDropDown = async (state: string, value: unknown) => {
  if (state === "bonus-types" && !bonusTypes.value?.length) {
    await getBonusTypes();
  }
};

const setBonusType = (bonus_type: number) => {
  const isAutoValue = bonus_type === 0 ? null : (bonus_type === 1).toString();

  bonusStore.params.filter[1] = {
    field: "is_auto",
    value: [isAutoValue],
  };
  bonusStore.params.page = 1;
};

const setBonusFilterType = (bonus_type: number[]) => {
  bonusStore.params.filter[2] = {
    field: "bonus_type",
    value: bonus_type.map(String),
  };
  bonusStore.params.page = 1;
};

const getData = async () => {
  await bonusStore.getDataAuto(isActive.value.toString());
};

const getAllIds = (checked: boolean) => {
  if (checked) {
    selectedIds.value =
      bonusStore.data?.items.map((item: BonusesModel) => item.id) || [];
  } else {
    setNullSelectedIds();
  }
  emit("onSelectItems", selectedIds.value);
};

const isTableChecked = (checkingId: string) => {
  return !!selectedIds.value.find((id: string) => checkingId === id);
};

const onSelectItem = (selectingId: string) => {
  if (!isTableChecked(selectingId)) {
    selectedIds.value.push(selectingId);
  } else {
    selectedIds.value = selectedIds.value.filter(
      (id: string) => id !== selectingId,
    );
  }
  emit("onSelectItems", selectedIds.value);
};

const setNullSelectedIds = () => {
  selectedIds.value = [];
};

function discountBonusesDialog() {
  bonusDiscountModal.value = "";
}

function change(param: any) {
  bonusStore.autoTemplate = param;
}

function edit(id: string) {
  router.push({
    path: "/settings/bonuses-discounts/create-bonus",
    query: { id: id },
  });
}

function copyBonus(id: string) {
  router.push({
    path: "/settings/bonuses-discounts/create-bonus",
    query: { id: id, copy: "bonus" },
  });
}

const getFilterTypes = async () => {
  filterTypes.value.items = await bonusStore.getFilterTypes();
};

const refresh = () => {
  bonusStore.refresh();
};

const getStatusDataByName = (id: number): ConstantModel | undefined => {
  return bonusStatus.value?.find((status: ConstantModel) => status.id === id);
};

const getBonusTypes = async () => {
  const data = await bonusStore.getBonusesTypes();
  bonusTypes.value = data;
};

const getBonusAuto = (is_auto: boolean) => {
  if (is_auto) {
    return {
      id: 1,
      hex_color: "#0B8C18",
      name: t("settings.auto_bonus"),
    };
  }
  return {
    id: 2,
    hex_color: "#D48C1E",
    name: t("settings.manual_bonus"),
  };
};

const closeBonusDetailDialog = () => {
  detailId.value = null;
};
<\/script>

<style lang="scss" scoped>
.filter-content-container {
  padding: 0 !important;
  border: none !important;
}
</style>
`;export{n as default};
