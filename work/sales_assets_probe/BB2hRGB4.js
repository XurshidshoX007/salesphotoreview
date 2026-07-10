const e=`<template>
  <form @submit.prevent="save">
    <d-modal
      :name="id ? t('edit') : t('clients.add')"
      :loading="isLoading"
      @closeDialog="closeDialog"
    >
      <flex-col v-if="!isLoading" class="gap-5">
        <shared-localized-input
          required
          auto-focus
          :label="t('column.name')"
          v-model:base="data.default_name"
          v-model:translations="data.name_l10n"
        />
        <DropdownsByFilterStates :filter-states="filterStates" />
        <m-btn group="border" @click="isAttachDialogOpen = true">
          <div class="truncate">
            {{ addEmployeeBtnText }}
          </div></m-btn
        >
        <d-input
          type="number"
          :label="t('labels.sort')"
          :value="data.sort"
          @change="data.sort = $event"
        />
        <d-input
          pattern-type="code"
          :label="t('column.code')"
          :value="data.code"
          @change="data.code = $event"
        />
        <shared-localized-input
          :label="t('column.comment')"
          v-model:base="data.default_description"
          v-model:translations="data.description_l10n"
        />
        <LinkComponent @click="toggleShowHideLocation">
          {{ showLocationTitle }}
        </LinkComponent>
        <transition name="toggle-accordion-400">
          <div v-if="showLocation">
            <YandexMapComponent
              change-location
              :coordinate="initialLocation"
              @change-map="changeLocation"
            />
          </div>
        </transition>
        <Switch :active="data.is_active" @change="changeActivity" />
      </flex-col>
      <template #footer>
        <div v-if="allowToSave">
          <m-btn class="w-full" :loading="isBtnLoading" type="submit">
            {{ !data.id ? t("clients.add") : t("save") }}
          </m-btn>
        </div>
      </template>
    </d-modal>
  </form>
  <transition name="modal">
    <AttachUsersDialog
      v-if="isAttachDialogOpen"
      :data="employeeList"
      :id="data.id"
      :is-loading="isEmployeeListLoading"
      :allowToSave="allowToSave"
      @click.stop
      @closeDialog="closeAttachDialog"
    />
  </transition>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { CashboxEventKeys } from "~/variable/event-key-constants";
import { userTimeZone } from "~/utils/helpers";
import type {
  EmployeeListModel,
  CashboxesModel,
} from "~/interfaces/api/cashboxes/cashboxes-model";
import type { TimezoneModel } from "~/interfaces/api/constants/timezone-model";

// props
const props = defineProps<{
  id?: string;
  allowToSave: boolean;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// store
const cashboxesStore = useCashboxesStore("main");

// State
const { t } = useI18n();
const eventBus = useEventBus();
const isBtnLoading = ref(false);
const timezones = ref<TimezoneModel[]>();
const isLoading = ref<boolean>(false);
const updateListEventKey = CashboxEventKeys.CASHBOX_TABLE_UPDATE;
const isAttachDialogOpen = ref(false);
const employeeList = ref<EmployeeListModel[]>([]);
const isEmployeeListLoading = ref(false);
const showLocation = ref(false);

const data = ref<Partial<CashboxesModel>>({
  id: undefined,
  is_active: true as boolean,
  sort: null as number | null,
  name: "",
  default_name: "",
  name_l10n: {},
  employee_id_arr: [],
  code: null,
  default_description: "",
  description_l10n: {},
  time_zone: userTimeZone.value || "",
  location: null,
});
const initialDetailData = ref(); // used to store the detail data on edit

const filterStates = ref([
  {
    name: t("filters.time_zone"),
    key: "timezones",
    isSingleSelect: true,
    required: true,
    get data() {
      return formattedTimeZones.value || [];
    },
    get getSelectedData() {
      return data.value.time_zone || "";
    },
    set setSelectedData(value: string) {
      data.value.time_zone = value;
    },
  },
]);

// hooks
const formattedTimeZones = computed(() => {
  const formattedItems = Object.keys(timezones.value || []).map((key) => ({
    name: \`\${key} (\${timezones.value![key as keyof typeof timezones.value]})\`,
    id: key,
  }));
  return { items: formattedItems };
});

const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
});

const initialLocation = computed(() => {
  const { location } = data.value;
  const { latitude, longitude } = location || {};
  if (!location) return [null, null];
  return latitude ? [latitude, longitude] : [41.2825974, 69.2793667];
});

const checkedEmployeeIds = computed(() => {
  return employeeList.value.flatMap((item) =>
    item.user_arr.filter((user) => user.is_employee).map((user) => user.id),
  );
});

const checkedEmployeeNames = computed(() => {
  return employeeList.value.flatMap((item) =>
    item.user_arr.filter((user) => user.is_employee).map((user) => user.name),
  );
});

const addEmployeeBtnText = computed(() => {
  if (checkedEmployeeNames.value.length === 0)
    return props.id ? t("cash.edit_added_users") : t("cash.add_users");
  if (checkedEmployeeNames.value.length > 3) {
    return \`\${checkedEmployeeNames.value.slice(0, 3).join(", ")} и eщё \${
      checkedEmployeeNames.value.length - 3
    }\`;
  }
  return checkedEmployeeNames.value.join(", ");
});

const showLocationTitle = computed(() => {
  if (!data.value.location)
    return !showLocation.value ? t("add_location") : t("hide");
  else return !showLocation.value ? t("change_location") : t("hide_location");
});

watch(
  isAttachDialogOpen,
  async (isOpen) => {
    if (isOpen) await getEmployees();
  },
  { once: true },
);

onBeforeMount(async () => {
  if (props.id !== undefined) {
    isLoading.value = true;
    await Promise.all([getDetailById(props.id)]);
    isLoading.value = false;
  }
  await getTimeZones();
});

// methods
const closeDialog = () => {
  emit("closeDialog");
};

const changeActivity = (isActive: boolean) => {
  data.value.is_active = isActive;
};

const toggleShowHideLocation = () => {
  showLocation.value = !showLocation.value;
};

const closeAttachDialog = () => {
  data.value.employee_id_arr = checkedEmployeeIds.value;
  isAttachDialogOpen.value = false;
};

const changeLocation = (coords: number[]) => {
  data.value.location = {
    latitude: coords[0],
    longitude: coords[1],
  };
};

const updateListByActiveState = (isActive: boolean) => {
  if (isActiveStateChangedOnEdit.value) {
    eventBus.emit(updateListEventKey, !isActive);
    emit("clearFetchedTab", !isActive);
    return;
  }
  eventBus.emit(updateListEventKey, isActive);
};

const save = async () => {
  isBtnLoading.value = true;
  const res = await cashboxesStore.add(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active!);
    notify({ title: t("saved") });
    closeDialog();
  }
  isBtnLoading.value = false;
};

const getDetailById = async (id: string) => {
  initialDetailData.value = await cashboxesStore.getById(id);
  data.value = { ...initialDetailData.value };
};

const getTimeZones = async () => {
  timezones.value = await cashboxesStore.getTimeZones();
};

const getEmployees = async () => {
  isEmployeeListLoading.value = true;
  const _data = await cashboxesStore.getEmployees(props.id);
  if (_data) employeeList.value = _data;
  isEmployeeListLoading.value = false;
};
<\/script>

<style scoped>
#map {
  width: 100%;
  height: 400px;
}
</style>
`;export{e as default};
