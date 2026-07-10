const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <div class="table-content-btn-group">
        <TableSortColumns
          :templates="headers"
          :save-key="clientsDuplicationHeader(props.type)"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="headers"
          :save-key="clientsDuplicationHeader(props.type)"
        />
        <PageSizeBtn
          :current-size="clientsDuplicationStore[props.type].params.page_size"
          :total-count="clientsDuplicationStore[props.type].data?.total_count"
          :page-number="clientsDuplicationStore[props.type].data?.page_number"
          @setPageSize="clientsDuplicationStore[props.type].setPageSize"
        />
        <SearchInput
          :value="clientsDuplicationStore[props.type].params.search"
          @change="clientsDuplicationStore[props.type].search"
        />
        <RefreshBtn
          :loading="clientsDuplicationStore[props.type].isLoading"
          @click="clientsDuplicationStore[props.type].refresh"
        />
      </div>
    </div>
    <div class="table-content-body">
      <DataTable
        :headers="headers"
        :sorted="clientsDuplicationStore[props.type].params.order_by"
        :loading="clientsDuplicationStore[props.type].isLoading"
        :is-empty="!clientsDuplicationStore[props.type].data?.items.length"
        @sort="clientsDuplicationStore[props.type].sortData"
      >
        <template #body>
          <c-tr
            v-for="item in clientsDuplicationStore[props.type].data?.items"
            :key="getKey(item)"
          >
            <c-td-no-edit
              v-for="column in headers"
              :key="column.key"
              :type="column.type"
              :is-checked="column.checked"
            >
              <template v-if="column.type === 'badge'">
                <Tag
                  variant="outlined"
                  color="primary"
                  :class="cn({ 'cursor-pointer': hasAccess2MergeDuplicates })"
                  @click="handleOpenDuplicationsMerge(item)"
                >
                  <template #prefix>
                    <IconShop size="16" />
                  </template>
                  {{ getDataValue(item, column.key) }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'not_merged_count'">
                <Tag variant="outlined" color="danger">
                  <template #prefix>
                    <IconShop size="16" />
                  </template>
                  {{
                    (item as ClientDuplicationDraftListItemModel)
                      .not_merged_count
                  }}
                </Tag>
              </template>
              <TagList v-else-if="column.key === 'agent_names'">
                <Tag
                  v-for="value in (
                    item as ClientsDuplicationByLocationListItemModel
                  ).agent_names"
                >
                  {{ value }}
                </Tag>
              </TagList>
              <template v-else-if="column.key === 'client'">
                <template
                  v-if="props.type === CLIENT_DUPLICATION_TAB_TYPES.MERGED"
                >
                  <link-component
                    :value="
                      getDataValue(
                        item,
                        column.accessorKey || column.key,
                        column.type
                      )
                    "
                    :to="\`\${AppRoutes.clients.child.duplication}/\${(item as ClientDuplicationMergedListItemModel).id}\`"
                    non-copyable
                  />
                </template>
                <template v-else>
                  {{
                    getDataValue(
                      item,
                      column.accessorKey || column.key,
                      column.type
                    )
                  }}
                </template>
              </template>
              <template
                v-else-if="
                  column.key === 'created_date' &&
                  props.type === CLIENT_DUPLICATION_TAB_TYPES.DRAFT
                "
              >
                <div
                  :class="
                    cn(
                      hasAccess2MergeDuplicates &&
                        'text-primary-600 hover:underline cursor-pointer'
                    )
                  "
                  @click="handleOpenDuplicationsMerge(item)"
                >
                  {{
                    getFormattedDate(
                      (item as ClientDuplicationDraftListItemModel).created_date
                    )
                  }}
                </div>
              </template>
              <div v-else-if="column.key === 'action'">
                <rounded-icon-btn
                  type="danger"
                  :tooltip="t('deleted')"
                  @click="
                    deleteDialogId = (
                      item as ClientDuplicationDraftListItemModel
                    ).id
                  "
                />
              </div>
              <template v-else>
                {{
                  getDataValue(
                    item,
                    column.accessorKey || column.key,
                    column.type
                  )
                }}
              </template>
            </c-td-no-edit>
          </c-tr>
        </template>
      </DataTable>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="clientsDuplicationStore[props.type].params?.page_size"
        :page-number="clientsDuplicationStore[props.type]?.data?.page_number"
        :total-count="clientsDuplicationStore[props.type]?.data?.total_count"
      />
      <page-index
        :available-pages="
          clientsDuplicationStore[props.type]?.data?.total_pages
        "
        :current-page="clientsDuplicationStore[props.type]?.data?.page_number"
        @setPage="clientsDuplicationStore[props.type].setPage"
      />
    </div>

    <transition name="modal">
      <div v-if="deleteDialogId">
        <CommonDeletedDialog
          :isLoading="isDeleteLoading"
          @onSelectExit="deleteDialogId = null"
          @onSelectDelete="deleteDraftMerge"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { clientsDuplicationHeader } from "~/variable/column-constants";
