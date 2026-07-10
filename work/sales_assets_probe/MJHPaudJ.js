const e=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="id ? t('edit') : t('clients.add')"
      :loading="auditProductReviewStore.loadingUpdate"
      @closeDialog="closeDialog"
    >
      <flex-col class="gap-5">
        <d-input
          type="text"
          :label="t('column.name')"
          :value="data.name"
          required
          @change="data.name = $event"
        />
        <DropdownsByFilterStates
          ref="DropdownComponent"
          :filter-states="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <!--        <Checkbox-->
        <!--          id="show_on_store_check_report"-->
        <!--          :title="t('audit.show_on_store_check_report')"-->
        <!--          :checked="data.show_on_store_check_report"-->
        <!--          @change="data.show_on_store_check_report = $event"-->
        <!--        />-->
        <Checkbox
          id="is_reason_required"
          :title="t('audit.is_reason_required')"
          :checked="data.is_reason_required"
          @change="data.is_reason_required = $event"
        />
        <Checkbox
          id="is_required_to_fill"
          :title="t('audit.is_required_to_fill')"
          :checked="data.is_required_to_fill"
          @change="data.is_required_to_fill = $event"
        />
        <page-title20 :title="t('audit.examination')" />
        <div
          v-for="(check, index) in auditProductReviewStore.dateTypes.items"
          :key="check.id"
          class="check-item"
        >
          <Checkbox
            :id="check.key"
            :title="check.name"
            :checked="isCheckSettingsType(check.id)"
            @change="changeCheckSettingsType(check.id, $event)"
          />
          <Checkbox
            v-if="isCheckSettingsType(check.id)"
            :id="check.key + index"
            :title="t('audit.required')"
            :checked="isCheckType(check.id)"
            @change="changeCheckType(check.id, $event)"
          />
        </div>

        <Switch :active="data.is_active" @change="onChangeActivity" />
      </flex-col>
      <template #footer>
        <m-btn :loading="isBtnLoading" class="w-full" type="submit">
          {{ !id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import type { DropdownsByFilterStates } from "#components";
import type { AuditorClientProductReviewSaveModel } from "~/interfaces/api/audit/settings/audit/audit-model";
import { AuditEventKeys } from "~/variable/event-key-constants";
import { useEventBus } from "~/composables/EventBus/eventBus";

// Store
const auditProductReviewStore = useAuditReviewConfigStore("main");

// props
const props = defineProps<{
  id?: string;
}>();

const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// State
const { t } = useI18n();
const isBtnLoading = ref(false);
const updateListEventKey = AuditEventKeys.AUDIT_TABLE_UPDATE;
const eventBus = useEventBus();

const data = ref<AuditorClientProductReviewSaveModel>({
  id: undefined,
  name: null,
  is_active: true,
  is_reason_required: false,
  is_required_to_fill: false,
  show_on_store_check_report: false,
  product_id_arr: [],
  concurrent_product_id_arr: [],
  check_settings: [],
});

const filterStates = ref<FilterStateModel[]>([
  {
    name: t("settings_sidebar.products"),
    key: "products",
    required: true,
    get data() {
      return auditProductReviewStore.products || [];
    },
    get getSelectedData() {
      return data.value.product_id_arr;
    },
    set setSelectedData(value: string[]) {
      data.value.product_id_arr = value;
    },
  },
  {
    name: t("audit.concurrent_products"),
    key: "concurrent_products",
    get data() {
      return auditProductReviewStore.concurrentProducts || [];
    },
    get getSelectedData() {
      return data.value.concurrent_product_id_arr;
    },
    set setSelectedData(value: string[]) {
      data.value.concurrent_product_id_arr = value;
    },
  },
]);

const initialDetailData = ref(); // used to store the detail data on edit

// hooks
onMounted(async () => {
  await auditProductReviewStore.getProductReviewCheckTypes();
});

onBeforeMount(async () => {
  if (props.id) {
    await getDetail();
  }
});

const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
});

// Methods
const updateListByActiveState = (isActive: boolean) => {
  if (isActiveStateChangedOnEdit.value) {
    eventBus.emit(updateListEventKey, !isActive);
    emit("clearFetchedTab", !isActive);
    return;
  }
  eventBus.emit(updateListEventKey, isActive);
};

const isCheckType = (id: number): boolean => {
  const found = data.value?.check_settings?.find(
    (item) => item.check_type === id,
  );
  return found?.is_required ?? false;
};

const isCheckSettingsType = (id: number): boolean => {
  const found = data.value?.check_settings?.find(
    (item) => item.check_type === id,
  );
  return found?.is_active;
};

const changeCheckType = (id: number, checked: boolean): void => {
  const settings = data.value?.check_settings;

  const found = settings.find((item) => item.check_type === id);

  if (found) {
    found.is_required = checked;
  }
};

const changeCheckSettingsType = (id: number, checked: boolean): void => {
  const settings = data.value?.check_settings;

  const found = settings.find((item) => item.check_type === id);

  if (found) {
    found.is_active = checked;
  } else {
    settings.push({
      check_type: id,
      is_active: checked,
      is_required: false,
    });
  }
};

const onOpenDropdown = async (state: string, value: unknown) => {
  if (state === "products" && !auditProductReviewStore.products) {
    await getProducts();
  }
  if (
    state === "concurrent_products" &&
    !auditProductReviewStore.concurrentProducts
  ) {
    await getConcurrentProducts();
  }
};

const getProducts = async () => {
  await auditProductReviewStore.getProducts();
};

const getConcurrentProducts = async () => {
  await auditProductReviewStore.getConcurrentProducts();
};

const save = async () => {
  isBtnLoading.value = true;

  try {
    const { value: currentData } = data;
    const payloadData = {
      ...currentData,
      check_settings:
        currentData.check_settings
          ?.filter((item) => item.is_active)
          .map(({ is_active, ...rest }) => rest) ?? [],
    };

    const res = await auditProductReviewStore.add(payloadData);

    if (res !== "error") {
      closeDialog();
      updateListByActiveState(currentData.is_active);
      notify({ title: t("save"), type: "success" });
    }
  } catch (error) {
    console.error("Save error:", error);
    notify({ title: t("error"), type: "error" });
  } finally {
    isBtnLoading.value = false;
  }
};

const getDetail = async () => {
  initialDetailData.value =
    await auditProductReviewStore.getAuditClientProductReviewDetail(props.id);
  data.value = { ...initialDetailData.value };
  data.value.check_settings = data.value.check_settings?.map((item) => {
    return { ...item, is_active: true };
  });
  await getProducts();
  await getConcurrentProducts();
};

const closeDialog = () => {
  emit("closeDialog");
  DropdownComponent.value!.onClearFilter();
};

const onChangeActivity = (isActive: boolean) => {
  data.value.is_active = isActive;
};
<\/script>

<style scoped lang="scss">
.check-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
`;export{e as default};
