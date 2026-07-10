const e=`<template>
  <c-tr
    :class="[item.bgColor, currentDepth > 0 && '!border-0 border-y-0']"
    class="last-border-b-0"
  >
    <c-td-no-edit
      v-for="header in headers"
      :key="header.key"
      :class="header.type === 'number' ? 'text-right' : 'text-left'"
    >
      <div v-if="header.key === 'category'">
        <div
          v-if="item.hasChildren"
          class="flex justify-start items-center expand-collapse w-fit select-none cursor-pointer"
          :style="{ marginLeft: \`\${categoryIndent}px\` }"
          :class="item.textColor"
          @click="onExpandItem(item)"
        >
          <IconArrowBottom
            :color="expandIconColor"
            :class="[
              item.isExpanded
                ? 'rotate-0 transition-all'
                : 'rotate-[-90deg] transition-all',
            ]"
          />
          <div class="ml-3">{{ item.name }}</div>
        </div>
        <div v-else :style="{ marginLeft: \`\${categoryIndent}px\` }">
          {{ item.name }}
        </div>
      </div>
      <div v-else-if="header.type === 'payment-method'">
        <template v-if="Array.isArray(item.total_amounts_by_payment_method)">
          <div
            v-for="paymentMethod in item.total_amounts_by_payment_method"
            :key="paymentMethod.payment_method_id"
          >
            <div
              v-if="header.key === paymentMethod.payment_method_id"
              :class="[
                item.textColor,
                item.isBold && 'font-semibold',
                header.right && 'text-end',
              ]"
            >
              {{
                getFormattedAmount(
                  paymentMethod.converted_amount || paymentMethod.amount,
                )
              }}
            </div>
          </div>
        </template>
        <template v-else-if="item.total_amounts_by_payment_method">
          <div v-if="item.total_amounts_by_payment_method[header.key]">
            {{
              getFormattedAmount(
                item.total_amounts_by_payment_method[header.key]
                  .converted_amount ||
                  item.total_amounts_by_payment_method[header.key].amount,
              )
            }}
          </div>
        </template>
      </div>
      <div v-else-if="header.key === 'total'" class="font-semibold">
        {{ getFormattedAmount(item.total_amount) }}
      </div>
    </c-td-no-edit>
  </c-tr>
  <!-- Render children rows when expanded -->
  <template v-if="item.hasChildren && item.isExpanded && item.children">
    <DashboardCashboxCashFlowTableRow
      v-for="(childItem, childIndex) in item.children"
      :key="\`\${childIndex}-child\`"
      :item="childItem"
      :headers="headers"
      :depth="currentDepth + 1"
    />
  </template>
</template>

<script setup lang="ts">
import type { TableRowItem } from "~/interfaces/api/cashbox/cash-flow-model";
import type { Template } from "~/interfaces/ui/template";
import { getHexByTWColor } from "~/utils/helpers";
import { getFormattedAmount } from "~/utils/filter";

const props = defineProps<{
  headers: Template[];
  item: TableRowItem;
  depth?: number;
}>();

const currentDepth = computed(() => props.depth || 0);

const categoryIndent = computed(() => {
  const base = currentDepth.value * 20;
  if (props.item.hasChildren) return base;
  return currentDepth.value > 0 ? base + 20 : base;
});

const expandIconColor = computed(() =>
  props.item.textColor
    ? getHexByTWColor(props.item.textColor) || undefined
    : undefined,
);

const onExpandItem = (item: TableRowItem) => {
  item.isExpanded = !item.isExpanded;
};
<\/script>
`;export{e as default};
