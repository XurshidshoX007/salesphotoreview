const n=`<template>
  <div :class="cn('w-full flex gap-2.5 flex-wrap', props.classes?.root)">
    <card
      v-if="typeof props.totalAmounts.volume === 'number'"
      :classes="{
        root: cn(
          'min-w-44 grow px-4 rounded-xl bg-neutral-150 min-h-[70px]',
          props.classes?.card?.root,
        ),
        content: cn('h-full flex items-center', props.classes?.card?.content),
      }"
      :variant="props.cardVariant"
    >
      <div
        class="size-12 rounded-[10px] bg-[#06B721] grid place-items-center border-[1.5px] border-white/15 shrink-0 shadow-[0px_4px_20px_0px_#06B72133]"
      >
        <icon-scale :size="26" class="text-white" />
      </div>

      <div class="ml-4">
        <div class="space-x-1">
          <span class="text-neutral-950 text-2xl font-bold">{{
            getFormattedAmount(totalAmounts.volume || 0)
          }}</span>
          <span class="font-semibold text-base text-neutral-600"
            >{{ t("metr_cube") }}
          </span>
        </div>

        <div class="text-sm text-neutral-600">
          {{ t("orders.total_volume") }}
        </div>
      </div>
    </card>

    <card
      v-if="typeof props.totalAmounts.weight === 'number'"
      :classes="{
        root: cn(
          'min-w-44 grow px-4 rounded-xl bg-neutral-150 min-h-[70px]',
          props.classes?.card?.root,
        ),
        content: cn('h-full flex items-center', props.classes?.card?.content),
      }"
      :variant="props.cardVariant"
    >
      <div
        class="size-12 rounded-[10px] bg-[#E82F2F] grid place-items-center border-[1.5px] border-white/15 shrink-0 shadow-[0px_4px_20px_0px_#E82F2F33]"
      >
        <icon-scales :size="26" class="text-white" />
      </div>

      <div class="ml-4">
        <div class="space-x-1">
          <span class="text-neutral-950 text-2xl font-bold">{{
            getFormattedAmount(totalAmounts.weight || 0)
          }}</span>
          <span class="font-semibold text-base text-neutral-600"
            >{{ t("kg") }}
          </span>
        </div>

        <div class="text-sm text-neutral-600">
          {{ t("orders.total_weight") }}
        </div>
      </div>
    </card>

    <card
      :classes="{
        root: cn(
          'min-w-44 grow px-4 rounded-xl bg-neutral-150 min-h-[70px]',
          props.classes?.card?.root,
        ),
        content: cn('h-full flex items-center', props.classes?.card?.content),
      }"
      :variant="props.cardVariant"
    >
      <div
        class="size-12 rounded-[10px] bg-orange-500 grid place-items-center border-[1.5px] border-white/15 shrink-0 shadow-[0px_4px_20px_0px_#FF890133]"
      >
        <IconOrderedList :size="26" class="text-white" />
      </div>

      <div class="ml-4">
        <div class="space-x-1">
          <span class="text-neutral-950 text-2xl font-bold">{{
            getFormattedAmount(totalAmounts.count) || 0
          }}</span>
          <span class="font-semibold text-base text-neutral-600"
            >{{ t("count") }}
          </span>
        </div>

        <div class="text-sm text-neutral-600">
          {{ t("labels.total_count") }}
        </div>
      </div>
    </card>

    <card
      :classes="{
        root: cn(
          'min-w-44 grow px-4 rounded-xl bg-neutral-150 min-h-[70px]',
          props.classes?.card?.root,
        ),
        content: cn('h-full flex items-center', props.classes?.card?.content),
      }"
      :variant="props.cardVariant"
    >
      <div
        class="size-12 rounded-[10px] bg-primary-250 grid place-items-center border-[1.5px] border-white/15 shrink-0 shadow-[0px_4px_20px_0px_#05A9A933]"
      >
        <IconCash1 :size="26" class="text-white" />
      </div>

      <div class="ml-4">
        <div class="space-x-1">
          <span class="text-neutral-950 text-2xl font-bold">{{
            getFormattedAmount(totalAmounts.cost) || 0
          }}</span>
          <span class="font-semibold text-base text-neutral-600"
            >{{ baseCurrency }}
          </span>
        </div>

        <div class="text-sm text-neutral-600">
          {{ t("orders.total_amount_orders") }}
        </div>
      </div>
    </card>
  </div>
</template>

<script setup lang="ts">
import { getFormattedAmount } from "~/utils/filter";
import { useI18n } from "vue-i18n";
import type { cardVariants } from "./Card/variants";
import type { ClassValue } from "clsx";
import { cn } from "#imports";

// Props
const props = defineProps<{
  totalAmounts: {
    weight: number;
    volume: number;
    count: number;
    cost: number;
  };
  baseCurrency?: string;
  classes?: {
    root?: string;
    card?: Partial<Record<keyof typeof cardVariants.slots, ClassValue>>;
  };
  cardVariant?: keyof typeof cardVariants.variants.variant;
}>();

// Composables
const { t } = useI18n();
<\/script>
`;export{n as default};
