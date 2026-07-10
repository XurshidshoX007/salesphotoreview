const e=`<template>
  <div>
    <div class="table-content-container overflow-hidden">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="auditorClientProductReviewPositionColumn"
          :templates="auditReviewConfigStore.templatePosition"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="auditReviewConfigStore.templatePosition"
          :save-key="auditorClientProductReviewPositionColumn"
        />
        <search-input
          @change="auditReviewConfigStore.searchPosition"
          :value="auditReviewConfigStore.paramsPosition.search"
        />
        <RefreshBtn
          @click="refresh"
          :loading="auditReviewConfigStore.loadingPosition"
        />
      </div>
      <div class="table-content-body position-table">
        <data-table
          :headers="auditReviewConfigStore.templatePosition"
          :sorted="auditReviewConfigStore.paramsPosition.order_by"
          :loading="auditReviewConfigStore.loadingPosition"
          :is-empty="!auditReviewConfigStore.dataPosition?.length"
          :check="isTableAllChecked"
          :indeterminate="isTableIndeterminate"
          :stickyHeader="auditReviewConfigStore.dataPosition?.length > 10"
          class="table-content"
          @sort="auditReviewConfigStore.sortPositionData"
          @getAllId="getAllPositionId"
        >
          <template #body>
            <c-tr
              v-for="data in auditReviewConfigStore.dataPosition"
              :key="data.id"
              class="last:border-b-0"
            >
              <c-td-no-edit
                v-for="key in auditReviewConfigStore.templatePosition"
                :key="key.key"
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
import { auditorClientProductReviewPositionColumn } from "~/variable/column-constants";

//  props

const props = defineProps<{
  configId: string;
}>();

// Store
const auditReviewConfigStore = useAuditReviewConfigStore(
  "main" + props.configId
);

// hooks

onMounted(async () => {
  console.log("props.configId", props.configId);

  auditReviewConfigStore.paramsPosition!.config_id = props.configId;
});

onBeforeMount(() => clearCheckedItems());

watch(
  () => auditReviewConfigStore.dataPosition,
  () => {
    setDefaultAttachedCheck();
  }
);

const isTableAllChecked = computed(() => {
  if (!auditReviewConfigStore.dataPosition?.length) return false;
  return auditReviewConfigStore.dataPosition.every((item) =>
    auditReviewConfigStore.userIdArr.includes(item.id)
  );
});

const isTableIndeterminate = computed(() => {
  if (isTableAllChecked.value || !auditReviewConfigStore.dataPosition?.length)
    return false;
  return auditReviewConfigStore.dataPosition.some((item) =>
    auditReviewConfigStore.userIdArr.includes(item.id)
  );
});

// Methods
const onChangeTableHeaders = (param: Template[]) => {
  auditReviewConfigStore.templatePosition = param;
};

const getData = async () => {
  await auditReviewConfigStore.getClientProductReviewConfigUserList();
};

const refresh = async () => {
  await getData();
};

const setDefaultAttachedCheck = () => {
  const items = auditReviewConfigStore.dataPosition ?? [];
  auditReviewConfigStore.userIdArr = items
    .filter(({ is_attached_to_config }) => is_attached_to_config)
    .map(({ id }) => id);
};

const isTableChecked = (id: string) => {
  return auditReviewConfigStore.userIdArr.includes(id);
};

const onSelectExpeditor = (id: string, isChecked: boolean) => {
  auditReviewConfigStore.userIdArr = isChecked
    ? [...auditReviewConfigStore.userIdArr, id]
    : auditReviewConfigStore.userIdArr.filter((item) => item !== id);
};

const getAllPositionId = (check: boolean) => {
  auditReviewConfigStore.userIdArr = check
    ? auditReviewConfigStore.dataPosition.map((item) => item.id) || []
    : [];
};

const clearCheckedItems = () => {
  auditReviewConfigStore.userIdArr = [];
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
`;export{e as default};
