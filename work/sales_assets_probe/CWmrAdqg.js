const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header justify-between">
      <flex-row class="items-center gap-3">
        <table-sort-columns
          :templates="templates"
          :save-key="discountHeader"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn :headers="templates" :save-key="discountHeader" />
        <page-size-btn
          :current-size="params.page_size"
          :total-count="data?.total_count"
          :page-number="data?.page_number"
          @setPageSize="setPageSize"
        />
        <search-input :value="params.search" @change="search" />
        <excel-btn
          :loading="isExcelFileDownloading"
          @click="onDownloadExcelFile"
        />
        <RefreshBtn :loading="isLoading" @click="refresh" />
      </flex-row>
      <m-btn
        :disabled="noneChecked"
        group="orange"
        @click="openChangeExpirationDialog"
        class="justify-self-end"
      >
        {{ t("labels.change_term") }}
      </m-btn>
    </div>
    <div class="table-content-body">
      <data-table
        :headers="templates"
        :loading="isLoading"
        :sorted="params.order_by"
        :is-empty="!data?.items?.length"
        :indeterminate="isAnyChecked"
        :check="isAllChecked"
        @sort="sortData"
        @get-all-id="onCheckAll"
      >
        <template #body>
          <c-tr v-for="item in data?.items" :key="item.id">
            <c-td-no-edit v-for="key in templates" :key="key.key">
              <template v-if="key.key === 'checkbox'">
                <Checkbox
                  :id="item.id"
                  :checked="isItemChecked(item.id)"
                  @change="onCheckItem(item.id, $event)"
                />
              </template>
              <show-more
                v-else-if="
                  key.type === 'array' && !isSpecialArrayField(key.key)
                "
                :data="getArrayValue(item, key.key)"
              />
              <template v-else-if="key.key === 'action'">
                <flex-row class="items-center gap-2">
                  <RoundedIconBtn type="edit" :iconSize="20" @click="onEdit(item.id)" />
                  <rounded-icon-btn
                    :icon="!item.is_active ? 'check' : 'not-active'"
                    :type="item.is_active ? 'danger' : 'checked'"
                    :tooltip="
                      !item.is_active
                        ? t('warehouse.activate')
                        : t('warehouse.deactivated')
                    "
                    @click="onChangeActivity(item.id, item.is_active)"
                  />
                  <RoundedIconBtn type="danger" @click="remove(item.id)" />
                </flex-row>
              </template>
              <template v-else>
                {{ formatValue(item, key) }}
              </template>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="params.page_size"
        :total-count="data?.total_count"
        :page-number="data?.page_number"
      />
      <page-index
        :available-pages="data?.total_pages"
        :current-page="data?.page_number"
        @setPage="setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingManualId">
      <SettingsDiscountCreateManualDiscountDialog
        :id="editingManualId"
        @closeDialog="closeManualDialog"
        @clear-fetched-tab="onClearFetchedTab"
      />
    </div>
  </transition>

  <transition name="modal">
    <div v-if="isChangeExpirationDialogOpen">
      <SettingsDiscountProlongDialog
        :prolong="prolong"
        @closeDialog="closeChangeExpirationDialog"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import {
  getDataValue,
  onAddFieldToFilter,
  type DiscountListModel,
} from "#imports";
import { discountHeader } from "~/variable/column-constants";
import { useI18n } from "vue-i18n";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { useEventBus } from "~/composables/EventBus/eventBus";

// props
const props = defineProps<{ type: "auto" | "manual"; isActive: boolean }>();
const { isActive, type } = toRefs(props);

// emits
const emit = defineEmits<{
  (
    e: "clearFetchedTab",
    payload: { isActive: boolean; type: "auto" | "manual" }
  ): void;
}>();

// store
const discountStore = useDiscountStore(
  isActive.value.toString() + type.value.toString()
);

const { templates, data, isLoading, params, isExcelFileDownloading } =
  storeToRefs(discountStore);
const {
  search,
  setPage,
  setPageSize,
  refresh,
  sortData,
  onDownloadExcelFile,
  getDiscountAudience,
  getDiscountReprovidingTypes,
  getDiscountTypes,
  activate,
  deactivate,
  remove,
  prolong,
} = discountStore;

// states
const { t } = useI18n();
const eventBus = useEventBus();
const discountTypes = ref<ConstantModel[]>([]);
const discountAudiences = ref<ConstantModel[]>([]);
const discountReprovidingTypes = ref<ConstantModel[]>([]);
const editingManualId = ref<string | null>(null);
const isChangeExpirationDialogOpen = ref(false);
const updateEventKey: string = SettingsEventKeys.DISCOUNT_TABLE_UPDATE;
const checkedItemIds = ref<string[]>([]);

