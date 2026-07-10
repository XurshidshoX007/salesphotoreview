const e=`<template>
  <div>
    <flex-col class="gap-3">
      <div class="flex items-center justify-between">
        <page-title20 :title="t('clients.inventory')" />
        <m-btn
          v-if="hasAccess2CreateDevice"
          @click="addInventoryModal = true"
          >{{ t("clients.add") }}</m-btn
        >
      </div>
      <div class="table-content-container">
        <div class="table-content-header">
          <table-sort-columns
            :templates="clientDevicesStore.headers"
            :save-key="equipmentsInClientDetailHeader"
            @onChangeTableHeaders="onChangeHeaders"
          />
          <ShowHideColumn
            :headers="clientDevicesStore.headers"
            :save-key="equipmentsInClientDetailHeader"
            class="checkbox-order"
          />
          <page-size-btn
            :current-size="clientDevicesStore.paramsOfMainTable.PageSize"
            @setPageSize="clientDevicesStore.setPageSizeToMain"
          />
          <search-input @change="clientDevicesStore.searchFromMain" />
          <excel-btn :size="'340kb'" />
          <RefreshBtn
            @click="refresh"
            :loading="clientDevicesStore.loadingMainTable"
          />
        </div>
        <div class="table-content-body">
          <data-table
            :headers="clientDevicesStore.headers"
            :loading="clientDevicesStore.loadingMainTable"
            :sorted="clientDevicesStore.paramsOfMainTable.order_by"
            :is-empty="!clientDevicesStore?.dataOfMainTable?.items?.length"
            @sort="clientDevicesStore.sortMainTableData"
          >
            <template #body>
              <c-tr
                v-for="(data, index) in clientDevicesStore.dataOfMainTable
                  ?.items"
                :key="data.id"
              >
                <c-td-no-edit
                  v-for="key in clientDevicesStore.headers"
                  :key="key"
                  :is-checked="key.checked"
                  :type="key.type"
                >
                  <div class="py-2">
                    <div v-if="key.key === 'orderNumber'">
                      {{ index + 1 }}
                    </div>
                    <div v-else-if="key.key === 'attachment_date'">
                      {{ getFormattedDate(data[key.key], "YYYY.MM.DD") }}
                    </div>
                    <div
                      v-else-if="key.type === 'action'"
                      class="flex items-center gap-x-3"
                    >
                      <rounded-icon-btn
                        v-if="hasAccess2UpdateDevice"
                        type="edit"
                        :iconSize="20"
                        @click="editInventory(data.id)"
                      />
                      <rounded-icon-btn
                        v-if="hasAccess2DeleteDevice"
                        type="danger"
                        @click="equipmentStore.deleteDialog = data.id"
                      />
                    </div>
                    <div v-else>
                      {{ data[key.key] }}
                    </div>
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </data-table>
        </div>
        <div class="table-content-footer">
          <curren-page-btn
            :current-size="clientDevicesStore.paramsOfMainTable.page_size"
            :total-count="clientDevicesStore?.dataOfMainTable?.total_count"
            :page-number="clientDevicesStore?.dataOfMainTable?.page_number"
          />
          <page-index
            :available-pages="clientDevicesStore.dataOfMainTable?.total_pages"
            :current-page="clientDevicesStore.dataOfMainTable?.page_number"
            @setPage="clientDevicesStore.setPageToMain"
          />
        </div>
      </div>
      <page-title20 :title="t('clients.removal_of_inventory')" />
      <div class="table-content-container">
        <div class="table-content-header">
          <table-sort-columns
            :templates="clientDevicesStore.withdrawHeaders"
            :save-key="equipmentsInClientDetailHeader"
            @onChangeTableHeaders="onChangeWithDrawHeaders"
          />
          <ShowHideColumn :headers="clientDevicesStore.withdrawHeaders" />
          <page-size-btn
            :current-size="clientDevicesStore.paramsOfWithdrawTable.PageSize"
            @setPageSize="clientDevicesStore.setPageSizeToWithdraw"
          />
          <search-input @change="clientDevicesStore.searchFromWithdraw" />
          <excel-btn />
          <RefreshBtn
            @click="refreshWithDraw"
            :loading="clientDevicesStore.loadingWithdrawTable"
          />
        </div>
        <div class="table-content-body">
          <data-table
            :headers="clientDevicesStore.withdrawHeaders"
            :loading="clientDevicesStore.loadingWithdrawTable"
            :sorted="clientDevicesStore.paramsOfWithdrawTable.order_by"
            :is-empty="!clientDevicesStore?.dataOfWithdrawTable?.items?.length"
            @sort="clientDevicesStore.sortWithdrawTableData"
          >
            <template #body>
              <c-tr
                v-for="(data, index) in clientDevicesStore.dataOfWithdrawTable
                  ?.items"
                :key="data.id"
              >
                <c-td-no-edit
                  v-for="key in clientDevicesStore.withdrawHeaders"
                  :key="key"
                  :is-checked="key.checked"
                  :type="key.type"
                >
                  <div v-if="key.key === 'orderNumber'">
                    {{ index + 1 }}
                  </div>
                  <div v-if="key.key === 'withdrawal_date'">
                    {{ getFormattedDate(data[key.key]) }}
                  </div>
                  <div
                    v-else-if="key.type === 'action'"
                    class="flex items-center gap-x-3"
                  >
                    <rounded-icon-btn
                      v-if="hasAccess2UpdateDevice"
                      type="edit"
                      @click="editInventory(data.id)"
                    />
                    <rounded-icon-btn
                      v-if="hasAccess2DeleteDevice"
                      type="danger"
                      @click="equipmentStore.deleteDialog = data.id"
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
        <div class="table-content-footer">
          <curren-page-btn
            :current-size="clientDevicesStore.paramsOfWithdrawTable.page_size"
            :total-count="clientDevicesStore.dataOfMainTable?.total_count"
            :page-number="clientDevicesStore.dataOfMainTable?.page_number"
          />
          <page-index
            :available-pages="
              clientDevicesStore.dataOfWithdrawTable?.total_pages
            "
            :current-page="clientDevicesStore.dataOfWithdrawTable?.page_number"
            @setPage="clientDevicesStore.setPageToWithdraw"
          />
        </div>
      </div>
    </flex-col>
    <transition name="modal">
      <div v-if="addInventoryModal">
        <ClientsEquipmentAddInventory
          :modal-name="\`\${
            equipmentStore.inventoryId ? 'Изменить' : 'Добавить'
          } инвентарь\`"
          :clientId="route.params.id"
          @closeDialog="closeInventoryDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="equipmentStore.deleteDialog">
        <CommonDeletedDialog
          is-agree
          @onSelectDelete="deletedEquipments"
          @onSelectExit="equipmentStore.closeDeleteDialog"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { getFormattedDate } from "~/utils/formatters";
import { useI18n } from "vue-i18n";
import { useClientsAccess } from "~/composables/access/clients/clients";
import { equipmentsInClientDetailHeader } from "~/variable/column-constants";

// store
const clientDevicesStore = useClientDetailsDevicesStore("main");
const equipmentStore = useClientsEquipmentStore("main");

// State
const {
  hasAccess2CreateDevice,
  hasAccess2UpdateDevice,
  hasAccess2DeleteDevice,
} = useClientsAccess();
const { t } = useI18n();
const addInventoryModal = ref(false);
const route = useRoute();
const clientId = ref(route.params.id);

// Methods
onMounted(() => {
  clientDevicesStore.paramsOfMainTable.clientId = clientId.value;
  clientDevicesStore.paramsOfWithdrawTable.clientId = clientId.value;
});

const closeInventoryDialog = async () => {
  addInventoryModal.value = false;
  await equipmentStore.refresh();
  equipmentStore.inventoryId = null;
};

const onChangeHeaders = (param) => {
  clientDevicesStore.headers = param;
};

const onChangeWithDrawHeaders = (param) => {
  clientDevicesStore.withdrawHeaders = param;
};

const refresh = () => {
  clientDevicesStore.refreshMainTable();
};

const refreshWithDraw = () => {
  clientDevicesStore.refreshWithdrawTable();
};

const editInventory = (id) => {
  equipmentStore.inventoryId = id;
  addInventoryModal.value = true;
};

const deletedEquipments = async () => {
  await equipmentStore.onDeleteDevice();
  await clientDevicesStore.refreshMainTable();
  await clientDevicesStore.refreshWithdrawTable();
};
<\/script>
`;export{e as default};
