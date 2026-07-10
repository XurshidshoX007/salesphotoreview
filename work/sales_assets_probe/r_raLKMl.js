const n=`<template>
  <form id="app" class="w-full" @submit.prevent="save">
    <d-modal
      :name="props.id ? t('edit') : t('clients.add')"
      :loading="isLoading"
      @closeDialog="closeDialog"
    >
      <flex-col class="gap-5">
        <shared-localized-input
          required
          :label="t('column.name')"
          v-model:base="data.default_name"
          v-model:translations="data.name_l10n"
        />
        <DropdownsByFilterStates
          ref="DropdownComponent"
          :filterStates="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <d-input
          type="text"
          pattern-type="code"
          :label="t('column.code')"
          :value="data.code"
          @change="data.code = $event"
        />
        <d-input
          type="number"
          pattern-type="sort"
          :label="t('labels.sort')"
          :value="data.sort"
          @change="data.sort = $event"
        />
        <shared-localized-input
          :label="t('column.comment')"
          v-model:base="data.default_description"
          v-model:translations="data.description_l10n"
        />
        <Switch :active="data.is_active" @change="data.is_active = $event" />
      </flex-col>
      <template #footer>
        <m-btn :loading="isBtnLoading" class="w-full" type="submit">
          {{ !props.id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import type { DropdownsByFilterStates } from "#components";
import { useI18n } from "vue-i18n";
import { useKpiProductGroupStore } from "~/stores/settings/kpi-product-group/kpi-product-group.store";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { ProductsModel } from "~/interfaces/api/settings/products-model";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import { defaultDropdownParams, dropdownParamsAll } from "~/variable/params";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import type { KpiProductGroupSaveModel } from "~/interfaces/api/settings/kpi-product-group-model";
import type { AgentModel } from "~/interfaces/api/users/agent/agent-model";

// Store
const kpiProductGroupStore = useKpiProductGroupStore("main");

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// State
const { t } = useI18n();
const eventBus = useEventBus();
const isLoading = ref(false);
const isBtnLoading = ref(false);
const updateListEventKey = SettingsEventKeys.KPI_PRODUCT_GROUP_TABLE_UPDATE;
const products = ref<DropdownItemsModelByType<ProductsModel>>();
const agents = ref<DropdownItemsModelByType<AgentModel>>();
const dropdownParams = ref(
  props.id ? { ...dropdownParamsAll } : { ...defaultDropdownParams },
);

const productsParams = ref<defaultDropdownParamsType>(dropdownParams.value);
const agentsParams = ref<defaultDropdownParamsType>(dropdownParams.value);

const data = ref<Partial<KpiProductGroupSaveModel>>({
  id: undefined,
  code: null,
  name: "",
  default_name: "",
  name_l10n: {},
  sort: null,
  description: null,
  default_description: "",
  description_l10n: {},
  is_active: true,
  product_id_arr: [],
  agent_id_arr: [],
});
const initialDetailData = ref(); // used to store the detail data on edit

let filterStates = ref([
  {
    name: t("settings_sidebar.products"),
    key: "products",
    get data() {
      return products.value || [];
    },
    get getSelectedData() {
      return data.value.product_id_arr;
    },
    set setSelectedData(value: string[]) {
      data.value.product_id_arr = value;
    },
    required: true,
  },
  {
    name: t("dashboard.agents"),
    key: "agents",
    get data() {
      return agents.value || [];
    },
    get getSelectedData() {
      return data.value.agent_id_arr;
    },
    set setSelectedData(value: string[]) {
      data.value.agent_id_arr = value;
    },
  },
]);

// Hooks
const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
});

onBeforeMount(async () => {
  if (props.id) {
    await Promise.all([getDetail(), getProducts(), getAgents()]);
  }
});

// Methods
const closeDialog = () => {
  emit("closeDialog");
};

const onOpenDropdown = async (key: string) => {
  if (key === "products" && !products.value) {
    await getProducts();
  } else if (key === "agents" && !agents.value) {
    await getAgents();
  }
};

const updateListByActiveState = (isActive: boolean) => {
  if (isActiveStateChangedOnEdit.value) {
    eventBus.emit(updateListEventKey, !isActive);
    emit("clearFetchedTab", !isActive);
    return;
  }
  eventBus.emit(updateListEventKey, isActive);
};

const save = async () => {
  isBtnLoading.value = true;
  const res = await kpiProductGroupStore.add(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active!);
    closeDialog();
  }
  isBtnLoading.value = false;
};

const getDetail = async () => {
  isLoading.value = true;
  initialDetailData.value = await kpiProductGroupStore.getDetail(props.id!);
  data.value = { ...initialDetailData.value };
  isLoading.value = false;
};

const getProducts = async () => {
  products.value = await kpiProductGroupStore.getProducts(productsParams.value);
};

const getAgents = async () => {
  agents.value = (await kpiProductGroupStore.getAgents(
    agentsParams.value,
  )) as unknown as DropdownItemsModelByType<AgentModel>;
};
<\/script>
`;export{n as default};
