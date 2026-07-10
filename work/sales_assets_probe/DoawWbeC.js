const e=`<template>
  <flex-col class="gap-2.5 min-h-0">
    <div class="flex items-center justify-between rounded-b-0">
      <div>
        <span class="font-medium text-neutral-950">
          {{ t("settings_sidebar.price_type") }}
        </span>
      </div>
      <ToggleDataViewBtn
        :title="t('orders.old_price')"
        title-size="sm"
        :title-weight="400"
        no-padding
        :is-open="isToggleOpen"
        title-position="before"
        @click.self="changeToggle"
      />
    </div>
    <div>
      <RadioBtn
        :items="priceTypes?.items"
        :selectedItem="priceTypeId"
        @onSelectItemId="onSelectPriceTypeId"
      />
      <transition name="toggle-accordion">
        <flex-col v-if="isToggleOpen" class="gap-2.5 mt-4">
          <div class="flex items-center justify-between">
            <div class="text-neutral-600 text-sm">
              {{ \`\${t("orders.old_price_for_price_type")}\` }} "{{
                selectedPriceTypeName
              }}"
            </div>
            <div
              v-if="priceForDate"
              class="flex items-center gap-x-2 cursor-pointer"
              @click="onSelectOldPriceDate(null)"
            >
              <icon-trash :size="22" class="text-red-600" />
            </div>
          </div>
          <div class="pr-1 rounded-large border-1 border-color-blue-50">
            <div class="old-price-component shrink-0 grow-0">
              <RadioBtn
                is-item-date
                :items="filteredOldPriceTypeDates"
                :selectedItem="priceForDate"
                group="grid"
                @onSelectItemId="onSelectOldPriceDate"
              />
            </div>
          </div>
        </flex-col>
      </transition>
    </div>
  </flex-col>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { notify } from "@kyvg/vue3-notification";

// emits

const emit = defineEmits(["onSelectPriceTypeId", "onSelectOldPriceDate"]);

// props
const props = defineProps({
  priceTypeId: String,
  priceTypes: Array,
  selectedPriceTypeName: String,
  filteredOldPriceTypeDates: Array,
  priceForDate: String,
});

// states
const { t } = useI18n();
const isToggleOpen = ref(false);

// methods

const changeToggle = () => {
  if (!props.priceTypeId) {
    notify({ title: t("orders.first_price_type"), type: "error" });
    return;
  } else {
    isToggleOpen.value = !isToggleOpen.value;
  }
};

const onSelectPriceTypeId = (priceTypeId: string) => {
  emit("onSelectPriceTypeId", priceTypeId);
};

const onSelectOldPriceDate = (oldPriceDate: string | NULL) => {
  emit("onSelectOldPriceDate", oldPriceDate);
};
<\/script>

<style lang="scss" scoped>
::-webkit-scrollbar {
  width: 5px;
  margin-top: 18px;
  padding-right: 12px;
  border-radius: 28px;
  height: 8px;
}

::-webkit-scrollbar-track {
  margin: 18px 18px;
  height: 8px;
  background: transparent;
  border-radius: 28px;
}

::-webkit-scrollbar-thumb {
  background: #299b9b;
  border-radius: 28px;
  height: 8px;
  margin-top: 18px;
}

.old-price-component {
  max-height: 240px;
  overflow-y: auto;
  border-radius: 12px;
}
</style>
`;export{e as default};