// hooks
eventBus.on(updateEventKey, async () => {
  // should refresh only on manual table and current type is manual
  if (props.type === "manual") {
    await refresh();
  }
});

const lookupMaps = computed(() => ({
  type: new Map(discountTypes.value.map((i) => [String(i.id), i.name])),
  discount_audience: new Map(
    discountAudiences.value.map((i) => [String(i.id), i.name])
  ),
  discount_reproviding_type: new Map(
    discountReprovidingTypes.value.map((i) => [String(i.id), i.name])
  ),
}));

const isAllChecked = computed(() => {
  if (!data.value?.items?.length) {
    return false;
  }

  return data.value.items.every((item) =>
    checkedItemIds.value.includes(item.id)
  );
});

const isAnyChecked = computed(() => {
  if (!data.value?.items?.length) {
    return false;
  }
  if (isAllChecked.value) {
    return false;
  }
  return data.value.items.some((item) =>
    checkedItemIds.value.includes(item.id)
  );
});

const noneChecked = computed(() => {
  return checkedItemIds.value.length === 0;
});

onMounted(async () => {
  onAddFieldToFilter(params.value, "is_auto", [
    (props.type === "auto").toString(),
  ]);
  onAddFieldToFilter(params.value, "is_active", [props.isActive.toString()]);
  await loadInitialData();
});

// methods
const onCheckAll = (checked: boolean) => {
  if (checked) {
    checkedItemIds.value = data.value?.items?.map((item) => item.id) || [];
  } else {
    checkedItemIds.value = [];
  }
};

const isItemChecked = (id: string) => {
  return checkedItemIds.value.includes(id);
};

const onCheckItem = (id: string, checked: boolean) => {
  if (checked) {
    if (!checkedItemIds.value.includes(id)) {
      checkedItemIds.value.push(id);
    }
  } else {
    checkedItemIds.value = checkedItemIds.value.filter(
      (itemId) => itemId !== id
    );
  }
};

const loadInitialData = async () => {
  const [types, audiences, reproviding] = await Promise.all([
    getDiscountTypes(),
    getDiscountAudience(),
    getDiscountReprovidingTypes(),
  ]);
  discountTypes.value = types || [];
  discountAudiences.value = audiences || [];
  discountReprovidingTypes.value = reproviding || [];
};

const onChangeTableHeaders = (param: Template[]) => (templates.value = param);

const isSpecialArrayField = (key: string) => {
  return key === "rebates" || key === "term_min_arr";
};

const formatValue = (item: DiscountListModel, key: Template) => {
  const value = getValue(item, key.key, key.type);

  if (key.key === "rebates" && Array.isArray(value)) {
    return value.map((v) => \`\${v}%\`).join(", ");
  }

  if (key.key === "term_min_arr" && Array.isArray(value)) {
    return value.join(", ");
  }

  return value;
};

const getValue = (item: DiscountListModel, key: string, type?: string) => {
  if (type === "boolean") {
    return item[key as keyof DiscountListModel]
      ? t("filters.yes")
      : t("filters.no");
  }

  const map = lookupMaps.value[key as keyof typeof lookupMaps.value];
  if (map) {
    return map.get(String(item[key as keyof DiscountListModel])) || "";
  }

  return getDataValue(item, key, type);
};

const getArrayValue = (item: DiscountListModel, key: string): string[] => {
  const value = getValue(item, key);
  return Array.isArray(value) ? value.map(String) : [];
};

const onEdit = (id: string) => {
  if (props.type === "manual") {
    editingManualId.value = id;
    return;
  }

  navigateTo({
    path: "/settings/discount/create",
    query: { id },
  });
};

const closeManualDialog = () => {
  editingManualId.value = null;
};

const openChangeExpirationDialog = () => {
  if (noneChecked.value) return;
  isChangeExpirationDialogOpen.value = true;
};

const closeChangeExpirationDialog = () => {
  isChangeExpirationDialogOpen.value = false;
};

const onChangeActivity = async (id: string, isActive: boolean) => {
  if (isActive) {
    await deactivate(id);
  } else {
    await activate(id);
  }

  await refresh();
  onClearFetchedTab();
};

const onClearFetchedTab = () => {
  emit("clearFetchedTab", {
    isActive: props.isActive,
    type: props.type,
  });
};
<\/script>
`;export{e as default};
