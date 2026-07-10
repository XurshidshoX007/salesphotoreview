const e=`<template>
  <div
    v-if="hasAccess2GetList"
    class="filter-content-container !gap-0 !rounded-b-none !p-0"
  >
    <MultiTab
      :classes="{
        root: 'p-4 pb-0',
        list: 'border-t-0',
      }"
      variant="underline"
      :tabs="tabsList"
      v-model:active="currentTab"
    >
      <template v-for="tab in tabsList" :key="tab.key" #[tab.key]>
        <OrdersRequestAutomationGeneralTable
          v-if="fetchedTabs.has(tab.key)"
          :active-tab="1"
          :save-key="amountLimitConditionHeader"
          :is-allow-for-save="hasAccess2Save"
          :is-active="tab.key === 'ACTIVE'"
        />
      </template>
    </MultiTab>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useOrderAmountLimitConditionAccess } from "~/composables/access/orders/amount-limit-condition";
import { useEventBus } from "~/composables/EventBus/eventBus";
import type { OrderRequestAutomationParams } from "~/interfaces/api/orders/order-request-automation-model";
import { OrderEventKeys } from "~/variable/event-key-constants";
import { amountLimitConditionHeader } from "~/variable/column-constants";

// Props
const props = defineProps<{
  externalParams: OrderRequestAutomationParams;
}>();

// Composables
const { t } = useI18n();
const { hasAccess2GetList, hasAccess2Save } =
  useOrderAmountLimitConditionAccess();
const eventBus = useEventBus();

// States

const fetchedTabs = ref(new Set<TabTypes>(["ACTIVE"]));

type TabTypes = "ACTIVE" | "NOT_ACTIVE";

const tabsList = ref<{ key: TabTypes; title: string }[]>([
  { key: "ACTIVE", title: t("active") },
  { key: "NOT_ACTIVE", title: t("not_active") },
]);

const currentTab = ref<TabTypes>("ACTIVE");

// Constants
const updateListEventKey = OrderEventKeys.REQUEST_AUTOMATION_TABLE_UPDATE;

// Hooks

watch(
  () => currentTab.value,
  async (newTab) => {
    if (!fetchedTabs.value.has(newTab)) {
      fetchedTabs.value.add(newTab);
      await nextTick();
      // Tab o'zgarganda Event bus bilan listga request ketadi
      eventBus.emit(updateListEventKey, {
        activeTab: 1,
        isActive: currentTab.value === "ACTIVE",
        filters: props.externalParams,
      });
    }
  },
);

defineExpose({
  clearFitchedTabs,
});

// Methods
function clearFitchedTabs() {
  fetchedTabs.value.forEach((tab: TabTypes) => {
    if (tab !== currentTab.value) {
      fetchedTabs.value.delete(tab);
    }
  });
}
<\/script>
`;export{e as default};
