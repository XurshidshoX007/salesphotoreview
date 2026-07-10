const e=`<template>
  <div>
    <div v-if="clientsStore.photoReportsData?.items?.length > 0">
      <page-title20 :title="t('photo_report')" />
      <div
        class="grid grid-cols-4 gap-4 mt-5 max-[767px]:grid-cols-2 max-[567px]:grid-cols-1"
      >
        <div
          v-for="(photo, indexPhoto) in clientsStore.photoReportsData?.items"
          :key="photo"
          class="border rounded-lg h-[244px] relative"
        >
          <div class="flex justify-center h-full">
            <img
              :src="photo?.file?.path"
              alt="photo-report"
              class="w-full h-full object-cover rounded-lg cursor-pointer"
              @click="activeFunction(indexPhoto)"
            />
            <m-btn
              v-if="photo?.is_set_as_client_photo && hasAccess2Update"
              style="background: #23c00a; cursor: auto"
              class="absolute bottom-[10px] bg-green h-10 fs-14 text-white flex w-[90%] items-center justify-center"
            >
              {{ t("clients.added_photos") }}
            </m-btn>
            <m-btn
              v-else
              :loading="
                clientsStore.isSetPhotoReportLoading &&
                activePhotoId === photo.id
              "
              @click="setAsClientPhoto(photo?.id)"
              class="absolute bottom-[10px] h-10 fs-14 text-white flex w-[90%] items-center justify-center"
            >
              {{ t("clients.add_photos") }}
            </m-btn>
          </div>
        </div>
        <div
          v-if="
            clientsStore.photoReportsData?.total_count >
            clientsStore.paramsPhotoReport?.PageSize
          "
          class="border rounded-lg h-[244px] relative"
        >
          <div class="flex justify-center h-full">
            <m-btn
              class="absolute bottom-[10px] w-9/10"
              :loading="clientsStore.isLoadingClientPhoto"
              @click="setPageSize"
            >
              {{ t("clients.load_more") }}
            </m-btn>
          </div>
        </div>
      </div>
      <full-screen-image
        v-if="fullScreenImageUrl"
        :is-loading="clientsStore.isSetPhotoReportLoading"
        :image-data="clientsStore.photoReportsData?.items"
        :current-image-index="indexPhoto"
        @close-full-screen-image="closeFullScreenImage"
      >
        <template #info-name="{ item }">
          {{ item?.created_by?.name }}
        </template>
        <template #info-date="{ item }">
          {{ getFormattedDate(item?.upload_time, "DD.MM.YYYY HH:mm") }}
        </template>
        <template #info-category="{ item }">
          {{ item?.category?.name }}
        </template>
      </full-screen-image>
    </div>
    <div class="flex justify-center items-center py-10" v-else>
      <page-title20 :title="t('clients.no_photo_report')" />
    </div>
  </div>
</template>

<script setup>
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useClientsAccess } from "~/composables/access/clients/clients";

// store
const clientsStore = useClientsStore("main");

// state
const { hasAccess2Update } = useClientsAccess();
const { t } = useI18n();
const route = useRoute();
const fullScreenImageUrl = ref(null);
const indexPhoto = ref(3);
const activePhotoId = ref(null);

// hooks
onMounted(async () => {
  if (
    !clientsStore.photoReportsData ||
    clientsStore.paramsPhotoReport.ClientId !== route.params.id
  ) {
    clientsStore.paramsPhotoReport.ClientId = route.params.id;
  }
});

// methods
const activeFunction = (index) => {
  indexPhoto.value = index;
  fullScreenImageUrl.value = index + 1;
};

const setPageSize = async () => {
  clientsStore.paramsPhotoReport.PageSize =
    clientsStore.paramsPhotoReport.PageSize + 8;
};

const setAsClientPhoto = async (photo_id) => {
  activePhotoId.value = photo_id;
  const res = await clientsStore.setPhotoAsClientReport(photo_id);
  if (res !== "error") {
    notify({ type: "success", title: "Успешный" });
    await clientsStore.getClientsPhotoReports();
  } else {
    notify({ type: "error", title: "Ошибка" });
  }
};

const closeFullScreenImage = () => {
  fullScreenImageUrl.value = null;
};

const isOpenFullScreenImage = () => {
  return fullScreenImageUrl.value !== null;
};

defineExpose({
  isOpenFullScreenImage,
});
<\/script>

<style scoped lang="scss">
.loading-page-size {
  width: 100%;
  text-align: center;
  color: #299b9b;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 600;
}

.loading-page-size:hover {
  opacity: 0.8;
}
</style>
`;export{e as default};
