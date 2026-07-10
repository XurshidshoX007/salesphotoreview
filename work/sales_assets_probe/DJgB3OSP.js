const e=`<template>
  <d-modal
    :dataContainerWidth="'1400px'"
    :name="modalName"
    only-close-dialog
    @closeDialog="closeDialog"
  >
    <div>
      <div class="table-content-container">
        <div class="table-content-header justify-between">
          <div class="table-content-btn-group">
            <table-sort-columns
              :save-key="photoSupperReportDetailHeader"
              :templates="supervisorStore?.headersClient"
              @onChangeTableHeaders="onChangeTableHeaders"
            />
            <ShowHideColumn
              :headers="supervisorStore?.headersClient"
              :save-key="photoSupperReportDetailHeader"
            />
            <page-size-btn
              :current-size="supervisorStore?.paramsClient?.page_size"
              @setPageSize="supervisorStore?.setPageSizeClient"
            />
            <search-input @change="supervisorStore?.searchClient" />
            <excel-btn />
            <RefreshBtn
              @click="refresh"
              :loading="supervisorStore?.isLoadingClient"
            />
          </div>
          <m-btn
            :disabled="!supervisorStore?.dataClient?.items?.length"
            :loading="supervisorStore?.isLoadingPhotoReport"
            @click="getPhotoReportData(null)"
          >
            {{ t("dashboard.supervisor.all_images") }}
          </m-btn>
        </div>
        <div class="table-content-body">
          <data-table
            :headers="supervisorStore?.headersClient"
            @sort="supervisorStore?.sortDataClient"
            :sorted="supervisorStore?.paramsClient?.order_by"
            :is-empty="!supervisorStore?.dataClient?.items?.length"
            :loading="supervisorStore?.isLoadingClient"
          >
            <template #body>
              <c-tr
                v-for="data in supervisorStore?.dataClient?.items"
                :key="data?.visual_id"
              >
                <c-td-no-edit
                  v-for="key in supervisorStore?.headersClient"
                  :key="key"
                >
                  <div v-if="key.key === 'category' || key.key === 'territory'">
                    {{ data[key.key]?.name }}
                  </div>
                  <link-component
                    v-else-if="key.key === 'client'"
                    :value="data[key.key]?.name"
                    :to="\`/clients/about-clients/\${data?.client.id}\`"
                  />
                  <link-component
                    v-else-if="key.key === 'photo_report_categories'"
                    :value="categoryPhotoReport(data[key.key])"
                    nonCopyable
                    @click="getPhotoReportData(data?.client?.id)"
                  />
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
            :current-size="supervisorStore?.paramsClient?.page_size"
            :total-count="supervisorStore?.dataClient?.total_count"
            :page-number="supervisorStore?.dataClient?.page_number"
          />
          <page-index
            :available-pages="supervisorStore?.dataClient?.total_pages"
            :current-page="supervisorStore?.dataClient?.page_number"
            @setPage="supervisorStore?.setPageClient"
          />
        </div>
      </div>
      <full-screen-image
        v-if="isOpenFullScreenImage"
        :is-loading="supervisorStore.isLoadingPhotoReport"
        :image-data="supervisorStore.dataPhotoReport"
        :current-image-index="carouselImageIndex"
        @close-full-screen-image="closePhotoPage"
      >
        <template #info-client="{ item }">
          {{ item?.client?.name }}
        </template>
        <template #info-name="{ item }">
          {{ item?.agent?.name }}
        </template>
        <template #info-date="{ item }">
          {{ getFormattedDate(item?.upload_time, "DD.MM.YYYY HH:mm") }}
        </template>
      </full-screen-image>
    </div>
  </d-modal>
</template>

<script setup>
import "vue3-carousel/dist/carousel.css";
import { useI18n } from "vue-i18n";
import { photoSupperReportDetailHeader } from "~/variable/column-constants";

// props
const props = defineProps({
  modalName: String,
  id: String,
});

// emit
const emit = defineEmits(["closeDialog"]);

// State
const { t } = useI18n();
const supervisorStore = useSupervisorStore("main");
const carouselImageIndex = ref(0);
const isOpenFullScreenImage = ref(false);

// hooks
onMounted(() => {
  supervisorStore?.getClientList(props?.id);
});

// Methods

const getPhotoReportData = async (id) => {
  isOpenFullScreenImage.value = true;
  const params = {
    date_range: supervisorStore?.paramsClient?.date_range,
    agent_id: supervisorStore?.paramsClient?.agent_id,
    client_id: id ?? null,
  };

  await supervisorStore?.getPhotoData(params);
};

const refresh = () => {
  supervisorStore.refreshClient();
};
const onChangeTableHeaders = (newValue) => {
  supervisorStore.headersClient = newValue;
};

const categoryPhotoReport = (reports) => {
  return (
    reports
      ?.map((item) => \`\${item?.name} (\${item?.photo_report_count})\`)
      .join(", ") || ""
  );
};

const closePhotoPage = () => {
  isOpenFullScreenImage.value = false;
};

const closeDialog = () => {
  emit("closeDialog");
};
<\/script>
`;export{e as default};
