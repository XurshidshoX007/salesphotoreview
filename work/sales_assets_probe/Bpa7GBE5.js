const e=`<template>
  <div
    class="grid grid-cols-6 space-x-2 items-center py-3 px-5 border-t border-neutral-200 text-sm"
  >
    <div class="col-span-1">{{ data.product.name }}</div>
    <div class="col-span-1 flex items-center">
      <div class="cursor-pointer">
        <Checkbox
          :required="isRequiredToFill"
          :checked="detail.product_exists"
          @change="setProductExists"
        />
      </div>
    </div>
    <div
      v-if="detail.product_exists"
      class="col-span-4 grid grid-cols-12 space-x-4"
    >
      <div
        v-for="check in transformedCheckTypes"
        :key="check.check_type"
        class="col-span-3"
      >
        <d-input
          :disabled="check.disabled"
          :id="\`\${check.check_type}\`"
          :value="check.checked_count"
          type="number"
          :required="check.is_required"
          @change="setCheck(check.check_type, $event)"
        />
      </div>
    </div>
    <div v-else class="col-span-4">
      <dropdowns-by-filter-states
        :filter-states="reasonStates"
        @on-open-dropdown="onOpenDropdown"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, toRaw } from "vue";
import { useI18n } from "vue-i18n";
import { auditReasonsDropdownParams } from "~/variable/params";
import type {
  AuditProduct,
  AuditProductReq,
} from "~/interfaces/api/audit/audit-report/detail-models";
import type { ConstantModel } from "~/interfaces/api/constants/library-constants-model";

// props
interface Props {
  data: AuditProduct;
  itemReq: AuditProductReq;
  checkTypes: ConstantModel[];
  isRequiredToFill: boolean;
  isReasonRequired: boolean;
}
const props = defineProps<Props>();

// emits
const emit = defineEmits<{
  (e: "update:data", value: AuditProductReq): void;
}>();

// store
const visitDetailStore = useAuditReportDetailStore("main");
const { t } = useI18n();

const detail = computed(() => props.itemReq);

const transformedCheckTypes = computed(() => {
  return props.checkTypes.map((el) => {
    const found = props.data.checks.find((e) => e.check_type === el.id);
    if (found)
      return {
        ...found,
        disabled: false,
      };
    return {
      check_type: el.id,
      checked_count: null,
      is_required: false,
      disabled: true,
    };
  });
});

const reasonStates = computed(() => [
  {
    placeholder: t("column.reason"),
    key: "reasons",
    required: props.isReasonRequired,
    isSingleSelect: true,
    isFilter: true,

    get data() {
      return visitDetailStore.auditReasons;
    },

    get getSelectedData() {
      return detail.value.reason_id_arr?.[0];
    },

    set setSelectedData(value: string) {
      detail.value.reason_id_arr = [value];
    },
  },
]);

// methods
const setProductExists = (el: boolean) => {
  detail.value.product_exists = el;
};

const setCheck = (id: number, val: number) => {
  const foundInd = detail.value.checks.findIndex((e) => e.check_type === id);
  const item = { check_type: id, checked_count: val };

  if (foundInd > -1) detail.value.checks.splice(foundInd, 1, item);
  else detail.value.checks.push(item);
};

const onOpenDropdown = async (state: string) => {
  if (state === "reasons" && !visitDetailStore.auditReasons) {
    await getReasons();
  }
};

const getReasons = async () => {
  await visitDetailStore.getReasons(auditReasonsDropdownParams);
};
<\/script>
`;export{e as default};
