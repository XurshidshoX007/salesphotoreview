const n=`<template>
  <c-tr
    class="sticky border-b-0 rounded-b-large -bottom-0.5 bg-lotion custom-shadow-top z-1 w-full"
    :class="fewDataTrClasses"
  >
    <c-td-no-edit
      v-for="header in headers"
      :key="header.key"
      :class="fewDataTdClassesByKey(header.key)"
    >
      <template v-if="header.key === 'payment_amount'">
        <div>
          <div
            @click="isDetailsOpen = !isDetailsOpen"
            class="flex items-center gap-3 cursor-pointer"
          >
            {{ t("labels.by_payment_method") }}
            <fa-icon
              hash="&#xf078;"
              class="btn-icon"
              :class="isDetailsOpen ? '-rotate-180' : ''"
            />
          </div>
          <Transition name="toggle-accordion">
            <div v-if="isDetailsOpen">
              <div
                v-for="detail in receivedDetails"
                :key="detail.id"
                class="text-sm font-semibold"
              >
                {{ detail.title }} {{ detail.amount }}
              </div>
            </div>
          </Transition>
        </div>
      </template>
      <template v-else>
        <div
          v-for="item in totalAmounts"
          :key="item.id"
          :class="{
            'text-red-3': header.key === 'agent_name' && item.id === 'left',
          }"
        >
          <template
            v-if="
              (header.key === 'client_name' && item.id === 'total') ||
              (header.key === 'payment_date' && item.id === 'received') ||
              (header.key === 'expeditor_name' && item.id === 'debt') ||
              (header.key === 'agent_name' && item.id === 'left')
            "
          >
            <div class="text-sm">
              {{ item.title }}
              <span class="font-semibold">{{ item.amount }}</span>
            </div>
          </template>
        </div>
      </template>
    </c-td-no-edit>
  </c-tr>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  headers: (Template & { id: string })[];
  totalAmounts: {
    id: string;
    title: string;
    amount: string;
    details?: {
      id: string;
      title: string;
      amount: string;
    }[];
  }[];
  fewDataTrClasses: string[];
  fewDataTdClassesByKey: Function;
}>();

// states
const { t } = useI18n();
const isDetailsOpen = ref(false);

// hooks
const receivedDetails = computed(() => {
  return props.totalAmounts.find((t) => t.id === "received")?.details || [];
});
<\/script>

<style scoped>
.custom-shadow-top {
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-accordion-enter-active,
.toggle-accordion-leave-active {
  transition: max-height 0.4s ease-in-out;
  overflow: hidden;
}

.toggle-accordion-enter-from,
.toggle-accordion-leave-to {
  max-height: 0;
}

.toggle-accordion-enter-to,
.toggle-accordion-leave-from {
  max-height: 100px;
}
</style>
`;export{n as default};
