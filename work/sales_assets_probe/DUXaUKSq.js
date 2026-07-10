const e=`<template>
  <side-menu
    searchable
    variant="single"
    :data="data"
    :search-keys="['login', 'name', 'role.name']"
    :loading="accessStore.isUsersLoading"
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
        @click="accessStore.activeUserId = item.id"
        :class="
          cn(
            'rounded-[10px] p-2.5 gap-2 hover:bg-neutral-50 transition-color cursor-pointer space-y-1.5 border border-neutral-200',
            accessStore.activeUserId === item.id &&
              'bg-[#EFF6F6] border-primary-600/20',
          )
        "
      >
        <div class="text-primary-600 font-medium">{{ item.login }}</div>
        <div>{{ item.name }}</div>
        <div class="flex justify-between items-center gap-2 text-xs mt-2.5">
          <div
            class="flex items-center gap-1 p-1 rounded-lg px-2 select-none border border-neutral-200 bg-white"
          >
            <span
              :style="{ backgroundColor: getStatusColor(item.role.id) }"
              class="shrink-0 size-2 rounded-full"
            />
            {{ item.role.name }}
          </div>
          <div class="flex items-center gap-1 text-neutral-600 font-medium">
            <IconLink
              class="shrink-0"
              :color="getHexByTWColor('text-neutral-600')"
            />
            {{ t("access.n_operations", item.accessed_operations_count) }}
          </div>
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
import type { AccessUsersModel } from "~/interfaces/api/access/menu-model";

// Type
type Props = {
  data: (MenuBaseItem & AccessUsersModel)[];
};

// Props
defineProps<Props>();

// Composables
const { t } = useI18n();

// Stores
const accessStore = useAccessUsersStore();

// Methods
const getStatusColor = (roleId: number) => {
  switch (roleId) {
    case 2: //operator
      return "#057CD1"; // ko'k
    case 3: //kassir
      return "#23C00A"; //zangor
    case 4: // superviserscript return "#410076"; //pushti
    case 5: //menejer
      return "#1B2CC3"; //siyohrang
    case 10: //partner
      return "#D10505"; //qizil
    case 8: //skladchi
      return "#BD7F06"; //sariq
    default:
      return "#410076";
  }
};
<\/script>
`;export{e as default};
