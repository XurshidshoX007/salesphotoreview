const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="equipmentsHeader"
          :templates="equipmentStore.headers"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="equipmentStore.headers"
          :save-key="equipmentsHeader"
        />
        <page-size-btn
          :current-size="equipmentStore.params.page_size"
          :total-count="equipmentStore?.data?.total_count"
          :page-number="equipmentStore?.data?.page_number"
          @setPageSize="equipmentStore.setPageSize"
        />
        <search-input
          @change="equipmentStore.search"
          :value="equipmentStore.params.search"
        />
        <excel-btn
          @click="equipmentStore.onDownloadExcelFile"
          :loading="equipmentStore.isExcelFileDownloading"
        />
        <RefreshBtn :loading="equipmentStore.isDataLoading" @click="refresh" />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="equipmentStore.headers"
          @sort="equipmentStore.sortData"
          :sorted="equipmentStore.params.order_by"
          :isEmpty="!equipmentStore.data?.items?.length"
          :loading="equipmentStore.isDataLoading"
        >
          <template #body>
            <template v-for="data in equipmentStore.data?.items" :key="data.id">
              <c-tr>
                <c-td-no-edit
                  class="relative"
                  v-for="key in equipmentStore.headers"
                  :key="key"
                  :type="key.type"
                  :is-checked="key.checked"
                >
                  <div
                    v-if="key.type === 'location'"
                    v-show="data.latitude && data.longitude"
                  >
                    <rounded-icon-btn
                      icon-file-name="Location"
                      type="outlined"
                      @click="locationFunction(data.latitude, data.longitude)"
                    />
                  </div>
                  <div v-else-if="key.key === 'client_name'">
                    <link-component
                      :value="data[key.key]"
                      :to="\`/clients/about-clients/\${data.client_id}\`"
                      :is-linkable="isClientDetailLinkable"
                    />
                  </div>
                  <div v-else-if="key.key === 'agent_arr'">
                    <show-more
                      :show-count="2"
                      :data="convertToArr(data[key.key])"
                    />
                  </div>
                  <div v-else-if="key.type === 'date'">
                    {{ getFormattedDate(data[key.key], "DD.MM.YYYY") }}
                  </div>
                  <div
                    v-else-if="key.type === 'action'"
                    class="flex items-center gap-x-3"
                  >
                    <rounded-icon-btn
                      type="pin"
                      :tooltip="t('clients.remove_equipment')"
                      @click="clientId = data.id"
                    />
                    <rounded-icon-btn
                      v-if="allowToUpdate"
                      type="edit"
                      :iconSize="20"
                      @click="edit(data.id)"
                    />
                    <rounded-icon-btn
                      v-if="allowToDelete"
                      type="danger"
                      @click="equipmentStore.deleteDialog = data.id"
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
          :current-size="equipmentStore.params.page_size"
          :total-count="equipmentStore?.data?.total_count"
          :page-number="equipmentStore?.data?.page_number"
        />
        <page-index
          :available-pages="equipmentStore.data?.total_pages"
          :current-page="equipmentStore.data?.page_number"
          @setPage="equipmentStore.setPage"
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
        <CommonDeletedDialog
          is-agree
          @onSelectDelete="equipmentStore.onDeleteDevice"
          @onSelectExit="equipmentStore.closeDeleteDialog"
        />
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
import { useI18n } from "vue-i18n";
// -------------- TO-DO: Make HistoryEquipmentDataTable and DataTable one DataTable ------------------ //
import { getFormattedDate } from "~/utils/formatters";
import { equipmentsHeader } from "~/variable/column-constants";

// store
const equipmentStore = useClientsEquipmentStore("main");

// props
const props = defineProps({
  allowToUpdate: Boolean,
  allowToDelete: Boolean,
  allowToSeizure: Boolean,
  isClientDetailLinkable: Boolean,
});

// emits
const emit = defineEmits(["editInventory"]);

// States
const { t } = useI18n();
const locationData = ref(false);
const clientId = ref(null);

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
const refresh = () => {
  equipmentStore.refresh();
};
const locationFunction = (latitude, longitude) => {
  locationData.value = {
    latitude: latitude,
    longitude: longitude,
  };
};
<\/script>
`;export{e as default};
