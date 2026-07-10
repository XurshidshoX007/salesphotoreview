const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header justify-between">
      <div class="table-content-btn-group">
        <table-sort-columns
          :templates="createOrdersStore.headers"
          :save-key="createOrderColumn"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="createOrdersStore.headers"
          :save-key="createOrderColumn"
        />
        <page-size-btn
          :current-size="createOrdersStore.params.page_size"
          :total-count="createOrdersStore.data?.total_count"
          :page-number="createOrdersStore.data?.page_number"
          @setPageSize="createOrdersStore.setPageSize"
        />
        <search-input
          @change="createOrdersStore.search"
          :value="createOrdersStore.params.search"
        />
        <excel-btn />
        <RefreshBtn @click="refresh" :loading="createOrdersStore.isLoading" />
      </div>
      <nuxt-link to="/clients/clients/create-clients" @click="closeDialog">
        <m-btn>{{ t("orders.add_client") }}</m-btn>
      </nuxt-link>
    </div>
    <div class="table-content-body">
      <data-table
        :headers="createOrdersStore.headers"
        :loading="createOrdersStore.isLoading"
        :isEmpty="!createOrdersStore.data?.items?.length"
        :sorted="createOrdersStore.params.order_by"
        @sort="createOrdersStore.sortData"
      >
        <template #body>
          <template
            v-for="data in createOrdersStore?.data?.items"
            :key="data.id"
          >
            <c-tr @click="onSelectClient(data.id)" class="cursor-pointer">
              <c-td-no-edit
                v-for="key in createOrdersStore.headers"
                :key="key.key"
                :header-key="key.key"
                :is-checked="key.checked"
              >
                <div v-if="key.key === 'agents'">
                  <tags-component :data="data[key.key]" />
                </div>
                <div v-else-if="key.key === 'over_due_term'">
                  {{ getFormattedDate(data[key.key], "DD.MM.YYYY") }}
                </div>
                <div v-else-if="key.key === 'days'">
                  {{ data[key.key]?.join(", ") }}
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
        :current-size="createOrdersStore.params.page_size"
        :total-count="createOrdersStore.data?.total_count"
        :page-number="createOrdersStore.data?.page_number"
      />
      <page-index
        :available-pages="createOrdersStore.data?.total_pages"
        :current-page="createOrdersStore.data?.page_number"
        @setPage="createOrdersStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="refundTaraDialogClientId">
      <d-modal @closeDialog="refundTaraDialogClientId = ''">
        <OrdersReturnContainersDialog
          :clientId="refundTaraDialogClientId"
          @closeDialog="refundTaraDialogClientId = ''"
        />
      </d-modal>
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { useI18n } from "vue-i18n";
import { createOrderColumn } from "~/variable/column-constants";
import { getFormattedDate } from "#imports";

// store
const createOrdersStore = useCreateOrdersStore("main");

// emits
const emit = defineEmits(["closeDialog"]);

// State
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const refundTaraDialogClientId = ref<string>("");

// hooks
onMounted(async () => {
  await createOrdersStore.getData();
});

// methods

const refresh = () => {
  createOrdersStore.refresh();
};

function onSelectClient(clientId: string) {
  const queryKey = Object.keys(route.query)?.join("");

  if (route.query[queryKey]) {
    refundTaraDialogClientId.value = clientId;
    return;
  } else {
    closeDialog();
    router.push({
      path: "/orders/create-orders/creating-orders",
      query: { [queryKey]: clientId },
    });
  }
}

const closeDialog = () => emit("closeDialog");

const onChangeTableHeaders = (newHeaders: Template[]) => {
  createOrdersStore.headers = newHeaders;
};
<\/script>
`;export{e as default};
