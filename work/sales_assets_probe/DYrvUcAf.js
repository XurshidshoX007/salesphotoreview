const e=`<template>
  <d-modal
    :name="hasErrorData ? errorData?.Messages[0] : t('error')"
    :data-container-width="hasErrorData ? '1200px' : '400px'"
    only-close-dialog
    @closeDialog="closeDialog"
  >
    <div v-if="hasErrorData">
      <div class="table-content-container info-table-body">
        <div class="table-content-body info-table">
          <data-table :is-empty="!errorData?.ErrorData?.length">
            <template #header>
              <c-tr class="bg-[#FAFDFD]">
                <c-td-no-edit
                  v-for="key in templates"
                  :key="key.key"
                  :is-checked="key.checked"
                  :class="[
                    key?.right && 'text-end',
                    key?.borderX && 'border-r-1',
                  ]"
                >
                  {{ key.name }}
                </c-td-no-edit>
              </c-tr>
            </template>
            <template #body>
              <c-tr v-for="data in errorData?.ErrorData" :key="data">
                <c-td-no-edit
                  v-for="key in templates"
                  :key="key"
                  :is-checked="key.checked"
                  :type="key.type"
                  :class="key?.borderX && 'border-r-1'"
                >
                  <div
                    v-if="typeof data[key.key] === 'number'"
                    class="text-end"
                  >
                    {{ getFormattedAmount(data[key.key]) }}
                  </div>
                  <div
                    v-else-if="
                      key.key === 'Product' ||
                      key.key === 'ReplacementProductGroup' ||
                      key.key === 'PriceType'
                    "
                  >
                    {{ data[key.key]?.Name }}
                  </div>
                  <div v-else>
                    {{ data[key.key] }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </data-table>
        </div>
      </div>
    </div>
    <div v-else class="fs-14">
      {{ errorData.Messages?.join(", ") }}
    </div>
  </d-modal>
</template>

<script setup lang="ts">
// props
import type { ProductPriceErrorModel } from "~/interfaces/api/settings/product-price-error-model";
import type { Ref } from "vue";
import { ref } from "vue";
import type { Template } from "~/interfaces/ui/template";
import { useI18n } from "vue-i18n";
import { ErrorCode } from "~/variable/error-code-contants";

const props = defineProps<{
  errorData: {
    Messages: string[];
    ErrorData: ProductPriceErrorModel[];
    ErrorCode: number;
  };
  isRequiredPrice?: boolean;
  forPriceEdit?: boolean;
  forSettingsPrice: boolean;
}>();

// state
const { t } = useI18n();

const templates: Ref<Template[]> = ref([
  {
    name: t("labels.product_name"),
    key: "Product",
    is_sortable: false,
    checked: true,
    borderX: true,
  },
  {
    name: t("settings_sidebar.price_type"),
    key: "PriceType",
    is_sortable: false,
    checked: true,
    borderX: true,
  },
  {
    name: t("column.price_you_entered"),
    key: "Price",
    type: "come",
    checked: true,
    right: true,
    borderX: true,
  },
  {
    name: t("column.required_price"),
    key: "RequiredPrice",
    type: "come",
    checked: true,
    right: true,
  },
]);

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// methods

const closeDialog = () => {
  emit("closeDialog");
};

// hooks

const hasErrorData = computed(() => {
  return (
    props.errorData?.ErrorCode ===
    ErrorCode.ReplacementProductPricesDifferFromOneAnother
  );
});

const updateTemplates = () => {
  templates.value = templates.value.map((template) => {
    if (template.key === "Price") {
      return {
        ...template,
        borderX: props.isRequiredPrice,
        name: !props.forPriceEdit ? t("column.price") : template.name,
      };
    }

    if (template.key === "RequiredPrice") {
      return {
        ...template,
        checked: props.isRequiredPrice,
        name: !props.forPriceEdit
          ? t("column.price_required_to_add_product_to_group")
          : template.name,
      };
    }

    return template;
  });

  if (props.forSettingsPrice) {
    const replacementObj = {
      name: t("column.replacement_product_group"),
      key: "ReplacementProductGroup",
      type: "come",
      checked: true,
      borderX: true,
    };

    const insertIndex = Math.max(templates.value.length - 1, 0);
    templates.value.splice(insertIndex, 0, replacementObj);
  }
};

onMounted(() => {
  updateTemplates();
});

watch(
  () => props.isRequiredPrice,
  () => {
    updateTemplates();
  },
);
<\/script>

<style lang="scss">
.info-table-body {
  padding-bottom: 0 !important;
  overflow: hidden;
}

.info-table {
  padding-bottom: 0 !important;
  border-radius: 8px !important;
  overflow: hidden;

  thead {
    tr {
      border-top: none !important;
      position: sticky !important;
      top: 0;
      left: 0;
    }
  }
  tbody {
    tr {
      border-bottom: none !important;
    }
  }
}
</style>
`;export{e as default};
