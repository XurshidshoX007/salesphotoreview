const n=`<template>
  <form @submit.prevent="onSave">
    <d-modal :name="modalName" @closeDialog="closeDialog">
      <flex-col class="gap-5">
        <shared-localized-input
          required
          auto-focus
          :label="t('column.name')"
          v-model:base="methodData.default_name"
          v-model:translations="methodData.name_l10n"
        />
        <d-input
          :id="'phone'"
          :label="t('column.phone_number')"
          :type="'tel'"
          :value="methodData.phone"
          @change="(newVal) => (methodData.phone = newVal)"
        />

        <d-input
          :id="'address'"
          :label="t('column.address')"
          type="text"
          class="w-full"
          :value="methodData.address"
          @change="(newVal) => (methodData.address = newVal)"
        />
        <d-input
          :label="t('labels.sort')"
          type="number"
          class="w-full"
          pattern-type="sort"
          :value="methodData.sort"
          @change="(newVal) => (methodData.sort = newVal)"
        />
        <d-input
          :label="t('column.code')"
          type="text"
          pattern-type="code"
          :value="methodData.code"
          @change="(newVal) => (methodData.code = newVal)"
        />
        <d-input
          :label="t('column.comment')"
          type="text"
          pattern-type="comment"
          :value="methodData.description"
          @change="(newVal) => (methodData.description = newVal)"
        />
        <Switch
          :title="t('active')"
          :active="methodData.is_active"
          @change="methodData.is_active = $event"
        />
      </flex-col>
      <template #footer>
        <m-btn
          v-if="isAllowedToSave"
          type="submit"
          :loading="loadingBtn"
          class="w-full"
        >
          {{ props.id ? "Сохранить" : "Добавить" }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SupplierEventKeys } from "~/variable/event-key-constants";

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// store
const suppliersStore = useSuppliersStore("main");

// props
const props = defineProps({
  id: String,
  modalName: String,
  allowToSave: Boolean,
});

// state
const { t } = useI18n();
const eventBus = useEventBus();
const loadingBtn = ref(false);
const updateListEventKey = SupplierEventKeys.SUPPLIER_TABLE_UPDATE;

const methodData = ref({
  default_name: "",
  name_l10n: {},
  phone: "",
  is_active: true,
  code: null,
  sort: null,
  description: null,
});
const initialDetailData = ref(); // used to store the detail data on edit

// hooks
const isAllowedToSave = computed(() => {
  if (!props.id) return true;
  return props.id && props.allowToSave;
});

const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== methodData.value.is_active;
});

onMounted(async () => {
  if (props.id) {
    await getDeteail();
  }
});

// methods
const updateListByActiveState = (isActive) => {
  if (isActiveStateChangedOnEdit.value) {
    eventBus.emit(updateListEventKey, !isActive);
    emit("clearFetchedTab", !isActive);
    return;
  }
  eventBus.emit(updateListEventKey, isActive);
};

const onSave = async () => {
  loadingBtn.value = true;
  let res = "";
  if (props.id) {
    res = await suppliersStore.onSaveSupplierById(props.id, methodData.value);
  } else {
    res = await suppliersStore.onAddSupplier(methodData.value);
  }
  if (res !== "error") {
    updateListByActiveState(methodData.value.is_active);
    closeDialog();
  }
  loadingBtn.value = false;
};

const getDeteail = async () => {
  initialDetailData.value = await suppliersStore.getSupplierById(props.id);
  methodData.value = { ...initialDetailData.value };
};

const closeDialog = () => emit("closeDialog");
<\/script>
`;export{n as default};
