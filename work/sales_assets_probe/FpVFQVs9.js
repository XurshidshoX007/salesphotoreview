const n=`<template>
  <form @submit.prevent="save">
    <d-modal
      :name="props.id ? t('edit') : t('clients.add')"
      @closeDialog="closeDialog"
      :loading="isLoading"
    >
      <flex-col class="gap-5">
        <d-input
          required
          :label="t('labels.first_name')"
          type="text"
          id="first_name"
          focusable
          :value="methodData.first_name"
          @change="methodData.first_name = $event"
        />
        <d-input
          required
          :label="t('labels.last_name')"
          type="text"
          id="last_name"
          :value="methodData.last_name"
          @change="methodData.last_name = $event"
        />
        <d-input
          :label="t('labels.middle_name')"
          type="text"
          id="middle_name"
          :value="methodData.middle_name"
          @change="methodData.middle_name = $event"
        />
        <d-input
          :label="t('column.phone')"
          type="tel"
          id="phone"
          :value="methodData.phone"
          @change="methodData.phone = $event"
        />
        <d-input
          :label="t('column.code')"
          type="text"
          pattern-type="code"
          id="code"
          :value="methodData.code"
          @change="methodData.code = $event"
        />
        <d-input
          :label="t('column.pinfl')"
          type="text"
          pattern-type="pinfl"
          id="national_id_number"
          :value="methodData.national_id_number"
          @change="methodData.national_id_number = $event || null"
        />
        <DropdownsByFilterStates
          :filter-states="dropdownState"
          @onOpenDropdown="onOpenDropdown"
        />
        <d-input
          required
          :label="t('column.login')"
          type="text"
          id="login"
          pattern-type="code"
          :value="methodData.login"
          @change="methodData.login = $event"
        />
        <m-btn
          v-if="props.id && !isChangePassword"
          class="w-full"
          group="outlined"
          @click.stop="isChangePassword = true"
          >{{ t("settings.edit_password") }}</m-btn
        >
        <transition name="toggle-accordion">
          <div v-if="isChangePassword" class="flex-row">
            <d-input
              :required="!props.id"
              :label="t('labels.password')"
              type="password"
              id="password"
              pattern-type="code"
              class="w-full"
              :value="methodData.password"
              @change="methodData.password = $event"
            />
          </div>
        </transition>
        <Switch
          v-if="!props.id"
          :active="methodData.is_active"
          @change="changeActivity"
        />
      </flex-col>
      <template #footer>
        <m-btn class="w-full" type="submit" :loading="isBtnLoading">
          {{ props.id ? t("save") : t("clients.add") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { defaultDropdownParams, dropdownParamsAll } from "~/variable/params";
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { UsersEventKeys } from "~/variable/event-key-constants";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";

// store
const auditorStore = useAuditorsStore("main");

// props
const props = defineProps<{
  id?: string;
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["closeDialog"]);

// states
const { t } = useI18n();
const eventBus = useEventBus();
const isBtnLoading = ref<boolean>(false);
const isChangePassword = ref(!!!props?.id);
const isLoading = ref<boolean>(false);
const updateListEventKey = UsersEventKeys.AUDITOR_TABLE_UPDATE;
const territories = ref<DropdownItemsModelByType<DropdownModel>>();
const branches = ref<DropdownItemsModelByType<DropdownModel>>();
const rolePositions = ref<DropdownItemsModelByType<DropdownModel>>();

const dropdownParams = ref(
  props.id ? { ...dropdownParamsAll } : { ...defaultDropdownParams },
);

const territoryParams = ref(dropdownParams.value);
const branchesParams = ref(dropdownParams.value);

const methodData = ref<AuditorSaveModel>({
  first_name: "",
  middle_name: "",
  last_name: "",
  phone: "",
  login: "",
  code: null,
  color: "#299B9B",
  territory_ids: [],
  password: "",
  is_active: true,
  national_id_number: null,
  branch_id: null,
  role_position_id: null,
});

const dropdownState = ref([
  {
    name: t("column.branch"),
    key: "branches",
    isSingleSelect: true,
    isClearable: true,
    get data() {
      return branches.value;
    },
    get getSelectedData() {
      return methodData.value.branch_id;
    },
    set setSelectedData(value: string) {
      methodData.value.branch_id = value;
    },
  },
  {
    name: t("settings_sidebar.territory"),
    key: "territory",
    get isLoading() {
      return isLoading.value;
    },
    get data() {
      return territories.value || [];
    },
    get getSelectedData() {
      return methodData.value.territory_ids;
    },
    set setSelectedData(value: string[]) {
      methodData.value.territory_ids = value;
    },
    required: true,
    isTreeView: true,
  },
  {
    name: t("column.role_position"),
    key: "role-positions",
    isSingleSelect: true,
    isClearable: true,
    get data() {
      return rolePositions.value;
    },
    get getSelectedData() {
      return methodData.value.role_position_id;
    },
    set setSelectedData(value: string | null) {
      methodData.value.role_position_id = value;
    },
  },
]);

// hooks
onMounted(async () => {
  if (props.id) {
    isLoading.value = true;
    await Promise.all([
      getTerritories(),
      getDetail(),
      getBranches(),
      getRolePositions(),
    ]);
    isLoading.value = false;
  }
});

// methods
const changeActivity = (isActive: boolean) => {
  methodData.value.is_active = isActive;
};

const onOpenDropdown = async (state: string) => {
  if (state === "territory" && !territories.value) {
    await getTerritories();
  } else if (state === "branches" && !branches.value) {
    await getBranches();
  } else if (state === "role-positions" && !rolePositions.value) {
    await getRolePositions();
  }
};

const closeDialog = () => emit("closeDialog");

const updateListByActiveState = (isActive: boolean) => {
  eventBus.emit(updateListEventKey, { isActiveEvent: isActive });
};

const save = async () => {
  isBtnLoading.value = true;
  const res = await auditorStore.add(methodData.value);
  if (res !== "error") {
    updateListByActiveState(methodData.value.is_active ?? props.isActive);
    closeDialog();
    notify({ title: t("toast.success"), type: "success" });
  }
  isBtnLoading.value = false;
};

const getDetail = async () => {
  methodData.value = await auditorStore.getDetail(props.id!);
};

const getTerritories = async () => {
  territories.value = await auditorStore.getTerritories(territoryParams.value);
};

const getBranches = async () => {
  branches.value = await auditorStore.getBranches(branchesParams.value);
};

const getRolePositions = async () => {
  rolePositions.value = await auditorStore.getAuditorRolePositions();
};
<\/script>
`;export{n as default};
