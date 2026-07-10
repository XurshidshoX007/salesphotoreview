const e=`<template>
  <div v-show="allowToList">
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="initialBalanceColumn"
          :templates="clientsInitialBalanceStore.templates"
          @onChangeTableHeaders="onChangeHeaders"
        />
        <ShowHideColumn
          :headers="clientsInitialBalanceStore.templates"
          :save-key="initialBalanceColumn"
        />
        <page-size-btn
          :current-size="clientsInitialBalanceStore.params.page_size"
          :total-count="clientsInitialBalanceStore.data?.total_count"
          :page-number="clientsInitialBalanceStore.data?.page_number"
          @setPageSize="clientsInitialBalanceStore.setPageSize"
        />
        <search-input
          @change="clientsInitialBalanceStore.search"
          :value="clientsInitialBalanceStore.params.search"
        />
        <excel-btn
          @click="clientsInitialBalanceStore.onDownloadExcelFile"
          :loading="clientsInitialBalanceStore.isExcelFileDownloading"
        />
        <RefreshBtn
          @click="refresh"
          :loading="clientsInitialBalanceStore.isLoading"
        />
      </div>

      <div class="table-content-body">
        <data-table
          :headers="clientsInitialBalanceStore.templates"
          :sorted="clientsInitialBalanceStore.params.order_by"
          :loading="clientsInitialBalanceStore.isLoading"
          :isEmpty="!clientsInitialBalanceStore.data?.items?.length"
          :check="isTableAllChecked"
          :indeterminate="isTableIndeterminate"
          @sort="clientsInitialBalanceStore.sortData"
          @getAllId="getAllIds"
        >
          <template #body>
            <template
              v-for="(data, index) in clientsInitialBalanceStore.data?.items"
              :key="index"
            >
              <c-tr>
                <c-td-no-edit
                  v-for="key in clientsInitialBalanceStore.templates"
                  :key="key"
                  :is-checked="key.checked"
                  :type="key.type"
                >
                  <div v-if="key.key === 'checkbox'">
                    <Checkbox
                      :checked="selectedId.includes(data.id)"
                      @change="getId(data.id, index)"
                    />
                  </div>
                  <link-component
                    v-else-if="key.key === 'created_date'"
                    :isLinkable="allowToDetail"
                    :value="getFormattedDate(data[key.key], 'DD.MM.YYYY')"
                    nonCopyable
                    @click="openPaymentModal(data.id)"
                  />
                  <div v-else-if="key.type === 'number'">
                    {{ getFormattedAmount(data[key.key]) }}
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
          :current-size="clientsInitialBalanceStore.params.page_size"
          :total-count="clientsInitialBalanceStore.data?.total_count"
          :page-number="clientsInitialBalanceStore.data?.page_number"
        />
        <page-index
          :available-pages="clientsInitialBalanceStore.data?.total_pages"
          :current-page="clientsInitialBalanceStore.data?.page_number"
          @setPage="clientsInitialBalanceStore.setPage"
        />
      </div>
    </div>
  </div>
  <transition name="modal">
    <div v-if="payment">
      <d-modal
        @closeDialog="payment = false"
        :dataContainerWidth="'940px'"
        :name="'Оплата № ' + clientsInitialBalanceStore.detail?.visual_id"
      >
        <DashboardCashboxInitialBalanceClientsDialogBodyReviuw
          @closeModal="payment = false"
          @editItem="editPaymentModal"
        />
      </d-modal>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { initialBalanceColumn } from "~/variable/column-constants";
import type { Template } from "~/interfaces/ui/template";

// store
const clientsInitialBalanceStore = useClientsInitialBalanceStore("main");

// props
const props = defineProps({
  allowToList: Boolean,
  allowToDetail: Boolean,
});

// State
const { t } = useI18n();
const selectedId = ref<string[]>([]);
const payment = ref<boolean>(false);
const paymentEdit = ref<boolean>(false);

// Methods

const onChangeHeaders = (param: Template[]) => {
  clientsInitialBalanceStore.templates = param;
};

const getAllIds = (checked: boolean) => {
  if (checked) {
    selectedId.value =
      clientsInitialBalanceStore.data?.items.map((item) => item.id) || [];
  } else {
    selectedId.value = [];
  }
};

const refresh = () => {
  clientsInitialBalanceStore.refresh();
};

function getId(id: string, index: number) {
  if (!selectedId.value.includes(id)) {
    selectedId.value.push(id);
  } else {
    const currentIndex = selectedId.value.findIndex((it) => it === id);
    selectedId.value.splice(currentIndex, 1);
  }
}

const openPaymentModal = async (id: string) => {
  if (!props.allowToDetail) return;
  await clientsInitialBalanceStore.getDetail(id);
  payment.value = true;
};

const editPaymentModal = () => {
  payment.value = false;
  paymentEdit.value = true;
};

// hooks

const isTableAllChecked = computed(() => {
  if (!clientsInitialBalanceStore.data?.items.length) return false;
  return clientsInitialBalanceStore.data?.items.every((item) =>
    selectedId.value.includes(item.id),
  );
});

const isTableIndeterminate = computed(() => {
  if (isTableAllChecked.value || !clientsInitialBalanceStore.data?.items.length)
    return false;
  return clientsInitialBalanceStore.data?.items.some((item) =>
    selectedId.value.includes(item.id),
  );
});
<\/script>
`;export{e as default};
