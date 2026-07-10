const n=`<template>
  <menu-btn-2
    v-if="props.statusData"
    without-padding
    arrow
    size-free
    :content-z-index="8"
    @click="onToggleStatusDropdown(statusData?.id)"
    @onChangeIsActive="isDropDownOpen = $event"
  >
    <template #btn>
      <div class="whitespace-normal">
        <button
          :style="{
            backgroundColor: statusColor + '48',
          }"
          :disabled="readonly"
          class="text-white rounded-md outline-none hover:opacity-80 select-none"
          :class="[
            dataId &&
              isSettingStatusLoading === dataId &&
              'cursor-not-allowed opacity-30',
          ]"
        >
          <div
            :style="\`color: \${statusColor}\`"
            class="flex flex-row items-center gap-2 fs-14 fw-4 px-3 py-1 text-left"
          >
            <IconLoading
              v-if="dataId && isSettingStatusLoading === dataId"
              :loading="true"
              color="#fff"
              :width="4"
              :height="4"
            />
            <fa-icon
              v-else-if="!readonly"
              :style="\`color: \${statusColor}\`"
              hash="&#xf078;"
              class="text-xs transition-all transform"
              :class="isDropDownOpen ? 'rotate-180' : ''"
            />
            {{ statusData?.name }}
            <IconPartialReturn
              v-show="hasPartialReturn && isPartialReturnApproved"
              :color="statusColor"
            />
            <icon-exclamation
              v-show="hasPartialReturn && !isPartialReturnApproved"
              :size="30"
              :tooltip="t('orders.partial_return_not_confirmed_message')"
            />
          </div>
        </button>
      </div>
    </template>
    <template #content>
      <div class="flex flex-col">
        <div v-if="!availableStatusesById?.length" class="p-3 fs-14">
          {{ t("orders.no_statuses_available") }}
        </div>
        <div v-else>
          <div
            v-for="status in availableStatusesById"
            :key="status?.id"
            class="cursor-pointer border-b-1 w-full px-4 py-3 hover:bg-teal-100 active:bg-teal-200 whitespace-nowrap"
            @click="onChangeStatusById(status?.id, dataId)"
          >
            <button class="text-sm">{{ status.name }}</button>
          </div>
        </div>
      </div>
    </template>
  </menu-btn-2>
</template>

<script setup lang="ts">
import type { ConstantModel } from "~/interfaces/api/constants/library-constants-model";
import { getLibConstantsByKey } from "~/utils/local-storage";
import { variableData } from "~/variable/variable";
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  dataId?: string;
  statusData: (Omit<ConstantModel, "key"> & { key?: string }) | undefined;
  availableStatusesById?: Array<Record<string, string | number>>;
  isSettingStatusLoading?: boolean | string | null;
  typeId?: number;
  readonly?: boolean;
  type?: string;
  hasPartialReturn?: boolean;
  isPartialReturnApproved?: boolean;
}>();

// emits
const emit = defineEmits(["onOpenStatusDropdown", "onChangeStatusById"]);

// states
const { t } = useI18n();
const { isActive: isOpen } = variableData;
const isDropDownOpen = ref<boolean | string>();
const statusConstants = ref<ConstantModel[] | undefined>();

// asyncs
const getOrderStatuses = async () => {
  statusConstants.value =
    await getLibConstantsByKey<ConstantModel[]>("OrderStatus");
};

const getVanSellingStatuses = async () => {
  statusConstants.value = await getLibConstantsByKey<ConstantModel[]>(
    "VanSellingOrderStatus"
  );
};

const getIncomeStatuses = async () => {
  statusConstants.value = await getLibConstantsByKey<ConstantModel[]>(
    "IncomeProductStatus"
  );
};

// hooks
const readonly = computed(() => props.readonly || false);

watchEffect(async () => {
  if (props.type) {
    switch (props.type) {
      case "van-selling":
        return await getVanSellingStatuses();
      case "income":
        return await getIncomeStatuses();
      case "order":
        return await getOrderStatuses();
    }
  }
});

const statusColor = computed(() => {
  if (!props.statusData?.hex_color) {
    return (
      statusConstants.value?.find(
        (status) => status?.id === props.statusData?.id
      )?.hex_color || "#000000"
    );
  }
  return props.statusData.hex_color;
});

// methods
const onToggleStatusDropdown = (statusId: number | string | undefined) => {
  emit("onOpenStatusDropdown", { statusId, typeId: props.typeId });
};

const onChangeStatusById = (statusId: string | number, dataId?: string) => {
  emit("onChangeStatusById", statusId, dataId);
  isOpen.value = false;
};
<\/script>
`;export{n as default};
