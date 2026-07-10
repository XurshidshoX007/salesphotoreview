const n=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header justify-between">
        <page-title :title="t('clients.list_of_clients')" />
        <div class="table-content-btn-group">
          <m-btn
            v-if="hasAccess2ImportClientExcelUpdate"
            group="border"
            class="w-full sm:w-fit"
            textCenter
            @click="onOpenUpdateExcelDialog"
          >
            <IconDownload />
            {{ t("clients.updating_clients_with_excel") }}
          </m-btn>
          <m-btn
            v-if="hasAccess2ImportClientExcel"
            group="border"
            class="w-full sm:w-fit"
            textCenter
            @click="onOpenImportsDialog"
          >
            <IconDownload />
            {{ t("clients.import") }}
          </m-btn>

          <DropdownMenu
            v-if="isGroupProcessBtn"
            :options="filteredGroupProcess"
            value-key="url"
            label-key="name"
            :content-width="500"
            @select="(option) => onSwitchToProcessMenu(option?.url)"
          >
            <template #trigger>
              <m-btn group="border" class="w-full sm:w-fit" textCenter>
                <IconFrame result />
                {{ t("clients.group_processing") }}
              </m-btn>
            </template>
          </DropdownMenu>
        </div>
      </div>
      <div class="table-content-header border-t-1">
        <table-sort-columns
          :save-key="clientsHeader"
          :templates="clientStore.templates"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="clientStore.templates"
          :save-key="clientsHeader"
        />
        <page-size-btn
          :current-size="clientStore.params.page_size"
          :total-count="clientStore?.data?.total_count"
          :page-number="clientStore?.data?.page_number"
          @setPageSize="clientStore.setPageSize"
        />
        <search-input
          @change="clientStore.search"
          :value="clientStore.params.search"
        />
        <excel-btn
          @click="clientStore.onDownloadExcelFile"
          :loading="clientStore.isExcelFileDownloading"
        />
        <RefreshBtn
          @click="refresh"
          :loading="clientStore.isDataTableLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="clientStore.templates"
          :loading="clientStore.isDataTableLoading"
          :isEmpty="!clientStore.data?.items?.length"
          :check="isTableAllChecked"
          :indeterminate="isTableIndeterminate"
          :sorted="clientStore.params.order_by"
          @sort="clientStore.sortData"
          @getAllId="getAllClientsId"
        >
          <template #body>
            <template
              v-for="(data, index) in clientStore.data?.items"
              :key="index"
            >
              <c-tr>
                <c-td-no-edit
                  v-for="key in clientStore.templates"
                  :key="key.key"
                  :is-checked="key.checked"
                  :type="key.type"
                >
                  <div v-if="key.key === 'checkbox'">
                    <Checkbox
                      :id="data.id"
                      :checked="isTableChecked(data.id)"
                      @change="onSelectAgent(data.id)"
                    />
                  </div>
                  <div v-if="key.type === 'linkable'">
                    <link-component
                      :value="data[key.key]"
                      :to="\`/clients/about-clients/\${data.id}\`"
                      :is-linkable="allowToDetail"
                    />
                  </div>
                  <div v-else-if="key.key === 'lat_lng' && data[key.key]">
                    <rounded-icon-btn
                      icon-file-name="Location"
                      type="outlined"
                      @click="
                        locationFunction(
                          data[key.key].latitude,
                          data[key.key].longitude,
                        )
                      "
                    />
                  </div>
                  <div v-else-if="key.type === 'array'">
                    <show-more :show-count="2" :data="data[key.key] || []" />
                  </div>
                  <div v-else-if="key.type?.includes('.name')">
                    {{ data[key.key]?.name }}
                  </div>
                  <div v-else-if="key.key === 'balance'">
                    {{ getFormattedAmount(data["balance"]?.amount) }}
                  </div>

                  <div v-else-if="key.type === 'date'">
                    {{ getFormattedDate(data[key.key]) }}
                  </div>
                  <div v-else-if="key.type === 'boolean'">
                    {{ data[key.key] ? "Есть" : "Нет" }}
                  </div>
                  <div v-else-if="key.checked && key.key === 'agents_name'">
                    <tags-component :data="data['agent_arr']" />
                  </div>
                  <div v-else-if="key.key === 'is_active'">
                    {{ data[key.key] ? t("active") : t("not_active") }}
                  </div>
                  <div
                    v-else-if="allowToUpdate && key.key === 'action'"
                    :key="index"
                  >
                    <rounded-icon-btn
                      type="edit"
                      :iconSize="20"
                      @click="editClient(data.id)"
                    />
                  </div>
                  <div
                    v-else-if="
                      key.key === 'MFO' ||
                      key.key === 'OKED' ||
                      key.key === 'JSHSHIR' ||
                      key.key === 'INN'
                    "
                  >
                    {{ data[key.key.toLowerCase()] }}
                  </div>
                  <div v-else-if="key.key === 'code'">
                    <LinkComponent :value="data[key.key]" :is-linkable="true" />
                  </div>
                  <div v-else-if="key.isDynamic && key.dynamicConfig">
                    {{ getDynamicValue(data, key.dynamicConfig) }}
                  </div>
                  <div v-else>
                    {{ data[key.key] }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </template>
        </data-table>
      </div>
      <div class="table-content-footer">
        <curren-page-btn
          :current-size="clientStore.params.page_size"
          :total-count="clientStore?.data?.total_count"
          :page-number="clientStore?.data?.page_number"
        />
        <page-index
          :available-pages="clientStore.data?.total_pages"
          :current-page="clientStore.data?.page_number"
          @setPage="clientStore.setPage"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="locationData">
        <lazy-clients-equipment-location
          :location="locationData"
          @closeDialog="locationData = ''"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="excelDialog">
        <ClientsClientsClientImportDialog @close-dialog="excelDialog = false" />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="excelUpdateDialog">
        <ClientsClientsClientUpdateExcelDialog
          @close-dialog="excelUpdateDialog = false"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="clientStore.clientExcelErrorData">
        <ClientsClientsClientExcelErrorDialog
          @close-dialog="closeExcelErrorDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="clientStore.isSaveExcelConfirm">
        <ClientsClientsConfirmModal
          :title="
            (excelDialog && t('clients.added_clients')) ||
            t('clients.updates_clients')
          "
          @closeDialog="closeDialog"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { useI18n } from "vue-i18n";
import { useClientsAccess } from "~/composables/access/clients/clients";
import { notify } from "@kyvg/vue3-notification";
import { clientsHeader } from "~/variable/column-constants";
import {
  getDynamicValue,
  getFormattedDate,
  getFormattedAmount,
} from "#imports";

// store
const clientStore = useClientsStore("main");

// props
const props = defineProps({
  allowToDetail: Boolean,
  allowToUpdate: Boolean,
});

// State
const { t } = useI18n();
const router = useRouter();
const locationData = ref<{ latitude: number; longitude: number } | null>(null);
const excelDialog = ref<boolean>(false);
const excelUpdateDialog = ref<boolean>(false);

// accesses
const {
  hasAccess2Consignation,
  hasAccess2ImportClientExcel,
  // group-proccess
  hasAccess2BatchUpdateSalesChannel,
  hasAccess2BatchUpdateCategoryAndTerritory,
  hasAccess2BatchUpdateCanOrerInDebt,
  hasAccess2ImportClientExcelUpdate,
} = useClientsAccess();

const groupProcess = ref([
  // {
  //   name: t("clients.attach_agents"),
  //   url: "/clients/group-process/unpin-agents",
  //   get hasAccess() {
  //     return hasAccess2BatchAttachUnattachAgents.value;
  //   },
  // },
  // {
  //   name: t("clients.attach_forwarder"),
  //   url: "/clients/group-process/unpin-expeditor",
  //   get hasAccess() {
  //     return hasAccess2BatchAttachUnattachExpeditors.value;
  //   },
  // },
  // {
  //   name: "Отметить для аудита",
  //   url: "/clients/group-process/mark-audit",
  // },
  // {
  //   name: "Прикперление и открепление аудиторов к клиентам",
  //   url: "/clients/group-process/attaching-auditor-client",
  //   get hasAccess() {
  //     return hasAccess2BatchAttachUnattachAuditors.value;
  //   },
  // },
  {
    name: t("settings_sidebar.sales_channel"),
    url: "/clients/group-process/sales-channel",
    get hasAccess() {
      return hasAccess2BatchUpdateSalesChannel.value;
    },
  },
  {
    name: t("clients.attach_territory"),
    url: "/clients/group-process/change-territory-category",
    get hasAccess() {
      return hasAccess2BatchUpdateCategoryAndTerritory.value;
    },
  },
  // {
  //   name: "RLP Bonus.",
  //   url: "/clients/group-process/rlp-bonus",
  // },
  {
    name: t("column.order_if_debt"),
    url: "/clients/group-process/order-case-debt",
    get hasAccess() {
      return hasAccess2BatchUpdateCanOrerInDebt.value;
    },
  },
  // {
  //   name: t("clients.attach_price_type"),
  //   url: "/clients/group-process/attach-price-type",
  //   get hasAccess() {
  //     return hasAccess2BatchUpdatePriceType.value;
  //   },
  // },
]);

// hooks
const isGroupProcessBtn = computed(() => {
  return (
    hasAccess2BatchUpdateCanOrerInDebt.value ||
    hasAccess2BatchUpdateCategoryAndTerritory.value ||
    hasAccess2BatchUpdateSalesChannel.value
  );
});

const isTableAllChecked = computed(() => {
  if (!clientStore.data?.items.length) return false;
  return clientStore.data?.items.every((item) =>
    clientStore.clientsIds.includes(item.id),
  );
});

const isTableIndeterminate = computed(() => {
  if (isTableAllChecked.value || !clientStore.data?.items.length) return false;
  return clientStore.data?.items.some((item) =>
    clientStore.clientsIds.includes(item.id),
  );
});

const filteredGroupProcess = computed(() => {
  return groupProcess.value.filter((item) => item.hasAccess !== false);
});

// Methods

const onChangeTableHeaders = (param: Template[]) => {
  clientStore.templates = param;
};

const editClient = (id: string) => {
  router.push({ path: "/clients/clients/create-clients", query: { id: id } });
};

const getAllClientsId = (check: boolean) => {
  if (!check) {
    clientStore.setNullMultipleDialog();
  } else {
    clientStore.clientsIds = clientStore.data?.items.map((agent) => agent.id);
  }
};

const isTableChecked = (clientId: string) => {
  return !!clientStore.clientsIds.find((id) => clientId === id);
};

const onSelectAgent = (clientId: string) => {
  if (!isTableChecked(clientId)) {
    clientStore.clientsIds.push(clientId);
  } else {
    clientStore.clientsIds = clientStore.clientsIds.filter(
      (id) => id !== clientId,
    );
  }
};

const refresh = () => {
  clientStore.refresh();
};

const locationFunction = (
  latitude: number | null,
  longitude: number | null,
) => {
  locationData.value = {
    latitude: latitude,
    longitude: longitude,
  };
};

const onSwitchToProcessMenu = (url: string) => {
  if (!clientStore.clientsIds.length) {
    notify({ title: t("first_select_client"), type: "error" });
    return;
  } else {
    router.push(url);
  }
};

const onOpenImportsDialog = () => {
  excelDialog.value = true;
};

const onOpenUpdateExcelDialog = () => {
  excelUpdateDialog.value = true;
};

const closeDialog = () => {
  clientStore.isSaveExcelConfirm = false;
  excelDialog.value = false;
};

const closeExcelErrorDialog = () => {
  clientStore.clientExcelErrorData = null;
};
<\/script>

<style scoped lang="scss">
.card-shadow {
  position: absolute;
  top: 50px;
  z-index: 50;
  background-color: white;
  border-radius: 8px;
  right: 0;
  overflow: hidden;
  box-shadow: 0px 4px 18px 0px #00000014;

  .card-item {
    cursor: pointer;
    border-bottom: 1px solid #e1e4e4;
    padding: 8px;
    font-size: 14px;
    font-family: "Inter", sans-serif;
    font-weight: 400;
    color: #424f4f;
  }

  .card-item:hover {
    background-color: #f1fefe;
  }

  .card-item:last-child {
    border-bottom: none;
  }
}
</style>
`;export{n as default};
