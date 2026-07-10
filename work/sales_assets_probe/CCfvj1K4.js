const n=`<template>
  <form @submit.prevent="onSave">
    <d-modal name="Sozdat ruchnuyu skidku" @close-dialog="closeDialog">
      <flex-col class="gap-4">
        <d-input
          type="number"
          :disabled="isUsed"
          required
          :max="100"
          :min="0"
          :label="t('settings.discount.discount_percentage')"
          :value="data.rebate"
          class="flex-1"
          @change="data.rebate = $event"
        >
          <template #suffix>%</template>
        </d-input>
        <shared-localized-input
          required
          :disabled="isUsed"
          :label="t('settings.discount.discount_name')"
          v-model:base="data.default_name"
          v-model:translations="data.name_l10n"
        />
        <DropdownsByFilterStates
          :filter-states="filterStates"
          @on-open-dropdown="onOpenDropdown"
        />
        <Switch :active="data.is_active" @change="data.is_active = $event" />
      </flex-col>
      <template #footer>
        <div class="flex justify-end">
          <m-btn :loading="isSaving" type="submit">{{ t("save") }}</m-btn>
        </div>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { useEventBus } from "~/composables/EventBus/eventBus";
import type { DiscountByIdModel } from "~/interfaces/api/settings/discount-model";
import type { DiscountManualCreateModel } from "~/interfaces/api/settings/discount-model";

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits<{
  (e: "closeDialog"): void;
  (e: "clearFetchedTab"): void;
}>();

// store
const discountStore = useDiscountStore("main");

// states
const { t } = useI18n();
const eventBus = useEventBus();
const priceTypes = ref<DropdownItemsModelByType<DropdownModel>>();
const agents = ref<DropdownItemsModelByType<DropdownModel>>();
const products = ref<DropdownItemsModelByType<DropdownModel>>();
const isSaving = ref(false);
const updateEventKey: string = SettingsEventKeys.DISCOUNT_TABLE_UPDATE;
const isUsed = ref(false);

const data = reactive<Partial<DiscountManualCreateModel>>({
  id: props.id || undefined,
  rebate: undefined,
  name: "",
  default_name: "",
  name_l10n: {},
  agent_ids: [],
  price_type_ids: [],
  product_ids: [],
  is_active: true,
});

const filterStates = ref<FilterStateModel[]>([
  {
    name: t("settings_sidebar.price_type"),
    key: "priceTypes",
    get disabled() {
      return isUsed.value;
    },
    get data() {
      return priceTypes.value;
    },
    get getSelectedData() {
      return data.price_type_ids;
    },
    set setSelectedData(value: string[]) {
      data.price_type_ids = value;
    },
  },
  {
    name: t("settings.discount.agents"),
    key: "agents",
    get disabled() {
      return isUsed.value;
    },
    get data() {
      return agents.value;
    },
    get getSelectedData() {
      return data.agent_ids;
    },
    set setSelectedData(value: string[]) {
      data.agent_ids = value;
    },
  },
  {
    name: t("products"),
    key: "products",
    get disabled() {
      return isUsed.value;
    },
    get data() {
      return products.value;
    },
    get getSelectedData() {
      return data.product_ids;
    },
    set setSelectedData(value: string[]) {
      data.product_ids = value;
    },
  },
]);

// hooks
onMounted(async () => {
  if (props.id) {
    const discountData = await discountStore.getById(props.id);
    if (discountData) {
      setInitialData(discountData);
    }
  }
});

// methods
const closeDialog = () => {
  emit("closeDialog");
};

const setInitialData = (initialData: DiscountByIdModel) => {
  data.rebate = initialData.terms[0]?.rebate;
  data.name = initialData.name;
  data.default_name = initialData.default_name || initialData.name;
  data.name_l10n = initialData.name_l10n || {};
  data.is_active = initialData.is_active;
  data.price_type_ids = initialData.price_type_ids;
  data.agent_ids = initialData.agent_ids;
  data.product_ids = initialData.product_ids;
  isUsed.value = initialData.is_used;
};

const onOpenDropdown = async (state: string) => {
  if (state === "priceTypes" && !priceTypes.value) {
    await getPriceTypes();
  } else if (state === "agents" && !agents.value) {
    await getAgents();
  } else if (state === "products" && !products.value) {
    await getProducts();
  }
};

const onSave = async () => {
  isSaving.value = true;

  try {
    const isEdit = Boolean(props.id);

    if (isEdit && isUsed.value) {
      await discountStore.prolong({
        id: data.id!,
        is_active: data.is_active!,
        name: data.name!,
      });
    } else {
      await (isEdit
        ? discountStore.editManual(data)
        : discountStore.createManual(data));
    }

    notify({ title: t("toast.saved"), type: "success" });
    eventBus.emit(updateEventKey);
    closeDialog();
  } catch (error) {
    console.log(error);
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isSaving.value = false;
  }
};

const getPriceTypes = async () => {
  priceTypes.value = await discountStore.getPriceTypes();
};

const getAgents = async () => {
  agents.value = await discountStore.getAgents();
};

const getProducts = async () => {
  products.value = await discountStore.getProducts();
};
<\/script>
`;export{n as default};
