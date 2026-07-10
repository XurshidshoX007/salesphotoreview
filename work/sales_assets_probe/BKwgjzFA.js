const n=`<template>
  <div class="mt-1 ml-[5px]">
    <template v-for="(group, groupIndex) in groups" :key="groupIndex">
      <div
        v-if="isGroupTitleShowable(group)"
        :class="
          cn(
            'flex items-center uppercase text-[9px] font-semibold text-white/50 mb-1 mt-3',
            \`before:content-[''] before:w-[18px] before:h-px before:bg-white/20 before:mr-2\`,
            \`after:content-[''] after:flex-grow after:h-px after:bg-white/20 after:ml-2\`,
            groupIndex === 0 && 'mt-1'
          )
        "
      >
        {{ group.name }}
      </div>

      <template v-for="(item, itemIndex) in group.items" :key="itemIndex">
        <div v-if="item.isShowable !== false">
          <component
            :is="item.action ? 'div' : NuxtLink"
            :to="item.action ? undefined : buildItemUrl(item)"
            :class="
              cn('flex items-center group', item.action && 'cursor-pointer')
            "
            @click="(e: MouseEvent) => emit('changeUrl', item, e)"
          >
            <component
              v-if="item.icon"
              :is="loadIcon(item.icon)"
              :class="
                cn(
                  'shrink-0 transition-colors group-hover:text-white',
                  isUrlActive(item.url) ? 'text-white' : 'text-neutral-400'
                )
              "
              :size="18"
            />
            <IconDot
              v-else
              :class="
                cn(
                  'shrink-0 transition-colors group-hover:text-[#12D9D9]',
                  isUrlActive(item.url) ? 'text-[#12D9D9]' : 'text-[#12D9D980]'
                )
              "
              :size="18"
            />
            <div
              :class="
                cn(
                  'w-[195px] shrink-0 py-2 px-1.5 rounded-lg leading-normal group-hover:bg-white/5 transition-colors',
                  'group-data-[for-mobile=true]/sidebar:flex-grow',
                  isUrlActive(item.url)
                    ? 'bg-white/10 text-white'
                    : 'text-gray-300'
                )
              "
            >
              {{ item.name }}
            </div>
          </component>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { NuxtLink } from "#components";
import { cn } from "#imports";
import { useTenantPath } from "~/composables/useTenantPath";
import type { SidebarMenuGroupType } from "~/interfaces/ui/SidebarMenuTypes";

// Types
type Props = {
  groups: SidebarMenuGroupType[] | undefined;
};

type Emits = {
  (e: "changeUrl", item: SidebarMenuItemType, event: MouseEvent): void;
};

// Props
const props = defineProps<Props>();

// Emits
const emit = defineEmits<Emits>();

// Composables
const { withTenant, isFullPathActive } = useTenantPath();

// Methods
const loadIcon = (iconName: string) => {
  return defineAsyncComponent(
    () => import(\`@/components/icon/\${iconName}.vue\`)
  );
};

const isGroupTitleShowable = (group: SidebarMenuGroupType) => {
  if (!group.name) return false;
  if (!group.items || group.items.length === 0) return false;

  return group.items.some((item) => item.isShowable !== false);
};

const buildItemUrl = (item: SidebarMenuItemType) => {
  if (!item.url) return "#";
  return withTenant(item.url);
};

const isUrlActive = (url?: string) => {
  // Use tenant-aware path comparison
  return isFullPathActive(url);
};
<\/script>
`;export{n as default};
