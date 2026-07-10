const n=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="dialogStore?.singleData?.id ? t('edit') : t('clients.add')"
      only-close-dialog
      :loading="bonusCategoryStore.loadingUpdate"
      @closeDialog="dialogStore.closeDialog"
    >
      <flex-col class="gap-5">
        <shared-localized-input
          required
          :label="t('column.name')"
          v-model:base="data.default_name"
          v-model:translations="data.name_l10n"
        />
        <d-input
          type="text"
          :label="t('column.code')"
          pattern-type="code"
          :value="data.code"
          @change="data.code = $event"
        />
        <d-input
          :label="t('labels.sort')"
          type="number"
          pattern-type="sort"
          :value="data.sort"
          @change="data.sort = $event"
        />
        <d-input
          type="number"
          :label="t('labels.bonus_combination_count_for_order')"
          :min="1"
          :max="9"
          :max-length="1"
          :value="data.bonus_combination_count_for_order"
          @change="data.bonus_combination_count_for_order = $event"
        />
        <shared-localized-input
          :label="t('column.comment')"
          v-model:base="data.default_description"
          v-model:translations="data.description_l10n"
        />
        <Switch :active="data.is_active" @change="data.is_active = $event" />
      </flex-col>
      <template #footer>
        <m-btn :loading="isBtnLoading" class="w-full" type="submit">
          {{ !data.id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useBonusCategoryStore } from "~/stores/settings/bonus-category/bonus-category.store";
import type { BonusCategoryModel } from "~/interfaces/api/settings/bonus-category";

// store
const bonusCategoryStore = useBonusCategoryStore("main");
const dialogStore = useDialogStore("bonus-category");

// states
const { t } = useI18n();
const isBtnLoading = ref<boolean>(false);
const data = ref<BonusCategoryModel>({
  id: undefined,
  name: null,
  default_name: "",
  name_l10n: {},
  description: null,
  sort: null,
  default_description: undefined,
  description_l10n: {},
  bonus_combination_count_for_order: null,
  code: null,
  is_active: true,
});

// hooks
onBeforeMount(() => {
  if (dialogStore.singleData !== null) {
    data.value = dialogStore.singleData;
  }
});

onMounted(async () => {
  if (dialogStore.singleData?.id) {
    data.value = await bonusCategoryStore.getDetail(dialogStore.singleData?.id);
  }
});

// methods
const save = async () => {
  isBtnLoading.value = true;
  if (data.value.bonus_combination_count_for_order === 0) {
    data.value = {
      ...data.value,
      bonus_combination_count_for_order: null,
    };
  }
  const res = await bonusCategoryStore.add(data.value);
  if (res !== "error") {
    dialogStore.closeDialog();
  }
  isBtnLoading.value = false;
};
<\/script>

<style lang="scss">
.combination-bonus {
  input {
    height: 38px !important;
  }
}
</style>
`;export{n as default};
