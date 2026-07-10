const n=`<template>
  <card
    variant="outlined"
    :classes="{
      root: 'px-4 py-2.5 h-fit overflow-visible',
      content: [
        'grid grid-cols-1 grid-flow-row grid-rows-none gap-x-10',
        '@5xl:grid-cols-2 @5xl:grid-flow-col @5xl:grid-rows-[repeat(7,min-content)]',
        'max-xl:grid-cols-2 max-xl:grid-flow-col max-xl:grid-rows-[repeat(7,min-content)]',
        'max-md:grid-cols-1 max-md:grid-flow-row max-md:grid-rows-none',
      ],
    }"
  >
    <template v-for="item in mainInfoKeyValue" :key="item.key">
      <slot :name="item.key" :item="item">
        <flex-row :class="cn(baseRowClass, item.class)">
          <flex-row class="items-center gap-2.5">
            <component
              :is="item.icon"
              :size="24"
              variant="twotone"
              class="text-primary-600"
            />
            <div class="text-sm">{{ item.title }}</div>
          </flex-row>

          <slot :name="item.key + '-content'" :item="item">
            <div
              class="text-sm border rounded-lg px-2.5 py-[3px] max-w-[150px] min-w-0 overflow-hidden"
            >
              <span class="truncate block w-full">{{ item.value || "-" }}</span>
            </div>
          </slot>
        </flex-row>
      </slot>
    </template>
  </card>
</template>

<script setup lang="ts">
import { cn, type OrderDetailModel } from "#imports";
import { useI18n } from "vue-i18n";
import {
  IconBonus,
  IconCalendar,
  IconDiscount,
  IconExpeditor,
  IconHandHoldingDollar,
  IconLocation,
  IconMessage,
  IconPenToSquare,
  IconSignpost,
  IconTag,
  IconUser,
  IconWarehouse,
} from "#components";
import type {
  OrderDetailsMainInfoItemByKey,
  OrderDetailsMainInfoItemKey,
} from "~/interfaces/api/orders/order-detail-model";

// Types
export type OrderDetailsSlotProps<
  K extends OrderDetailsMainInfoItemKey = OrderDetailsMainInfoItemKey,
> = {
  item: OrderDetailsMainInfoItemByKey<K>;
};

// Props
const props = defineProps<{
  data?: OrderDetailModel;
}>();

// Slots
defineSlots<{
  [key: string]: (props: OrderDetailsSlotProps) => any;
}>();

// Composables
const { t } = useI18n();

// Constants
const baseRowClass =
  "h-8 items-center justify-between gap-2.5 box-content py-2 shadow-[inset_0_-1px_0_#E1E4EA]";

// Hooks
const mainInfoKeyValue = computed(() => [
  {
    key: "agent",
    icon: IconUser,
    title: t("users.agents.agent"),
    value: props.data?.agent,
    class: "pt-0",
  } satisfies OrderDetailsMainInfoItemByKey<"agent">,
  {
    key: "expeditor",
    icon: IconExpeditor,
    title: t("filters.expeditor"),
    value: props.data?.expeditor,
  } satisfies OrderDetailsMainInfoItemByKey<"expeditor">,
  {
    key: "warehouse",
    icon: IconWarehouse,
    title: t("sidebar.warehouse"),
    value: props.data?.warehouse?.name,
  } satisfies OrderDetailsMainInfoItemByKey<"warehouse">,
  {
    key: "trade_direction",
    icon: IconSignpost,
    title: t("settings_sidebar.trade_direction"),
    value: props.data?.trade_direction?.name,
  } satisfies OrderDetailsMainInfoItemByKey<"trade_direction">,
  {
    key: "price_type",
    icon: IconTag,
    title: t("settings_sidebar.price_type"),
    value: props.data?.price_type?.name,
  } satisfies OrderDetailsMainInfoItemByKey<"price_type">,
  {
    key: "discount_type",
    icon: IconDiscount,
    title: t("column.discount"),
    value: props.data?.discount_type?.name,
  } satisfies OrderDetailsMainInfoItemByKey<"discount_type">,
  {
    key: "bonus_type",
    icon: IconBonus,
    title: t("column.bonus"),
    value: props.data?.bonus_type?.name,
    class: cn(
      "@5xl:pb-0 @5xl:shadow-none",
      "max-xl:pb-0 max-xl:shadow-none",
      "max-md:pb-2 max-md:shadow-[inset_0_-1px_0_#E1E4EA]",
    ),
  } satisfies OrderDetailsMainInfoItemByKey<"bonus_type">,
  {
    key: "created_date",
    icon: IconCalendar,
    title: t("column.created_date"),
    value: {
      createdDate: props.data?.created_date,
      shippingDate: props.data?.shipping_date,
      returnedDate: props.data?.returned_date,
    },
    class: cn("pt-2 @5xl:pt-0", "max-xl:pt-0", "max-md:py-2"),
  } satisfies OrderDetailsMainInfoItemByKey<"created_date">,
  {
    key: "consignation",
    icon: IconHandHoldingDollar,
    title: t("column.consignation"),
    value: props.data?.consignation_term,
  } satisfies OrderDetailsMainInfoItemByKey<"consignation">,
  {
    key: "created_by",
    icon: IconPenToSquare,
    title: t("column.created_by"),
    value: "",
  } satisfies OrderDetailsMainInfoItemByKey<"created_by">,
  {
    key: "location",
    icon: IconLocation,
    title: t("column.location"),
    value: props.data?.location,
  } satisfies OrderDetailsMainInfoItemByKey<"location">,
  {
    key: "commentary",
    icon: IconMessage,
    title: t("column.comment"),
    value: props.data?.comment,
    class: "pb-0 shadow-none",
  } satisfies OrderDetailsMainInfoItemByKey<"commentary">,
]);
<\/script>
`;export{n as default};
