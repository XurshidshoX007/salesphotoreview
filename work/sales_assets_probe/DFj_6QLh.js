const e=`<template>
  <d-modal
    data-container-width="884px"
    :name="t('sessions.changing_limits')"
    :loading="props.isLoading"
    @close-dialog="closeDialog"
  >
    <div class="flex justify-between items-center mb-5">
      <CountButtons
        :multiple="true"
        :default-value="limits"
        :on-change="handleLimitsChange"
      >
        <template #decrease-content>
          {{ t("sessions.minus_one_from_limit") }}
        </template>
        <template #increase-content>
          {{ t("sessions.plus_one_to_limit") }}
        </template>
      </CountButtons>

      <div class="flex items-center gap-2.5">
        <div class="relative">
          <input
            type="number"
            min="0"
            class="border border-gray-40 rounded-[10px] w-44 h-10 pl-10 text-sm"
            :placeholder="t('enter_number')"
            v-model="generalLimit"
          />
          <IconDevices
            class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
        </div>
        <m-btn
          class="shrink-0"
          :disabled="!(typeof generalLimit === 'number')"
          @click="handleApplyForAll"
        >
          {{ t("apply") }}
        </m-btn>
      </div>
    </div>
    <div class="table-content-container overflow-hidden mb-5">
      <div class="table-content-body">
        <data-table
          :headers="headers"
          with-information-above-header
          :is-empty="!items.length"
          :check="isTableAllChecked"
          :indeterminate="isTableIndeterminate"
          @get-all-id="getAllItemIds"
        >
          <template #body>
            <c-tr
              v-for="data in items"
              :key="data.id"
              class="border-t-1 border-b-0"
            >
              <c-td-no-edit
                v-for="column in headers"
                :key="column.key"
                :is-checked="column.checked"
                :type="column.type"
              >
                <Checkbox
                  v-if="column.key === 'checkbox' && !!data.id"
                  :id="data.id"
                  :checked="selectedItemIds.includes(data.id)"
                  @change="onSelectItem($event, data.id)"
                />
                <div
                  v-else-if="column.key === 'allowed_active_session_count'"
                  class="rounded-md border border-nautral-200 py-1 px-2 flex items-center gap-1 text-xs w-fit"
                >
                  <IconDevices class="text-primary-600" />
                  <span>{{ data.allowed_active_session_count }}</span>
                </div>
                <div v-else>
                  {{ getValue(data, column.key, column.type) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
    </div>

    <div class="flex justify-end">
      <m-btn :loading="isSaving" @click="handleLimitsUpdate">
        {{ t("save") }}
      </m-btn>
    </div>
  </d-modal>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type { SessionsLimitsItemModel } from "~/interfaces/api/sessions/sessions-modal";

type Props = {
  items: SessionsLimitsItemModel[];
  isLoading?: boolean;
};

type Emits = {
  (e: "closeDialog"): void;
  (e: "onSuccess"): void;
};

// props
const props = defineProps<Props>();

// emits
const emit = defineEmits<Emits>();

// stores
const multipleSessionsStore = useMultipleSessionsStore();

// composables
const { t } = useI18n();

// states
const items = ref<SessionsLimitsItemModel[]>([]);
const generalLimit = ref<number>();
const isSaving = ref(false);
const selectedItemIds = ref<string[]>([]);

// hooks
onUnmounted(() => {
  multipleSessionsStore.$dispose();
});

watch(
  () => props.items,
  (newItems) => {
    if (newItems?.length) {
      items.value = [...newItems];
      selectedItemIds.value = newItems.map((item) => item.id);
    }
  },
  { immediate: true }
);

const isTableAllChecked = computed(() => {
  return (
    !!items.value.length &&
    items.value.every((item) => selectedItemIds.value.includes(item.id))
  );
});

const isTableIndeterminate = computed(() => {
  if (isTableAllChecked.value || !items.value.length) {
    return false;
  }

  return items.value.some((item) => selectedItemIds.value.includes(item.id));
});

const headers = computed(() =>
  multipleSessionsStore.headers.filter(
    (item) => item.key !== "active_session_count"
  )
);

const limits = computed(() =>
  items.value
    .filter((item) => selectedItemIds.value.includes(item.id))
    .map((item) => ({
      id: item.id,
      value: item.allowed_active_session_count,
    }))
);

// methods
const closeDialog = () => emit("closeDialog");

const onSuccess = () => emit("onSuccess");

const getValue = (
  data: SessionsLimitsItemModel,
  key: string,
  type?: string
) => {
  return getDataValue<SessionsLimitsItemModel>(data, key, type);
};

const getAllItemIds = (isChecked: boolean) => {
  if (isChecked) {
    items.value.forEach((item) => {
      selectedItemIds.value.push(item.id);
    });
  } else {
    selectedItemIds.value = [];
  }
};

const onSelectItem = (value: boolean, id: string) => {
  if (value) {
    selectedItemIds.value.push(id);
  } else {
    selectedItemIds.value = selectedItemIds.value.filter((item) => item !== id);
  }
};

const handleLimitsChange = (updatedLimits: { id: string; value: number }[]) => {
  const updatedLimitsMap = updatedLimits.reduce<Record<string, number>>(
    (acc, item) => {
      acc[item.id] = item.value;
      return acc;
    },
    {}
  );

  items.value = items.value.map((prevItem) => {
    if (selectedItemIds.value.includes(prevItem.id)) {
      return {
        ...prevItem,
        allowed_active_session_count: updatedLimitsMap[prevItem.id],
      };
    }
    return prevItem;
  });
};

const handleApplyForAll = () => {
  if (typeof generalLimit.value !== "number") return;

  const limitValue = generalLimit.value;

  items.value = items.value.map((prevItem) => {
    if (selectedItemIds.value.includes(prevItem.id)) {
      return {
        ...prevItem,
        allowed_active_session_count: limitValue,
      };
    }
    return prevItem;
  });
};

const handleLimitsUpdate = async () => {
  try {
    isSaving.value = true;

    await multipleSessionsStore.updateMultipleSessionLimit(
      items.value
        .filter((item) => selectedItemIds.value.includes(item.id))
        .map((item) => ({
          user_id: item.id,
          allowed_active_session_count: item.allowed_active_session_count,
        }))
    );

    notify({ title: t("successfully"), type: "success" });

    onSuccess();
  } catch (error) {
    notify({ title: t("toast.error"), type: "error" });
    console.error(error);
  } finally {
    isSaving.value = false;
  }
};
<\/script>

<style scoped lang="scss">
.table-content-body {
  max-height: 400px;
  overflow-y: auto;
  padding-bottom: 0;
}

.table-content-body::-webkit-scrollbar {
  width: 10px;
}

.table-content-body::-webkit-scrollbar-track {
  background: #fafafa;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  margin-top: 10px;
}

.table-content-body::-webkit-scrollbar-thumb {
  border-radius: 10px;
  border: 3px solid transparent;
  background-clip: padding-box;
}
</style>
`;export{e as default};
