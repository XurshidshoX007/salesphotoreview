const n=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal :name="t('clients.add')" @closeDialog="closeDialog">
      <flex-col class="gap-5">
        <DropdownsByFilterStates
          :filterStates="filterStates"
          @onOpenDropdown="onOpenDropdown"
          @search="onSearchDropdown"
        />
        <d-input
          v-for="(item, ind) in data.products"
          :key="ind"
          :label="getProductName(item.id)"
          required
          type="number"
          :value="data.products[ind].count"
          @change="data.products[ind].count = $event"
        />
        <d-input
          :label="t('column.comment')"
          pattern-type="comment"
          type="text"
          :value="data.comment"
          @change="data.comment = $event"
        />
      </flex-col>
      <template #footer>
        <m-btn :loading="isLoadingBtn" class="w-full" type="submit">
          {{ !data?.id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import type { DropdownsByFilterStates } from "#components";
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import type { SuggestionSaveModel } from "~/interfaces/api/orders/suggestion/suggestion-model";
import { useSuggestionStore } from "~/stores/orders/suggestion/suggestion.store";
import { OrderEventKeys } from "~/variable/event-key-constants";

// emits
const emit = defineEmits(["closeDialog"]);
const eventBus = useEventBus();

// Stores
const suggestionStore = useSuggestionStore("main");

// State
const { t } = useI18n();
const updateListEventKey = OrderEventKeys.SUGGESTION_TABLE_UPDATE;
const isLoadingBtn = ref(false);

const data = ref<SuggestionSaveModel>({
  id: undefined,
  trade_direction_id: null,
  client_id: null,
  comment: null,
  products: [],
});

let filterStates = ref([
  {
    name: t("sidebar.clients"),
    key: "clients",
    required: true,
    isSingleSelect: true,
    get data() {
      return suggestionStore.clients || [];
    },
    get getSelectedData() {
      return data.value.client_id;
    },
    set setSelectedData(value: string) {
      data.value.client_id = value;
    },
    onLoadElse: async () => {
      await onLoadElseClients();
    },
  },
  {
    name: t("settings_sidebar.trade_direction"),
    key: "trade-direction",
    isSingleSelect: true,
    required: true,
    get data() {
      return suggestionStore.tradeDirections || [];
    },
    get getSelectedData() {
      return data.value.trade_direction_id;
    },
    set setSelectedData(value: string) {
      data.value.trade_direction_id = value;
      getProducts(value);
    },
  },
  {
    name: t("settings.products"),
    key: "products",
    required: true,
    get data() {
      return suggestionStore.products || [];
    },
    get getSelectedData() {
      return data.value.products.map((e) => e.id);
    },
    get disabled() {
      return data.value.trade_direction_id ? false : true;
    },
    set setSelectedData(value: string[]) {
      data.value.products = value.map((el) => {
        return {
          id: el,
          count: null,
        };
      });
    },
  },
]);

// methods
const getProductName = (id: string) => {
  return \`\${t("labels.quantity")} \${
    suggestionStore.products?.items.find((e) => e.id === id)?.name || ""
  }\`;
};

const onSearchDropdown = async (state: string, value: string) => {
  if (state === "clients") {
    suggestionStore.clientsParams.search = value;
    await getClients();
    return;
  }
};

const onOpenDropdown = async (key: string) => {
  if (key === "trade-direction" && !suggestionStore.tradeDirections) {
    await getTradeDirection();
  }
  if (key === "clients" && !suggestionStore.clients) {
    await getClients();
  }
};

const onLoadElseClients = async () => {
  suggestionStore.clientsParams.page_size += 10;
  await getClients();
};

const getClients = async () => {
  await suggestionStore.getClientList();
};

const getTradeDirection = async () => {
  await suggestionStore.getTradeDirections();
};

const getProducts = async (id?: string) => {
  await suggestionStore.getProducts(id);
};

const save = async () => {
  isLoadingBtn.value = true;
  const res = await suggestionStore.add(data.value);
  if (res !== "error") {
    notify({ title: t("saved"), type: "success" });
    eventBus.emit(updateListEventKey);
    closeDialog();
  }
  isLoadingBtn.value = false;
};

const closeDialog = () => emit("closeDialog");
<\/script>
`;export{n as default};
