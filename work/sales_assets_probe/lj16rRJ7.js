const e=`<template>
  <side-menu
    searchable
    variant="single"
    :data="data"
    :loading="paymentMethodStore.isPaymentMethodsLoading"
    :classes="{
      root: 'border-none rounded-none h-full flex flex-col',
      searchWrapper: 'p-0 px-5 pb-4 border-b border-neutral-200 flex-shrink-0',
      itemWrapper: 'border-none',
      wrapper:
        'flex-1 overflow-y-auto scrollbar-default space-y-2.5 ml-5 mr-2 pr-1.5 pt-2.5',
    }"
  >
    <template #default="{ item }">
      <div
        @click="paymentMethodStore.activePaymentMethodId = item.id"
        :class="
          cn(
            'rounded-[10px] p-2.5 gap-2 hover:bg-neutral-50 transition-color cursor-pointer space-y-1.5 border border-neutral-200',
            paymentMethodStore.activePaymentMethodId === item.id &&
              'bg-[#EFF6F6] border-primary-600/20 text-primary-600',
          )
        "
      >
        <div class="font-medium">{{ item.name }}</div>
        <div
          class="flex items-center gap-1 text-xs text-neutral-600 font-medium"
        >
          <IconLink
            class="shrink-0"
            :color="getHexByTWColor('text-neutral-600')"
          />
          {{
            t(
              "access.users_attached",
              item.allowed_to_create_payment_user_count,
            )
          }}
        </div>
      </div>
    </template>
  </side-menu>
</template>

<script setup lang="ts">
import { IconLink } from "#components";
import { useI18n } from "vue-i18n";
import { cn, getHexByTWColor } from "~/utils/helpers";
import type { MenuBaseItem } from "~/interfaces/ui/SideMenuTypes";
import type { AccessPaymentMethodModel } from "~/interfaces/api/access/payment-method-model";

// Types
type Props = {
  data: (MenuBaseItem & AccessPaymentMethodModel)[];
};

// Props
defineProps<Props>();

// Composables
const { t } = useI18n();

// Stores
const paymentMethodStore = useAccessPaymentMethodStore();
<\/script>
`;export{e as default};
