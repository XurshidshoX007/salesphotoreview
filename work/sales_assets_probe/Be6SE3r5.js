const e=`<template>
  <div>
    <div v-if="props.isLoading" class="w-full space-y-4 p-4">
      <skeleton-block v-for="i in 6" :key="i" :height="52" :width="200" />
    </div>
    <div v-else-if="!props.data.length">
      <div class="grid place-items-center p-8">
        <icon-process :size="96" />
        <page-title
          size="lg"
          weight="600"
          class="w-60 text-center"
          :title="t('access.all_available_operations_have_been_attached')"
        />
      </div>
    </div>
    <div v-else-if="!props.filteredData.length">
      <div class="grid place-items-center p-8">
        <icon-search-x :size="96" />
        <page-title
          size="lg"
          weight="600"
          class="w-52 text-center"
          :title="t('access.nothing_found_by_query')"
        />
      </div>
    </div>
    <side-menu
      v-else
      variant="tree"
      :data="filteredData"
      :open-items="openItems"
      :expand-max-duration="500"
      :classes="{
        root: 'overflow-x-hidden',
        wrapper: cn(
          'space-y-0 *:!left-0',
          '*:border-b *:last:border-b-none *:border-neutral-200',
        ),
        contentWrapper: 'pt-3 data-[level=0]:py-3',
        groupWrapper: cn(
          'mt-4 first:mt-0',
          'before:left-9.5',
          'data-[level=0]:before:content-none',
          'before:h-[calc(100%_+_16px)]',
        ),
        itemWrapper: cn(
          'data-[level=1]:pl-0',
          'left-7 data-[level=1]:left-5',
          'data-[level=1]:before:content-none',
        ),
      }"
      @update:open-items="$emit('update:openItems', $event)"
    >
      <template #level-0="{ item, isOpen, toggle }">
        <div
          class="flex justify-between bg-neutral-25 hover:bg-neutral-50 px-5 py-4 text-sm gap-2 cursor-pointer"
          @click="toggle()"
        >
          <icon-arrow-righti
            :class="
              cn(
                'size-5 transition-transform duration-300',
                isOpen ? '-rotate-90' : 'rotate-90',
              )
            "
          />

          <span class="font-semibold"> {{ item.name }} </span>

          <checkbox
            :id="item.id"
            :title="t('filters.choose_all')"
            :checked="
              tree.getCheckState(item, { excludedIds: [item.id] }).checked
            "
            :indeterminate="
              tree.getCheckState(item, { excludedIds: [item.id] }).indeterminate
            "
            class="ml-auto"
            @click.stop
            @change="
              tree.onSectionSelect(item, $event, {
                excludedIds: [item.id],
              })
            "
          />
        </div>
      </template>

      <template #default="{ item, isOpen, toggle, hasChildren }">
        <div class="flex items-center gap-2 w-full">
          <icon-arrow-righti
            v-if="hasChildren"
            :class="
              cn(
                'cursor-pointer transition-transform size-5 shrink-0 rotate-90',
                isOpen && '-rotate-90',
              )
            "
            @click.stop="toggle()"
          />
          <div v-else class="size-5 shrink-0" />
          <checkbox
            :checked="tree.getCheckState(item).checked"
            :indeterminate="tree.getCheckState(item).indeterminate"
            :title="item.name"
            :id="String(item.id)"
            :disabled="item.isDisabled || item.isInactive"
            :is-in-active-item="item.isInactive"
            class="overflow-hidden"
            @change="tree.onSectionSelect(item, $event)"
          />
          <tooltip
            v-if="(item as any).is_confirmation_required"
            :tooltip="t('access.confirmation_required')"
          >
            <icon-info-circle color="currentColor" />
          </tooltip>
        </div>
      </template>
    </side-menu>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { cn } from "~/utils/helpers";
import type { MenuTreeItemType } from "~/interfaces/ui/SideMenuTypes";
import type { TreeSelectionType } from "~/composables/useTreeSelection";

// Types
type Props = {
  data: MenuTreeItemType[];
  filteredData: MenuTreeItemType[];
  isLoading?: boolean;
  tree: TreeSelectionType<MenuTreeItemType>;
  openItems: Record<string, boolean>;
};

type Emits = {
  (e: "update:openItems", value: Record<string, boolean>): void;
};

// Props
const props = defineProps<Props>();

// Emits
defineEmits<Emits>();

// Composables
const { t } = useI18n();
<\/script>
`;export{e as default};
