const e=`<template>
  <div
    ref="containerRef"
    :class="[
      'bg-white rounded-lg flex justify-center items-center p-5 my-2 absolute z-28 shadow-md',
      { 'top-0': !isViewHeightFull, 'bottom-10': isViewHeightFull },
    ]"
  >
    <div class="w-full flex gap-4.5 items-center justify-center flex-wrap">
      <div class="whitespace-nowrap">
        {{ t("orders.selected_forwarders") }}:
      </div>
      <div class="w-60">
        <DropdownsByFilterStates
          :filterStates="expeditorFilterState"
          @onOpenDropdown="onOpenDropdown"
        />
      </div>
      <div>
        <m-btn
          :disabled="!selectedExpeditorId"
          @click="setExpeditorToOrders"
          class="w-[100%]"
          >{{ t("save") }}
        </m-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type { ExpeditorModel } from "~/interfaces/api/users/expeditor-model";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import { defaultDropdownParams } from "~/variable/params";

// props
const props = defineProps<{
  isOrdersSelected: () => boolean;
}>();

// store
const ordersStore = useOrdersStore("main");

// states
const { t } = useI18n();
const containerRef = ref<HTMLElement | null>(null);
const expeditors = ref<DropdownItemsModelByType<ExpeditorModel>>();
const selectedExpeditorId = ref<string>("");

const expeditorsParams = ref<defaultDropdownParamsType>({
  ...defaultDropdownParams,
});

const unAttachExpeditor = ref([
  {
    name: t("orders.unpin"),
    id: "unattach-expeditor",
  },
]);

const expeditorFilterState = ref([
  {
    name: t("sidebar.delivery"),
    key: "expeditors",
    isSingleSelect: true,
    positionY: "top",
    get data() {
      return expeditors.value || [];
    },
    get getSelectedData() {
      return selectedExpeditorId.value;
    },
    set setSelectedData(value: string) {
      selectedExpeditorId.value = value;
    },
  },
]);

// hooks
const isViewHeightFull = computed(() => {
  if (!containerRef.value) return false;
  const rect = containerRef.value.getBoundingClientRect();
  const contentHeight = rect.height;
  const bottomSpace = window.innerHeight - rect.top;

  return bottomSpace < contentHeight;
});

// methods
const onOpenDropdown = async (state: string, value: unknown) => {
  if (state === "expeditors" && !expeditors.value) {
    await getExpeditors();
  }
};

const getExpeditors = async () => {
  expeditors.value = await ordersStore.getExpeditors(expeditorsParams.value);
  expeditors.value.items = [
    ...unAttachExpeditor.value,
    ...expeditors.value?.items,
  ];
};

const setExpeditorToOrders = async () => {
  if (!props.isOrdersSelected()) return;

  const isUnattach = selectedExpeditorId.value === "unattach-expeditor";
  const res = isUnattach
    ? await ordersStore.unAttachExpeditor(ordersStore.orderIds)
    : await ordersStore.setExpeditor({
        expeditorId: selectedExpeditorId.value,
        orders: ordersStore.orderIds,
      });

  if (res !== "error") {
    await ordersStore.refresh();
    notify({ title: t("save"), type: "success" });
  }
};
<\/script>
`;export{e as default};
