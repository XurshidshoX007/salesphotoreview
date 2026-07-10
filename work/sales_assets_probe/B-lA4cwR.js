const n=`<template>
  <card :classes="{ root: 'h-full px-0', content: 'h-full' }">
    <side-menu
      searchable
      variant="tree"
      hide-lines
      :expand-max-duration="500"
      :data="operationMenu"
      :loading="accessStore.isOperationsLoading"
      :classes="{
        root: 'border-none rounded-none h-full flex flex-col',
        searchWrapper: 'p-5 pt-0 border-none flex-shrink-0',
        itemWrapper: 'border-none pl-2',
        groupWrapper: 'mt-2',
        wrapper:
          'space-y-0 flex-1 overflow-y-auto scrollbar-default -ml-2 border-t border-neutral-200',
        contentWrapper: 'mb-2',
      }"
    >
      <template #level-0="{ item, isOpen, toggle }">
        <div
          @click="toggle()"
          :class="
            cn(
              'flex items-center gap-2 hover:bg-neutral-50 transition-colors cursor-pointer px-5 py-4 border-b border-neutral-200 font-medium',
              isOpen ? 'bg-neutral-50' : 'bg-neutral-25',
            )
          "
        >
          <icon-arrow-righti
            :class="
              cn(
                'size-5 transition-transform duration-300',
                isOpen ? '-rotate-90' : 'rotate-90',
              )
            "
          />
          <span>{{ item.name }}</span>
        </div>
      </template>

      <template #default="{ item, isOpen, hasChildren, toggle }">
        <!-- NESTED GROUP -->
        <div
          v-if="hasChildren"
          @click="toggle()"
          :class="
            cn(
              'flex items-center gap-2 hover:bg-neutral-50 transition-colors cursor-pointer p-3 rounded-[10px] mr-2 font-normal border border-neutral-200',
              item.node && hasActiveChild(item.node) && 'text-primary-600',
            )
          "
        >
          <icon-arrow-righti
            :class="
              cn(
                'size-5 transition-transform duration-300',
                isOpen ? '-rotate-90' : 'rotate-90',
              )
            "
          />
          <span>{{ item.name }}</span>
        </div>

        <!-- OPERATION -->
        <div
          v-else
          @click="accessStore.activeOperationId = item.operationId"
          :class="
            cn(
              'rounded-[10px] ml-5 p-2.5 space-y-1.5 hover:bg-neutral-50 transition-colors cursor-pointer mr-2 border border-neutral-200',
              accessStore.activeOperationId === item.operationId &&
                'bg-[#EFF6F6] border-primary-600/20',
            )
          "
        >
          <div
            :class="
              cn(
                'transition-colors text-neutral-950',
                accessStore.activeOperationId === item.operationId &&
                  'text-primary-600',
              )
            "
          >
            {{ item.name }}
          </div>
          <div
            class="flex items-center gap-1 text-neutral-600 font-medium text-xs"
          >
            <IconLink
              class="shrink-0"
              :color="getHexByTWColor('text-neutral-600')"
            />
            {{ t("access.users_attached", item.accessed_users_count ?? 0) }}
          </div>
        </div>
      </template>
    </side-menu>
  </card>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { IconLink } from "#components";
import { cn, getHexByTWColor } from "~/utils/helpers";
import type { MenuBaseItem } from "~/interfaces/ui/SideMenuTypes";
import type {
  OperationsModel,
  OperationModel,
} from "~/interfaces/api/access/unattached-by-operations-model";

type MenuItem = MenuBaseItem & {
  type: "group" | "operation";
  node?: OperationsModel;
  operationId?: number;
  accessed_users_count?: number;
  children?: MenuItem[][];
};

// Store
const accessStore = useAccessOperationsStore();

// Composables
const { t } = useI18n();

// Hooks
const operationMenu = computed((): MenuItem[] => {
  if (!accessStore.operations?.length) return [];
  return accessStore.operations.map(mapGroup);
});

// Methods
const mapOperation = (op: OperationModel): MenuItem => ({
  id: \`op-\${op.id}\`,
  name: op.name,
  type: "operation",
  operationId: op.id,
  accessed_users_count: op.accessed_users_count,
});

const mapGroup = (node: OperationsModel): MenuItem => {
  const childGroups: MenuItem[][] = [];
  if (node.children.length > 0) childGroups.push(node.children.map(mapGroup));
  if (node.operation_list.length > 0)
    childGroups.push(node.operation_list.map(mapOperation));
  return {
    id: \`group-\${node.id}\`,
    name: node.name,
    type: "group",
    node,
    children: childGroups.length > 0 ? childGroups : undefined,
  };
};

const hasActiveChild = (node: OperationsModel): boolean => {
  const activeId = accessStore.activeOperationId;
  if (!activeId) return false;
  if (node.operation_list.some((op) => op.id === activeId)) return true;
  return node.children.some(hasActiveChild);
};
<\/script>
`;export{n as default};
