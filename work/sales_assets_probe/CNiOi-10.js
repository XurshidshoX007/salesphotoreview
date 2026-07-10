const n=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <div @click="draggable = true">
          <table-sort-columns />
        </div>
        <ShowHideColumn :headers="clientStore.templates" />
        <div>
          <page-size-btn
            :current-size="clientStore.params.page_size"
            :total-count="clientStore?.data?.total_count"
            :page-number="clientStore?.data?.page_number"
            @setPageSize="clientStore.setPageSize"
          />
        </div>
        <div>
          <search-input
            @change="clientStore.search"
            :value="clientStore.params.search"
          />
        </div>
        <div>
          <excel-btn
            @click="clientStore.onDownloadExcelFile"
            :loading="clientStore.isExcelFileDownloading"
          />
        </div>
        <div>
          <RefreshBtn
            @click="refresh"
            :loading="clientStore.isDataTableLoading"
          />
        </div>
      </div>
      <div class="table-content-body">
        <data-table
          :headers="clientStore.templates"
          :loading="clientStore.isDataTableLoading"
          :isEmpty="!clientStore.data?.items?.length"
          :check="isAllTableChecked"
          :sorted="clientStore.params.order_by"
          @sort="clientStore.sortData"
          @getAllId="getAllClientsId()"
        >
          <template #body>
            <template
              v-for="(data, index) in clientStore.data?.items"
              :key="index"
            >
              <c-tr>
                <c-td-no-edit
                  v-for="key in clientStore.templates"
                  :key="key"
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
                  <div
                    v-if="
                      key.key === 'name' ||
                      key.key === 'company_name' ||
                      key.key === 'visual_id'
                    "
                  >
                    <link-component
                      :value="data[key.key]"
                      :to="\`/clients/about-clients/\${data.id}\`"
                      :is-linkable="allowToDetail"
                    />
                  </div>
                  <div v-else-if="key.type === 'lat_lng' && data[key.key]">
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
                  <div
                    v-else-if="
                      key.key === 'expeditors' ||
                      key.key === 'price_types' ||
                      key.key === 'comments' ||
                      key.key === 'device_types' ||
                      key.key === 'devices' ||
                      key.key === 'visit_days'
                    "
                  >
                    {{ toCombineFunction(data[key.key]) }}
                  </div>
                  <div
                    v-else-if="
                      key.key === 'created_by' ||
                      key.key === 'sales_channel' ||
                      key.key === 'type' ||
                      key.key === 'category' ||
                      key.key === 'format'
                    "
                  >
                    {{ data[key.key]?.name }}
                  </div>
                  <div v-else-if="key.key === 'balance'">
                    {{ getFormattedAmount(data["balance"]?.amount) }}
                  </div>

                  <div v-else-if="key.key === 'created_date'">
                    {{ getFormattedDate(data[key.key]) }}
                  </div>
                  <div
                    v-else-if="
                      key.key === 'can_order_with_consignation' ||
                      key.key === 'can_order_in_debt'
                    "
                  >
                    <div v-if="data[key.key]">Есть</div>
                    <div v-else>Нет</div>
                  </div>
                  <div v-else-if="key.checked && key.key === 'agents'">
                    <tags-component :data="data['agent_arr']" />
                  </div>
                  <div v-else-if="key.key === 'is_active'">
                    {{ data[key.key] ? t("active") : t("not_active") }}
                  </div>
                  <div
                    v-else-if="allowToUpdate && key.key === 'action'"
                    :key="index"
                    class="relative drop group"
                  >
                    <rounded-icon-btn
                      type="edit"
                      :iconSize="20"
                      @click="editClient(data.id)"
                    />
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
      <div v-if="draggable">
        <drag-and-drop
          @change="onChangeTableHeaders"
          @closeDialog="draggableDialog"
          :templates="clientStore.templates"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="locationData">
        <lazy-clients-equipment-location
          :location="locationData"
          @closeDialog="locationData = ''"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import TagsComponent from "~/components/global/TagsComponent.vue";

// store
const clientStore = useClientsStore("main");

// props
const props = defineProps({
  allowToDetail: Boolean,
  allowToUpdate: Boolean,
});

// State
const { t } = useI18n();
const draggable = ref(false);
const router = useRouter();

const locationData = ref(false);

// hooks
const isAllTableChecked = computed(() => {
  if (!clientStore.data?.items?.length) return false;
  return clientStore.data?.items?.every((client) =>
    clientStore.clientsIds.includes(client.id),
  );
});

// Methods
const draggableDialog = () => {
  draggable.value = false;
};

const onChangeTableHeaders = (param) => {
  clientStore.templates = param;
  draggable.value = false;
};

const editClient = (id) => {
  router.push({ path: "/clients/clients/create-clients", query: { id: id } });
};

const getAllClientsId = () => {
  if (isAllTableChecked.value) {
    clientStore.setNullMultipleDialog();
  } else {
    clientStore.clientsIds = clientStore.data?.items.map((agent) => agent.id);
  }
};

const isTableChecked = (agentId) => {
  return clientStore.clientsIds.find((id) => agentId === id);
};

const onSelectAgent = (agentId) => {
  if (!isTableChecked(agentId)) {
    clientStore.clientsIds.push(agentId);
  } else {
    clientStore.clientsIds = clientStore.clientsIds.filter(
      (id) => id !== agentId,
    );
  }
};

const refresh = () => {
  clientStore.refresh();
};

const locationFunction = (latitude, longitude) => {
  locationData.value = {
    latitude: latitude,
    longitude: longitude,
  };
};

const toCombineFunction = (data) => {
  return data.join(", ");
};
<\/script>
`;export{n as default};
