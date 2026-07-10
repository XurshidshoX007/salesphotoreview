const e=`<template>
  <div class="access-payment-method-dialog-modal">
    <d-modal
      with-out-header
      data-container-width="896px"
      @close-dialog="closeDialog"
    >
      <template #header>
        <div
          class="flex items-center gap-2 rounded-t-xl text-neutral-400 p-5 bg-red-lotion border-b -mt-3 -mx-2"
        >
          <span> {{ t("access.attach_payment_method") }}: </span>
          <span class="font-semibold text-neutral-950">{{ props.name }}</span>

          <span class="ml-auto"> {{ t("access.selected") }}: </span>
          <span class="font-semibold text-neutral-950">{{
            checkedItemIds.length
          }}</span>

          <icon-x
            class="cursor-pointer shrink-0 [&>path]:stroke-neutral-600"
            @click="closeDialog"
          />
        </div>

        <div class="flex gap-4 p-3">
          <search-input
            no-debounce
            class="grow"
            @change="searchingValue = $event"
          />
        </div>
      </template>

      <div class="w-full p-1">
        <div v-if="isLoading" class="flex flex-col gap-4 w-full pb-4">
          <skeleton-block v-for="i in 6" :key="i" height="40px" width="300px" />
        </div>

        <div v-else-if="!dataList.length">
          <div class="grid place-items-center p-8">
            <icon-process :size="96" />
            <page-title
              size="lg"
              weight="600"
              class="w-60 text-center"
              :title="
                t('access.all_available_payment_methods_have_been_attached')
              "
            />
          </div>
        </div>

        <div v-else-if="!filteredData.length">
          <div class="grid place-items-center p-8">
            <icon-search-x :size="96" />
            <page-title
              size="lg"
              weight="600"
              class="w-52 text-center"
              :title="t('access.nothing_found_by_query')"
            />
          </div>
        </div>

        <div v-else class="space-y-6">
          <checkbox
            v-for="item in filteredData"
            :key="item.id"
            :id="item.id"
            :title="item.name"
            :checked="checkedItemIds.includes(item.id)"
            :disabled="!item.is_active && !checkedItemIds.includes(item.id)"
            :is-in-active-item="
              !item.is_active && checkedItemIds.includes(item.id)
            "
            class="w-fit"
            @change="toggleItem(item.id, $event)"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex gap-4 items-center">
          <checkbox
            :checked="showOnlyChecked"
            :title="t('access.show_only_selecteds')"
            @change="showOnlyChecked = $event"
          />

          <m-btn
            class="!ml-auto !bg-neutral-200 !border-neutral-200 !text-neutral-600"
            @click="closeDialog"
          >
            {{ t("cancel") }}
          </m-btn>
          <m-btn
            :disabled="!props.canSave"
            :loading="isSaving"
            @click="onSaveAttach"
          >
            {{ t("save") }}
          </m-btn>
        </div>
      </template>
    </d-modal>
  </div>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type { AccessUserPaymentMethodsListModel } from "~/interfaces/api/access/payment-method-model";

// Props
const props = defineProps<{
  name?: string;
  canSave?: boolean;
}>();

// Emits
const emit = defineEmits<{
  (e: "closeDialog"): void;
}>();

// Store
const accessStore = useAccessUsersStore();

// Composables
const { t } = useI18n();

// State
const dataList = ref<AccessUserPaymentMethodsListModel[]>([]);
const checkedItemIds = ref<string[]>([]);
const isSaving = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const showOnlyChecked = ref<boolean>(false);
const searchingValue = ref<string>("");

// Computed
const filteredData = computed(() => {
  let result = dataList.value;

  if (showOnlyChecked.value) {
    result = result.filter((item) => checkedItemIds.value.includes(item.id));
  }

  if (searchingValue.value) {
    const term = searchingValue.value.toLowerCase();
    result = result.filter((item) => item.name.toLowerCase().includes(term));
  }

  return result;
});

// Hooks
onMounted(async () => {
  await getDataList();
  collectCheckedIds();
});

// Methods
const closeDialog = () => emit("closeDialog");

const toggleItem = (id: string, checked: boolean) => {
  if (checked) {
    if (!checkedItemIds.value.includes(id)) {
      checkedItemIds.value = [...checkedItemIds.value, id];
    }
  } else {
    checkedItemIds.value = checkedItemIds.value.filter((i) => i !== id);
  }
};

const onSaveAttach = async () => {
  isSaving.value = true;

  try {
    await accessStore.onAttachPaymentMethods({
      user_id: accessStore.activeUserId,
      currency_id_arr: checkedItemIds.value,
    });

    emit("closeDialog");
    notify({ title: t("toast.success"), type: "success" });
  } catch (error) {
    console.log(error);
  } finally {
    isSaving.value = false;
  }
};

const getDataList = async () => {
  isLoading.value = true;
  const paymentMethods = await accessStore.getUserPaymentMethods();
  dataList.value = paymentMethods || [];
  isLoading.value = false;
};

const collectCheckedIds = () => {
  checkedItemIds.value = dataList.value
    .filter((item) => item.is_allowed_to_create_payment)
    .map((item) => item.id);
};
<\/script>

<style lang="scss">
.access-payment-method-dialog-modal .modal-body-content {
  margin: 0 -8px;
  padding: 16px !important;
  @apply border-t border-neutral-200;
}
</style>
`;export{e as default};
