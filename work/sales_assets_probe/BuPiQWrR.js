const n=`<template>
  <form @submit.prevent="save">
    <d-modal :name="t('gps.route_optimization')" @closeDialog="closeDialog">
      <template #header-button>
        <div class="week-day">
          {{ weekDay.name }}
        </div>
      </template>
      <flex-col class="w-full gap-5">
        <DropdownsByFilterStates
          ref="DropdownComponent"
          :filterStates="filterStates"
          @onOpenDropdown="onOpenDropdown"
          @search="onSearchDropdown"
        />
      </flex-col>
      <template #footer>
        <m-btn class="w-full" type="submit" :loading="isBtnLoading">
          {{ t("apply") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { useNotification } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";

import type { DropdownsByFilterStates } from "#components";
import { clientDynamicDropdownParams } from "~/variable/params";
import type { ClientModel } from "~/interfaces/api/users/tasks-models";
import { useGPSStore } from "~/stores/gps/gps.store";
import type { AppResponse } from "~/interfaces/api/response/app-response";
import type { clientDynamicDropdownParamsType } from "~/interfaces/api/params/list-parameters";

const DropdownComponent = ref<typeof DropdownsByFilterStates>(null);

// Props
const props = defineProps<{
  weekDay: {
    name: string;
    id: number;
    type: string;
  };
  agentId: string;
}>();

// Store
const gpsStore = useGPSStore("main");

// State
const { t } = useI18n();
const isBtnLoading = ref(false);

const clientsStart = ref<AppResponse<ClientModel> | undefined>();
const clientsEnd = ref<AppResponse<ClientModel> | undefined>();

const methodData = ref({
  FirstClientId: null,
  LastClientId: null,
});

const clientsStartParams = ref<clientDynamicDropdownParamsType>({
  ...clientDynamicDropdownParams,
  agent_visit_days: [props.weekDay.id],
  agent_ids: props.agentId ? [props.agentId] : [],
  selecting_fields: ["full_name", "id", "lat_lng"],
});

const clientsEndParams = ref<clientDynamicDropdownParamsType>(
  JSON.parse(JSON.stringify(clientsStartParams.value))
);

const filterStates = ref([
  {
    name: t("gps.starting_location"),
    key: "clients-start",
    isSingleSelect: true,
    required: true,
    get data() {
      return startClientsData.value || [];
    },
    get getSelectedData() {
      return methodData.value.FirstClientId;
    },
    set setSelectedData(value: string) {
      methodData.value.FirstClientId = value;
    },
    onLoadElse: async () => {
      await onLoadElseClients("clients-start");
    },
    isItemsDisabled: (item: ClientModel) => {
      if (item?.lat_lng === null) {
        return t("labels.no_location");
      }
    },
  },
  {
    name: t("gps.finish_location"),
    key: "clients-end",
    required: true,
    isSingleSelect: true,
    get data() {
      return endClientsData.value || [];
    },
    get getSelectedData() {
      return methodData.value.LastClientId;
    },
    set setSelectedData(value: string) {
      methodData.value.LastClientId = value;
    },
    onLoadElse: async () => {
      await onLoadElseClients("clients-end");
    },
    isItemsDisabled: (item: ClientModel) => {
      return item?.lat_lng === null;
    },
  },
]);

// Emits
const emit = defineEmits(["closeDialog"]);

// Methods
const onOpenDropdown = async (state: string, value: any) => {
  const isClientStart = state === "clients-start";
  const isClientEnd = state === "clients-end";
  if (isClientStart && clientsStart.value === undefined) {
    await getClients(state);
    return;
  }

  if (isClientEnd && clientsEnd.value === undefined) {
    await getClients(state);
    return;
  }

  if (isClientStart || isClientEnd) {
    const startShort = startClientsData.value?.items?.length < 10;
    const endShort = endClientsData.value?.items?.length < 10;

    if (startShort || endShort) {
      await onLoadElseClients(state);
    }
  }
};

const onSearchDropdown = async (state: string, value: string) => {
  if (state === "clients-start") {
    clientsStartParams.value.search = value;
  } else {
    clientsEndParams.value.search = value;
  }
  await getClients(state);
};

const getClients = async (state: string) => {
  if (state === "clients-start") {
    clientsStart.value = await gpsStore.getClients(clientsStartParams.value);
  } else if (state === "clients-end") {
    clientsEnd.value = await gpsStore.getClients(clientsEndParams.value);
  }
};

const onLoadElseClients = async (state: string) => {
  if (state === "clients-start") {
    clientsStartParams.value.page_size += 10;
  } else if (state === "clients-end") {
    clientsEndParams.value.page_size += 10;
  }
  await getClients(state);
};

const closeDialog = () => {
  emit("closeDialog");
  DropdownComponent.value.onClearFilter();
};

const save = async () => {
  const { notify } = useNotification();
  const fetchData = {
    ...methodData.value,
    AgentId: props.agentId,
    WeekDay: props.weekDay.id,
  };
  isBtnLoading.value = true;
  const res = await gpsStore.getVisitAutoGenerate(
    fetchData,
    props.weekDay.type
  );
  isBtnLoading.value = false;
  if (res !== "error") {
    notify({ title: t("successful") });
    closeDialog();
  } else notify({ title: t("error"), type: "error" });
};

// Hooks

const startClientsData = computed(() => {
  const { items = [] } = clientsStart.value || {};
  const { LastClientId } = methodData.value || {};
  if (!clientsStart.value) {
    return undefined;
  }
  return {
    ...clientsStart.value,
    items: items.filter((item) => item.id !== LastClientId),
  };
});

const endClientsData = computed(() => {
  const { items = [] } = clientsEnd.value || {};
  const { FirstClientId } = methodData.value || {};
  if (!clientsEnd.value) {
    return undefined;
  }
  return {
    ...clientsEnd.value,
    items: items.filter((item) => item.id !== FirstClientId),
  };
});
<\/script>

<style lang="scss" scoped>
.week-day {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid #299b9b;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 15px;
  display: flex;
  background-color: #299b9b;
  justify-content: center;
  align-items: center;
  color: theme("colors.neutral.0");
}
</style>
`;export{n as default};
