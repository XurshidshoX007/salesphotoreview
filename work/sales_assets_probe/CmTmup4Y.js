const e=`<template>
  <d-modal
    data-container-width="80%"
    :loading="props.isLoading"
    @close-dialog="closeDialog"
    @click.stop
  >
    <template #header-button>
      <div class="flex justify-end">
        <search-input no-debounce @change="searchingValue = $event" />
      </div>
    </template>
    <div class="attach-user-content-container">
      <div class="attach-user-content">
        <div
          v-for="item in data"
          :key="item?.role?.id"
          v-show="item?.user_arr?.length"
        >
          <div
            class="flex justify-between bg-[#299B9B] px-3 py-2 color-white rounded-t-lg"
          >
            <div class="text-base">
              {{ item?.role?.name }}
            </div>
            <div class="pl-8 fs-14">
              <Checkbox
                :title="t('filters.choose_all')"
                :id="'select-all' + item.role.id"
                :disabled="!allowToSave"
                :checked="isAllChecked(item.role.id)"
                :indeterminate="isAllIndeterminate(item.role.id)"
                no-change-label-color
                @change="onAllSelect(item.role.id, $event)"
              />
            </div>
          </div>
          <div class="rounded-lg rounded-t-0 border px-2">
            <div
              class="max-h-70 body-content overflow-auto py-3 flex flex-col gap-2 px-2"
            >
              <div v-for="user in item.user_arr" :key="user.id">
                <Checkbox
                  :title="user.name"
                  :id="user.id"
                  :disabled="!allowToSave"
                  :checked="user.is_employee"
                  :is-in-active-item="!user.is_active"
                  @change="onUserSelect(user, $event)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type {
  EmployeeListModel,
  UserModel,
} from "~/interfaces/api/cashboxes/cashboxes-model";

// props
const props = defineProps<{
  data: EmployeeListModel[];
  id?: string;
  isLoading: boolean;
  allowToSave: boolean;
}>();

// emits
const emit = defineEmits(["closeDialog", "passCheckedIds"]);

// states
const { t } = useI18n();
const searchingValue = ref("");

// hooks
const data = computed(() => {
  return props.data.map((item) => {
    const user_arr = item.user_arr.filter((user) =>
      user.name.toLowerCase().includes(searchingValue.value.toLowerCase()),
    );

    return {
      ...item,
      user_arr,
    };
  });
});

// methods
const closeDialog = () => {
  event?.stopPropagation();
  event?.stopImmediatePropagation();
  emit("closeDialog");
};

const onUserSelect = (user: UserModel, isChecked: boolean) => {
  user.is_employee = isChecked;
};

const onAllSelect = (roleId: number, isChecked: boolean) => {
  const item = data.value.find((item) => item.role.id === roleId);

  if (!item) return;

  item.user_arr.forEach((user) => {
    user.is_employee = isChecked;
  });
};

const isAllChecked = (roleId: number) => {
  const item = data.value.find((item) => item.role.id === roleId);

  if (!item) return false;

  return item.user_arr.every((item) => item.is_employee);
};

const isAllIndeterminate = (roleId: number) => {
  const item = data.value.find((item) => item.role.id === roleId);

  if (!item) return false;

  return (
    item.user_arr.some((item) => item.is_employee) &&
    !item.user_arr.every((item) => item.is_employee)
  );
};
<\/script>

<style scoped>
.attach-user-content-container {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .attach-user-content {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    grid-gap: 20px;
    align-items: start;
  }
}

.body-content::-webkit-scrollbar {
  width: 10px;
}

.body-content::-webkit-scrollbar-track {
  background: #fafafa;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  margin-top: 10px;
}

.body-content::-webkit-scrollbar-thumb {
  border-radius: 10px;
  border: 3px solid transparent;
  background-clip: padding-box;
}
</style>
`;export{e as default};
