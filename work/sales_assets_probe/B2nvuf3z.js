const n=`<template>
  <div v-if="isCreateOrderDropdownShowable">
    <menu-btn size-free without-padding @onChangeIsActive="toggleOpen = $event">
      <template #btn>
        <div class="order-create-btn">
          <m-btn>
            <icon-arrow-bottom
              color="#ffffff"
              :class="[
                (toggleOpen && 'rotate-180 transition-all') ||
                  'rotate-0 transition-all',
              ]"
            />
            <span class="px-1">
              {{ t("filters.order") }}
            </span>
          </m-btn>
        </div>
      </template>
      <template #content>
        <div class="order-create-btn-content">
          <div class="header-content">
            {{ t("column.order_type") }}
          </div>
          <div>
            <div v-for="item in createOrderBtnsList">
              <div
                v-if="item.isShowable"
                class="type-item"
                @click="onOpenClientsPopup(item.id)"
              >
                {{ item.name }}
                <icon-arrow-righti />
              </div>
            </div>
          </div>
        </div>
      </template>
    </menu-btn>
  </div>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useOrdersAccess } from "~/composables/access/orders/orders";

// props
const props = defineProps<{
  headers?: Template[];
  disabledHeaders?: string[];
  saveKey?: string;
  tooltip?: string;
  contentPositionR?: boolean;
}>();

// emits

const emit = defineEmits(["onOpenClientsPopup"]);

//state
let toggleOpen = ref(false);
const { t } = useI18n();

const {
  hasAccess2CreateRequest,
  hasAccess2CreateExchange,
  hasAccess2CreateRefund,
  hasAccess2UpdateRefundByBonus,
} = useOrdersAccess();

const createOrderBtnsList = ref<
  Array<Record<"id" | "name" | "isShowable", string | boolean>>
>([
  {
    id: "request",
    name: t(t("filters.order")),
    get isShowable() {
      return hasAccess2CreateRequest.value;
    },
  },
  {
    id: "refund",
    name: t("orders.create_return_order"),
    get isShowable() {
      return hasAccess2CreateRefund.value;
    },
  },
  {
    id: "refundable-order",
    name: t("orders.create_return_from_by_order"),
    get isShowable() {
      return hasAccess2UpdateRefundByBonus.value;
    },
  },
  {
    id: "exchange",
    name: t("orders.create_exchange"),
    get isShowable() {
      return hasAccess2CreateExchange.value;
    },
  },
]);

// hooks

const isCreateOrderDropdownShowable = computed(() => {
  return (
    hasAccess2CreateRequest.value ||
    hasAccess2CreateExchange.value ||
    hasAccess2CreateRefund.value
  );
});

// methods

const onOpenClientsPopup = (type: string) => {
  emit("onOpenClientsPopup", type);
};
<\/script>

<style lang="scss">
.order-create-btn {
  .primary-btn {
    font-weight: 500 !important;
    gap: 0 8px !important;
  }
}

.order-create-btn-content {
  overflow: hidden;
  border: 1px solid #e1e4e4;
  border-radius: 8px;
  padding: 8px;
  background: theme("colors.neutral.0");
  display: flex;
  flex-direction: column;
  gap: 4px;

  .header-content {
    font-family: "Inter", sans-serif;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: theme("colors.neutral.950");
    padding: 8px 8px 12px;
    border-bottom: 1px solid #e1e4e4;
  }

  .type-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px;
    cursor: pointer;
    font-family: "Inter", sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: theme("colors.neutral.950");
    flex-wrap: nowrap;
    text-decoration: none;
    gap: 0 8px;
    border-radius: 8px;
  }

  .type-item:hover {
    background: theme("colors.neutral.50");
  }
}
</style>
`;export{n as default};
