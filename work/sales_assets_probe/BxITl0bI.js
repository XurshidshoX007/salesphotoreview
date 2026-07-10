const n=`<template>
  <div>
    <div class="table-content-container overflow-hidden">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="questionsFormPositionColumn"
          :templates="auditQuestionStore.templatesPosition"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="auditQuestionStore.templatesPosition"
          :save-key="questionsFormPositionColumn"
        />
        <search-input
          @change="auditQuestionStore.searchPosition"
          :value="auditQuestionStore.paramsPosition.search"
        />
        <RefreshBtn
          @click="refresh"
          :loading="auditQuestionStore.loadingPosition"
        />
      </div>
      <div class="table-content-body position-table">
        <data-table
          :headers="auditQuestionStore.templatesPosition"
          :sorted="auditQuestionStore.paramsPosition.order_by"
          :loading="auditQuestionStore.loadingPosition"
          :is-empty="!auditQuestionStore.dataPositon?.length"
          :check="isTableAllChecked"
          class="table-content"
          :stickyHeader="auditQuestionStore.dataPositon?.length > 10"
          :indeterminate="isTableIndeterminate"
          @sort="auditQuestionStore.sortPositionData"
          @getAllId="getAllPositionId"
        >
          <template #body>
            <c-tr
              v-for="data in auditQuestionStore.dataPositon"
              :key="data"
              class="last:border-b-0"
            >
              <c-td-no-edit
                v-for="key in auditQuestionStore.templatesPosition"
                :key="key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <Checkbox
                  v-if="key.type === 'checkbox'"
                  :id="data.id"
                  :checked="isTableChecked(data.id)"
                  @change="onSelectExpeditor(data.id, $event)"
                />
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
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { questionsFormPositionColumn } from "~/variable/column-constants";
import { useI18n } from "vue-i18n";

// Store
const { t } = useI18n();
const auditQuestionStore = useAuditQuestionStore("main");

//  props

const props = defineProps<{
  questionFormId: string;
}>();

// hooks

onMounted(async () => {
  auditQuestionStore.paramsPosition!.question_form_id = props.questionFormId;
  setDefaultAttachedCheck();
});

watch(
  () => auditQuestionStore.dataPositon,
  () => {
    setDefaultAttachedCheck();
  }
);

const isTableAllChecked = computed(() => {
  if (!auditQuestionStore.dataPositon?.length) return false;
  return auditQuestionStore.dataPositon?.every((item) =>
    auditQuestionStore.userIdArr.includes(item.id)
  );
});

const isTableIndeterminate = computed(() => {
  if (isTableAllChecked.value || !auditQuestionStore.dataPositon?.length)
    return false;
  return auditQuestionStore.dataPositon?.some((item) =>
    auditQuestionStore.userIdArr.includes(item.id)
  );
});
// Methods
const setDefaultAttachedCheck = () => {
  const items = auditQuestionStore.dataPositon ?? [];
  auditQuestionStore.userIdArr = items
    .filter(({ is_attached_question_form }) => is_attached_question_form)
    .map(({ id }) => id);
};

const onChangeTableHeaders = (param: Template[]) => {
  auditQuestionStore.templates = param;
};

const refresh = async () => {
  await auditQuestionStore.getQuestionPositionData();
};

const isTableChecked = (id: string) =>
  auditQuestionStore.userIdArr.includes(id);

const onSelectExpeditor = (id: string, isChecked: boolean) => {
  auditQuestionStore.userIdArr = isChecked
    ? [...auditQuestionStore.userIdArr, id]
    : auditQuestionStore.userIdArr.filter((item) => item !== id);
};

const getAllPositionId = (check: boolean) => {
  auditQuestionStore.userIdArr = check
    ? auditQuestionStore.dataPositon?.map((item) => item.id) || []
    : [];
};
<\/script>

<style scoped>
.table-content {
  max-height: calc(100vh - 400px);
  overflow: auto;
}

.position-table {
  padding-bottom: 0 !important;
  overflow: hidden;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
  margin-top: 1px;
  margin-bottom: 3px;
  border-radius: 0;
  border-left: 1px solid #e1e4e4;
  border-top: 1px solid #e1e4e4;
}

::-webkit-scrollbar-thumb {
  border-radius: 0;
}
</style>
`;export{n as default};
