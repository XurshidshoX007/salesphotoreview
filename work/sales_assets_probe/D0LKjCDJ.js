const n=`<template>
  <form @submit.prevent="onSave">
    <d-modal :name="modalNameByType" @closeDialog="closeDialog">
      <flex-col class="gap-4">
        <DropdownsByFilterStates
          :filter-states="reasonFilterStates"
          @on-open-dropdown="onOpenDropdown"
        />
        <d-input
          :label="t('labels.enter_comment')"
          :value="comment"
          pattern-type="comment"
          @change="comment = $event"
        />
      </flex-col>
      <template #footer>
        <m-btn :loading="isBtnLoading" type="submit" class="w-full">{{
          t("save")
        }}</m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { reasonDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import {
  cancelReasonsDropdownParams,
  returnReasonsDropdownParams,
} from "~/variable/params";
import type { DropdownModel } from "~/interfaces/dropdown-model";

// props
const props = defineProps<{
  type: "return" | "cancel";
  isBtnLoading?: boolean;
}>();

// emits
const emit = defineEmits(["onSave", "closeDialog"]);

// store
const orderStore = useOrdersStore("main");

// state
const { t } = useI18n();
const comment = ref<string>("");
const reasons = ref<DropdownItemsModelByType<DropdownModel>>();
const selectedReasonId = ref<string>("");

const reasonFilterStates = ref([
  {
    get name() {
      return getNameByType();
    },
    key: "reasons",
    isSingleSelect: true,
    required: true,
    get data() {
      return reasons.value || [];
    },
    get getSelectedData() {
      return selectedReasonId.value || "";
    },
    set setSelectedData(value: string) {
      selectedReasonId.value = value;
    },
  },
]);

// hooks
const modalNameByType = computed(() => {
  return props.type === "return"
    ? t("orders.return_order")
    : t("orders.cancel_order");
});

const reasonsParams = computed((): reasonDropdownParamsType | undefined => {
  switch (props.type) {
    case "return":
      return returnReasonsDropdownParams;
    case "cancel":
      return cancelReasonsDropdownParams;
    default:
      return undefined;
  }
});

// methods
const getNameByType = () => {
  switch (props.type) {
    case "return":
      return t("orders.return_order");
    case "cancel":
      return t("orders.reason_of_cancelation");
    default:
      return "";
  }
};

const onSave = () => {
  emit("onSave", { comment: comment.value, reasonId: selectedReasonId.value });
};

const closeDialog = () => {
  emit("closeDialog");
};

const onOpenDropdown = async (state: string, value: unknown) => {
  if (state === "reasons" && !reasons.value) {
    await getReasons();
  }
};

const getReasons = async () => {
  if (!reasonsParams.value) return;
  const data = await orderStore.getReasons(reasonsParams.value);
  reasons.value = data;
};
<\/script>
`;export{n as default};
