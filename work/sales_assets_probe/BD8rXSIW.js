const n=`<template>
  <form @submit.prevent="save">
    <d-modal
      :name="modalName"
      only-close-dialog
      :loading="agentStore.isUpdateAgentDialogLoading"
      @closeDialog="closeDialog"
    >
      <flex-col class="gap-5">
        <d-input
          required
          type="text"
          :label="t('labels.first_name')"
          id="first_name"
          :value="methodData.first_name"
          focusable
          @change="methodData.first_name = $event"
        />
        <d-input
          required
          type="text"
          :label="t('labels.last_name')"
          id="last_name"
          :value="methodData.last_name"
          @change="methodData.last_name = $event"
        />
        <d-input
          type="text"
          :label="t('labels.middle_name')"
          :value="methodData.middle_name"
          @change="methodData.middle_name = $event"
        />
        <d-input
          :label="t('column.phone')"
          type="tel"
          :value="methodData.phone"
          @change="methodData.phone = $event"
        />
        <d-input
          :label="t('labels.email')"
          type="email"
          id="email"
          :value="methodData.email"
          @change="methodData.email = $event"
        />
        <DropdownsByFilterStates
          ref="DropdownComponent"
          :filterStates="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <d-input
          :label="t('column.code')"
          type="text"
          id="code"
          pattern-type="code"
          :value="methodData.code"
          @change="methodData.code = $event"
        />
        <d-input
          :label="t('column.pinfl')"
          type="text"
          pattern-type="pinfl"
          id="national_id_number"
          :value="methodData.national_id_number"
          @change="methodData.national_id_number = $event || null"
        />
        <dropdowns-by-filter-states
          :filter-states="branchesStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <dropdowns-by-filter-states
          :filter-states="rolePositionsStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <d-input
          required
          :label="t('settings.login')"
          type="text"
          id="login"
          pattern-type="code"
          :value="methodData.login"
          @change="methodData.login = $event"
        />
        <m-btn
          v-if="id && !isChangePassword"
          class="w-full"
          group="outlined"
          @click.stop="isChangePassword = true"
          >{{ t("settings.edit_password") }}
        </m-btn>
        <transition name="toggle-accordion">
          <div v-if="isChangePassword" class="flex-row">
            <d-input
              :required="!id"
              :label="t('labels.password')"
              type="password"
              pattern-type="code"
              id="password"
              :value="methodData.password"
              @change="methodData.password = $event"
            />
          </div>
        </transition>
        <div class="flex items-center justify-between">
          <Checkbox
            :title="t('column.consignation')"
            :checked="methodData.can_order_with_consignation"
            @change="methodData.can_order_with_consignation = $event"
          />
          <div class="flex justify-between items-center gap-x-4">
            <div class="fs-14">{{ t("users.select_color_for_kpi") }}</div>
            <div class="flex">
              <div class="input-color-container cursor-pointer">
                <input
                  v-model="methodData.color"
                  class="input-color"
                  type="color"
                />
              </div>
            </div>
          </div>
        </div>
        <div>
          <div class="flex items-center justify-between">
            <div class="agent-limit-title">
              {{ t("settings_sidebar.price_type") }}:
              {{
                agentLimitProductAndPriceType.price_type || t("users.no_limits")
              }}
              <div v-if="agentLimitProductAndPriceType.price_type">
                {{ t("count") }}
              </div>
            </div>
            <div class="agent-limit-title">
              {{ t("settings.products") }}:
              {{
                agentLimitProductAndPriceType.product_id || t("users.no_limits")
              }}
              <div v-if="agentLimitProductAndPriceType.product_id">
                {{ t("count") }}
              </div>
            </div>
          </div>
        </div>
        <m-btn group="blue" @click="openAgentLimit">
          {{ t("users.limitations") }}
        </m-btn>
      </flex-col>
      <template #footer>
        <div v-show="allowToUpdate">
          <m-btn class="w-full" type="submit" :loading="isBtnLoading">
            {{ props.id ? t("save") : t("clients.add") }}
          </m-btn>
        </div>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { useNotification } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";

import type { DropdownsByFilterStates } from "#components";
import type { WarehousesModel } from "~/interfaces/api/warehouse/warehouses-model";
import { defaultDropdownParams, dropdownParamsAll } from "~/variable/params";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { TradeDirectionsModel } from "~/interfaces/api/settings/trade-directions-model";
import { ref } from "vue";

const DropdownComponent = ref<typeof DropdownsByFilterStates>(null);

// Props
const props = defineProps({
  modalName: String,
  id: String,
  allowToUpdate: Boolean,
  agentLimitDataForAgentCreate: {
    type: Object as () => {
      product_id_arr: Array<{ product_id: string }>;
      price_type_id_arr: Array<{ price_type_id: string }>;
    },
    default: () => ({
      product_id_arr: [],
      price_type_id_arr: [],
    }),
  },
});

// Composables
const { t } = useI18n();

// Store
const agentStore = useAgentsStore("main");

// State
const isBtnLoading = ref(false);
const isChangePassword = ref(!!!props?.id);
const warehouses = ref<DropdownItemsModelByType<WarehousesModel> | undefined>();
const tradeDirections = ref<
  DropdownItemsModelByType<TradeDirectionsModel> | undefined
>();
const agentTypes = ref({
  items: null,
});
const branches = ref<DropdownItemsModelByType<DropdownModel>>();
const rolePositions = ref<DropdownItemsModelByType<DropdownModel>>();

const dropdownParams = ref(
  props.id ? { ...dropdownParamsAll } : { ...defaultDropdownParams },
);
const warehouseParams = ref<defaultDropdownParamsType>(dropdownParams.value);
const tradeDirectionParams = ref<defaultDropdownParamsType>(
  dropdownParams.value,
);
const branchesParams = ref(dropdownParams.value);

const filterStates = ref([
  {
    name: t("sidebar.warehouse"),
    key: "warehouses",
    get data() {
      return warehouses.value || [];
    },
    get getSelectedData() {
      return methodData.value.warehouse_id_arr || [];
    },
    set setSelectedData(value: string[]) {
      methodData.value.warehouse_id_arr = value;
    },
  },
  {
    name: t("settings_sidebar.trade_direction"),
    key: "trade-directions",
    required: true,
    isSingleSelect: true,
    get data() {
      return tradeDirections.value || [];
    },
    get getSelectedData() {
      return methodData.value.trade_direction_id_arr[0] || "";
    },
    set setSelectedData(value: string) {
      methodData.value.trade_direction_id_arr = [value];
    },
  },
  {
    name: t("column.agent_type"),
    key: "agent-type",
    get data() {
      return agentTypes.value || [];
    },
    get getSelectedData() {
      return methodData.value.agent_type;
    },
    set setSelectedData(value: number) {
      methodData.value.agent_type = value;
    },
    isSingleSelect: true,
    required: true,
  },
]);

const branchesStates = ref([
  {
    name: t("column.branch"),
    key: "branches",
    isSingleSelect: true,
    isClearable: true,
    get data() {
      return branches.value;
    },
    get getSelectedData() {
      return methodData.value.branch_id;
    },
    set setSelectedData(value: string) {
      methodData.value.branch_id = value;
    },
  },
]);

const rolePositionsStates = ref([
  {
    name: t("column.role_position"),
    key: "role-positions",
    isSingleSelect: true,
    isClearable: true,
    get data() {
      return rolePositions.value;
    },
    get getSelectedData() {
      return methodData.value.role_position_id;
    },
    set setSelectedData(value: string) {
      methodData.value.role_position_id = value;
    },
  },
]);

const methodData = ref({
  first_name: null,
  middle_name: null,
  last_name: null,
  phone: "",
  login: "",
  code: null,
  color: "#d41c1c",
  email: null,
  agent_type: null,
  national_id_number: null,
  password: "",
  can_order_with_consignation: false,
  is_active: true,
  price_type_id_arr: [],
  product_id_arr: [],
  warehouse_id_arr: [],
  trade_direction_id_arr: [],
  branch_id: null,
  role_position_id: null,
});

// Emits
const emit = defineEmits([
  "closeDialog",
  "openAgentLimit",
  "setSelectedData",
  "refresh",
]);

// Methods
const closeDialog = () => {
  emit("closeDialog");
  DropdownComponent.value.onClearFilter();
};

const openAgentLimit = () => {
  emit("openAgentLimit", props.id);
};

const save = async () => {
  const { notify } = useNotification();
  const fetchData = {
    ...methodData.value,
    ...props.agentLimitDataForAgentCreate,
  };
  isBtnLoading.value = true;
  const res = await agentStore.add(fetchData);
  isBtnLoading.value = false;
  if (res !== "error") {
    emit("refresh");
    notify({ title: t("successful") });
    closeDialog();
  } else notify({ title: t("error"), type: "error" });
};

const getDetail = async () => {
  methodData.value = await agentStore.getAgentDetail(props.id);
  emit("setSelectedData", {
    price_type_id_arr: methodData.value.price_type_id_arr,
    product_id_arr: methodData.value.product_id_arr,
  });
};

// Hooks
onMounted(async () => {
  if (props.id) {
    await Promise.all([
      getDetail(),
      getWarehouses(),
      getTradeDirections(),
      getBranches(),
      getAgentRolePositions(),
    ]);
    !agentTypes.value.items && (await getAgentTypes());
  } else {
    !agentTypes.value.items && (await getAgentTypes());
    methodData.value.agent_type = agentTypes.value.items[0]?.id;
  }
});

const agentLimitProductAndPriceType = computed(() => {
  return {
    price_type: props.agentLimitDataForAgentCreate.price_type_id_arr.length,
    product_id: props.agentLimitDataForAgentCreate.product_id_arr.length,
  };
});

const onOpenDropdown = async (state: string, value: any) => {
  if (state === "trade-directions" && !tradeDirections.value) {
    await getTradeDirections();
  } else if (state === "warehouses" && !warehouses.value) {
    await getWarehouses();
  } else if (state === "agent-type" && !agentTypes.value.items) {
    await getAgentTypes();
  } else if (state === "branches" && !branches.value) {
    await getBranches();
  } else if (state === "role-positions" && !rolePositions.value) {
    await getAgentRolePositions();
  }
};

const getWarehouses = async () => {
  warehouses.value = await agentStore.getWarehouses(warehouseParams.value);
};

const getTradeDirections = async () => {
  tradeDirections.value = await agentStore.getTradeDirectionList(
    tradeDirectionParams.value,
  );
};

const getAgentTypes = async () => {
  agentTypes.value.items = await agentStore.getAgentTypes();
};

const getBranches = async () => {
  branches.value = await agentStore.getBranches(branchesParams.value);
};

const getAgentRolePositions = async () => {
  rolePositions.value = await agentStore.getAgentRolePositions();
};
<\/script>

<style scoped>
.input-color-container {
  position: relative;
  overflow: hidden;
  width: 28px;
  height: 28px;
  border-radius: 8px;
}

.input-color {
  position: absolute;
  right: -8px;
  top: -8px;
  width: 56px;
  height: 56px;
  border: none;
}

.agent-limit-title {
  font-size: 14px;
  font-weight: 400;
  font-family: "Inter", sans-serif;
  color: #299b9b;
  display: flex;
  gap: 0 4px;
}
</style>
`;export{n as default};
