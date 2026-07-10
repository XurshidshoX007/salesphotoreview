const n=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="data?.id ? t('edit') : t('clients.add')"
      :loading="territoriesStore.loadingUpdate"
      @closeDialog="closeDialog"
    >
      <flex-col class="gap-5">
        <shared-localized-input
          required
          :label="t('column.name')"
          v-model:base="data.default_name"
          v-model:translations="data.name_l10n"
        />
        <d-input
          type="text"
          :label="t('column.code')"
          :required="false"
          pattern-type="code"
          :value="data.code"
          @change="(value) => (data.code = value)"
        />
        <d-input
          type="number"
          :label="t('labels.sort')"
          :value="data.sort"
          pattern-type="sort"
          @change="(value) => (data.sort = value)"
        />
        <shared-localized-input
          :label="t('column.comment')"
          v-model:base="data.default_description"
          v-model:translations="data.description_l10n"
        />
        <Switch :active="data.is_active" @change="data.is_active = $event" />
        <!-- <YandexMapComponent
          change-location
          :coordinate="defaultCoordination"
          @change-map="changeLocation"
        /> -->
      </flex-col>
      <template #footer>
        <m-btn :loading="isBtnLoading" class="w-full" type="submit">
          {{ !data?.id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import type { TerritoryModel } from "~/interfaces/api/settings/territory-model";
import { useI18n } from "vue-i18n";
import { notify } from "@kyvg/vue3-notification";

// Store
const territoriesStore = useTerritoriesStore("");

// props
const props = defineProps<{
  editingId?: string;
  parentId?: string;
}>();

// emits
const emit = defineEmits(["closeDialog"]);

// State
const { t } = useI18n();

const data = ref<Partial<TerritoryModel>>({
  id: undefined,
  default_name: "",
  name_l10n: {},
  default_description: undefined,
  description_l10n: {},
  code: null,
  is_active: true,
  sort: null,
  lat_lng: undefined,
  parent_id: props.parentId || undefined,
});

const isBtnLoading = ref<boolean>(false);

const defaultCoordination = computed(() => {
  if (data.value.lat_lng) {
    return [data.value.lat_lng?.latitude, data.value.lat_lng?.longitude];
  } else {
    return [null, null];
  }
});

// hooks
onMounted(async () => {
  if (props.editingId) {
    await getDetails();
  }
});

// Methods

const changeLocation = (coords: any) => {
  data.value.lat_lng = {
    latitude: coords[0],
    longitude: coords[1],
  };
};

const getDetails = async () => {
  const detail = await territoriesStore.detailTerritory(props.editingId);
  data.value = detail;
};

const save = async () => {
  isBtnLoading.value = true;
  const res = await territoriesStore.add(data.value);
  if (res !== "error") {
    await territoriesStore.refresh();
    closeDialog();
    notify({ title: t("saved"), type: "success" });
  } else {
    notify({ title: t("error"), type: "error" });
  }
  isBtnLoading.value = false;
};

const closeDialog = () => {
  emit("closeDialog");
};
<\/script>

<style scoped>
#map {
  width: 100%;
  height: 400px; /* or any suitable height */
}
</style>
`;export{n as default};
