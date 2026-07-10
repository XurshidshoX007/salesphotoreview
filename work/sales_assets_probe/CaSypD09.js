const n=`<template>
  <div
    :class="
      cn(
        baseClasses,
        getStatus?.(props.fieldKey) === 'danger' &&
          'text-red-500 bg-red-500/10 [&>svg]:text-red-500',
      )
    "
  >
    <div>
      {{ items[props.fieldKey]?.value }}
    </div>
    <component :is="items[props.fieldKey]?.icon" />
  </div>
</template>

<script setup lang="ts">
import {
  IconBonus,
  IconCalendar,
  IconEquipment,
  IconFileCheck,
  IconFileProcessing,
  IconFileSearch,
  IconFileX,
  IconHash,
} from "#components";
import { cn, type Component } from "#imports";

type Props = {
  data: ClientDuplicationsModel;
  fieldKey: keyof ClientDuplicationsModel;
  getStatus?: (key: string) => "danger" | "primary";
};

// Props
const props = defineProps<Props>();

// Constants
const baseClasses = cn(
  "h-10 flex items-center justify-between rounded-[10px] px-3 gap-2",
  "[&>*:first-child]:truncate [&>*:first-child]:min-w-0",
  "[&>svg]:shrink-0 [&>svg]:text-primary-600",
);

const items: Record<
  string,
  {
    value: string | number | null;
    icon: Component;
  }
> = {
  code: {
    value: props.data.code,
    icon: IconHash,
  },
  order_count: {
    value: props.data.order_count,
    icon: IconFileCheck,
  },
  not_completed_orders: {
    value: props.data.not_completed_orders?.length,
    icon: IconFileProcessing,
  },
  reject_count: {
    value: props.data.reject_count,
    icon: IconFileX,
  },
  audit_facing_count: {
    value: props.data.audit_facing_count,
    icon: IconFileSearch,
  },
  bonus_count: {
    value: props.data.bonus_count,
    icon: IconBonus,
  },
  client_device_count: {
    value: props.data.client_device_count,
    icon: IconEquipment,
  },
  last_modified_date: {
    value: props.data.last_modified_date
      ? getFormattedDate(props.data.last_modified_date)
      : "",
    icon: IconCalendar,
  },
};
<\/script>
`;export{n as default};