import {
  getDataValue,
  getFormattedDate,
  type ClientsDuplicationByFieldsType,
  type Template,
  cn,
} from "#imports";
import { CLIENT_DUPLICATION_TAB_TYPES } from "~/variable/static-constants";
import type {
  ClientDuplicationDraftListItemModel,
  ClientDuplicationMergedListItemModel,
  ClientsDuplicationByLocationListItemModel,
} from "~/interfaces/api/clients/clients-duplication-model";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { ClientEventKeys } from "~/variable/event-key-constants";
import { clientDuplicationColumnFieldMap } from "~/stores/clients/duplication/clients-duplication.store";
import { AppRoutes } from "~/variable/routes";
import { useClientsAccess } from "~/composables/access/clients/clients";
import { useI18n } from "vue-i18n";
import { notify } from "@kyvg/vue3-notification";

type Props = {
  type: ClientsDuplicationTabType;
  isActive: boolean;
};

// Props
const props = defineProps<Props>();

// Constants
const updateListEventKey = ClientEventKeys.CLIENT_DUPLICATION_TABLE_UPDATE;

// Stores
const clientsDuplicationStore = useClientDuplicationStore();

// Composables
const eventBus = useEventBus();
const router = useRouter();
const { t } = useI18n();

// Access
const { hasAccess2MergeDuplicates } = useClientsAccess();

// States
const { isActive } = toRefs(props);

const isRefreshData = ref(true);
const deleteDialogId = ref<string | null>(null);
const isDeleteLoading = ref(false);

// Methods
const onChangeTableHeaders = (headers: Template[]) => {
  clientsDuplicationStore[props.type].templates = headers;
};

const getKey = (
  item:
    | ClientsDuplicationByFieldsListItemModel
    | ClientsDuplicationByLocationListItemModel
    | ClientDuplicationDraftListItemModel
    | ClientDuplicationMergedListItemModel
): string => {
  return "client_ids" in item ? item.client_ids[0] : item.id;
};

const getData = () => clientsDuplicationStore[props.type].getData();

const handleOpenDuplicationsMerge = (item: unknown) => {
  switch (props.type) {
    case CLIENT_DUPLICATION_TAB_TYPES.BY_FIELDS:
    case CLIENT_DUPLICATION_TAB_TYPES.BY_LOCATION: {
      if (!hasAccess2MergeDuplicates) return;

      const row = item as
        | ClientsDuplicationByFieldsListItemModel
        | ClientsDuplicationByLocationListItemModel;

      router.push({
        path: AppRoutes.clients.child.duplicationMerge,
        state: {
          clientIds: [...row.client_ids],
          fromTab: props.type,
        },
      });
      break;
    }
    case CLIENT_DUPLICATION_TAB_TYPES.DRAFT: {
      if (!hasAccess2MergeDuplicates) return;

      const row = item as ClientDuplicationDraftListItemModel;

      router.push(\`\${AppRoutes.clients.child.duplicationMerge}/\${row.id}\`);
      break;
    }
    case CLIENT_DUPLICATION_TAB_TYPES.MERGED: {
      const row = item as ClientDuplicationMergedListItemModel;

      router.push({
        path: \`\${AppRoutes.clients.child.duplication}/\${row.id}\`,
      });
      break;
    }
  }
};

const handleUpdateList = async () => {
  if (props.isActive) {
    await getData();
    return;
  }
  isRefreshData.value = true;
};

const deleteDraftMerge = async () => {
  if (
    !deleteDialogId.value ||
    props.type !== CLIENT_DUPLICATION_TAB_TYPES.DRAFT
  )
    return;

  isDeleteLoading.value = true;

  try {
    await clientsDuplicationStore[props.type].deleteDraftMerge(
      deleteDialogId.value
    );

    notify({ title: t("successful"), type: "success" });
    await clientsDuplicationStore[props.type].refresh();
  } catch (error) {
    console.error(error);
    notify({ type: "error", title: t("error") });
  } finally {
    isDeleteLoading.value = false;
    deleteDialogId.value = null;
  }
};

// Hooks
eventBus.on(updateListEventKey, handleUpdateList);

onBeforeUnmount(() => {
  eventBus.off(updateListEventKey, handleUpdateList);
});

watch(
  isActive,
  async (newValue) => {
    if (newValue && isRefreshData.value) {
      isRefreshData.value = false;

      await getData();
    }
  },
  { immediate: true }
);

const headers = computed(() => {
  switch (props.type) {
    case CLIENT_DUPLICATION_TAB_TYPES.BY_FIELDS: {
      return clientsDuplicationStore.by_fields.templates.filter((column) => {
        const columnKey = column.key as ClientsDuplicationByFieldsType;
        const fieldKey = clientDuplicationColumnFieldMap[columnKey];

        return (
          !fieldKey ||
          clientsDuplicationStore.additinalParams.by_fields.by_fields.includes(
            fieldKey
          )
        );
      });
    }
    default:
      return clientsDuplicationStore[props.type].templates;
  }
});
<\/script>
`;export{e as default};
