const n=`<template>
  <d-modal
    :name="t('audit.question_detail')"
    dataContainerWidth="800px"
    :loading="auditQuestionStore.loadingDetail"
    @close-dialog="closeDialog"
  >
    <flex-col class="page-gap">
      <div class="question-detail-container">
        <div class="section">
          <div class="key">{{ t("column.name") }}</div>
          <div class="value">
            {{ auditQuestionStore.detailData.name }}
          </div>
        </div>
        <div class="section">
          <div class="key">{{ t("labels.sort") }}</div>
          <div class="value">
            {{ getFormattedAmount(auditQuestionStore.detailData.sort) }}
          </div>
        </div>
        <div class="section">
          <div class="key">{{ t("active") }}</div>
          <div class="value">
            {{
              auditQuestionStore.detailData.is_active
                ? t("filters.yes")
                : t("filters.no")
            }}
          </div>
        </div>
        <div class="section">
          <div class="key">{{ t("audit.is_required_to_fill") }}</div>
          <div class="value">
            {{
              auditQuestionStore.detailData.is_required_to_fill
                ? t("filters.yes")
                : t("filters.no")
            }}
          </div>
        </div>
      </div>
      <flex-col v-if="!!getUserPositionsName.length" class="gap-3">
        <div class="fs-14">
          {{ t("audit.attached_users") }}
        </div>
        <show-more :data="getUserPositionsName" :show-count="2" />
      </flex-col>
      <flex-col
        v-if="!!auditQuestionStore?.detailData?.questions?.length"
        class="gap-3"
      >
        <div class="fs-14">
          {{ t("audit.polls") }}
        </div>
        <div class="table-content-container overflow-hidden">
          <div class="table-content-body position-table">
            <data-table
              :headers="auditQuestionStore.templatesQuestionDetail"
              :is-empty="!auditQuestionStore?.detailData?.questions?.length"
              withInformationAboveHeader
            >
              <template #body>
                <c-tr
                  v-for="(data, index) in auditQuestionStore?.detailData
                    ?.questions"
                  :key="data.id"
                  class="last:border-b-0"
                >
                  <c-td-no-edit
                    v-for="key in auditQuestionStore.templatesQuestionDetail"
                    :key="key"
                    :type="key.type"
                    :is-checked="key.checked"
                  >
                    <div v-if="key.key === 'field_type'">
                      {{ data[key.key]?.name }}
                    </div>
                    <div v-else-if="key.key === 'variants'">
                      <show-more :data="getVariantsName(data.variants)" />
                    </div>

                    <div v-else-if="key.type === 'boolean'">
                      <StatusBtnForTable
                        :status-data="
                          getStatusDataByRequiredField(data[key.key], key.key)
                        "
                        readonly
                      />
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
      </flex-col>
    </flex-col>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { VariantsModel } from "~/interfaces/api/audit/settings/question/question-model";

// store

const auditQuestionStore = useAuditQuestionStore("main");
//  props

const props = defineProps<{
  questionIdForDetail: string;
}>();

// states

const { t } = useI18n();

// emits
const emit = defineEmits(["closeDialog"]);

// hooks
const getUserPositionsName = computed(() => {
  return (
    auditQuestionStore.detailData?.user_positions?.map((item) => item.name) ||
    []
  );
});

onMounted(async () => {
  await auditQuestionStore.getQuestionFormDetailData(props.questionIdForDetail);
});

// methods

const getVariantsName = (data: VariantsModel[]) => {
  return data?.map((item) => item.variant_text);
};

const closeDialog = () => {
  emit("closeDialog");
};

const getStatusDataByRequiredField = (is_required: boolean, key: string) => {
  if (is_required) {
    return {
      hex_color: "#23C00A",
      name: key === "is_active" ? t("active") : t("filters.yes"),
      key: "active",
    };
  }
  return {
    hex_color: "#BD7F06",
    name: key === "is_active" ? t("not_active") : t("filters.no"),
    key: "no_active",
  };
};
<\/script>

<style scoped lang="scss">
.question-detail-container {
  border-radius: 12px;
  background: white;
  gap: 16px;
  width: 100%;

  .section {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e1e4e4;
    padding: 8px 0;
    gap: 16px;

    .key {
      font-family: "Inter", sans-serif;
      font-weight: 400;
      font-size: 14px;
      color: #8fa0a0;
    }

    .value {
      font-family: "Inter", sans-serif;
      font-weight: 500;
      font-size: 15px;
      color: #013636;
    }
  }
}
.position-table {
  padding-bottom: 0 !important;
  overflow: hidden;
}
</style>
`;export{n as default};
