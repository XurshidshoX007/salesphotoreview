const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="equipmentsHistoryHeader"
          :templates="equipmentStore.headers"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="equipmentStore.headersHistory"
          :save-key="equipmentsHistoryHeader"
        />
        <page-size-btn
          :current-size="equipmentStore.historyListParams.page_size"
          @setPageSize="equipmentStore.setPageSizeHistory"
        />
        <search-input @change="equipmentStore.searchFromHistoryList" />
        <excel-btn
          @click="equipmentStore.onDownloadExcelFileHistory"
          :loading="equipmentStore.isExcelFileDownloading"
        />
        <RefreshBtn
          @click="refresh"
          :loading="equipmentStore.isHistoryListDataLoading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="equipmentStore.headersHistory"
          @sort="equipmentStore.sortHistoryListData"
          :sorted="equipmentStore.historyListParams.order_by"
          :isEmpty="!equipmentStore.historyListData?.items?.length"
          :loading="equipmentStore.isHistoryListDataLoading"
        >
          <template #body>
            <template
              v-for="data in equipmentStore.historyListData?.items"
              :key="data.id"
            >
              <c-tr>
                <c-td-no-edit
                  v-for="key in equipmentStore.headersHistory"
                  :key="key"
                  :is-checked="key.checked"
                  :type="key.type"
                >
                  <div v-if="key.type === 'location' && data[key.key]">
                    <rounded-icon-btn
                      icon-file-name="Location"
                      type="outlined"
                      @click="locationFunction(data.latitude, data.longitude)"
                    />
                  </div>
                  <div v-else-if="key.key === 'agent_arr'">
                    <show-more
                      :show-count="2"
                      :data="convertToArr(data[key.key])"
                    />
                  </div>
                  <div v-else-if="key.key === 'client_name'">
                    <link-component
                      :value="data[key.key]"
                      :to="\`/clients/about-clients/\${data.client_id}\`"
                    />
                  </div>
                  <div
                    v-else-if="key.type === 'action'"
                    class="flex items-center gap-x-3"
                  >
                    <rounded-icon-btn @click="clientId = data.id" type="pin" />
                    <rounded-icon-btn @click="edit(data.id)" type="edit" :iconSize="20" />
                    <rounded-icon-btn
                      @click="equipmentStore.deleteDialog = data.id"
                      type="danger"
                    />
                  </div>
                  <div v-show="key.checked" v-else>
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
          :current-size="equipmentStore.historyListParams.page_size"
          :total-count="equipmentStore.historyListData?.total_count"
          :page-number="equipmentStore.historyListData?.page_number"
        />
        <page-index
          :available-pages="equipmentStore.historyListData?.total_pages"
          :current-page="equipmentStore.historyListData?.page_number"
          @setPage="equipmentStore.setPageHistory"
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
      <div v-if="equipmentStore.deleteDialog">
        <d-modal
          :dataContainerWidth="'360px'"
          @closeDialog="equipmentStore.closeDeleteDialog"
        >
          <CommonDeletedDialog
            @onAcceptDeleting="equipmentStore.acceptDeleting = $event"
            @closeDialog="equipmentStore.closeDeleteDialog"
            @onDelete="equipmentStore.onDeleteDevice"
          />
        </d-modal>
      </div>
    </transition>
    <transition name="modal">
      <div v-if="clientId">
        <ClientsEquipmentWithdrawInventoryDialog
          :client-id="clientId"
          @onClosed="clientId = null"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
// store
import { useI18n } from "vue-i18n";
import { equipmentsHistoryHeader } from "~/variable/column-constants";

const equipmentStore = useClientsEquipmentStore("main");

// emits
const emit = defineEmits(["editInventory"]);

// States
const { t } = useI18n();
const locationData = ref(false);
const clientId = ref(null);

// hooks

onMounted(async () => {
  if (!equipmentStore.historyListData) {
    await equipmentStore.getHistoryListData();
  }
});
// Methods

const convertToArr = (data) => {
  return data.map((item) => item.name);
};

const onChangeTableHeaders = (value) => {
  equipmentStore.headers = value;
};

const edit = (id) => {
  emit("editInventory", id);
};
const locationFunction = (latitude, longitude) => {
  locationData.value = {
    latitude: latitude,
    longitude: longitude,
  };
};
const refresh = () => {
  equipmentStore.refreshHistory();
};
<\/script>
`;export{e as default};
