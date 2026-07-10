const e=`<template>
  <flex-row class="gap-y-2">
    <flex-col
      v-if="headerVariant === 'primary'"
      class="w-52 flex-shrink-0 gap-2.5 px-2.5 bg-white sticky left-0 z-10"
    >
      <div class="text-neutral-600 text-sm line-clamp-1 px-2.5">
        {{ headersLabel }}
      </div>

      <flex-col class="gap-3 py-2.5">
        <div
          v-for="header in headers"
          :key="header.key"
          class="bg-primary-100 text-primary-600 px-3 py-2.5 rounded-[10px] text-sm font-medium"
        >
          <slot :name="\`header_\${header.key}\`" :header="header">
            <slot name="header-cell" :header="header">
              {{ header.name }}
            </slot>
          </slot>
        </div>
      </flex-col>
    </flex-col>

    <card
      v-else
      :classes="{
        root: 'w-[253px] flex-shrink-0 text-sm mb-4',
        header: ['items-start gap-1 px-1 leading-6', menuHeaderTall && 'h-11'],
      }"
    >
      <template #header>
        <slot name="menu-header">
          <span class="w-4 text-center">●</span>{{ headersLabel }}
        </slot>
      </template>
      <slot name="menu">
        <MultiPanelMenu
          :menus="headers"
          :open-items="openItems"
          @update:open-items="emit('update:openItems', $event)"
        />
      </slot>
    </card>

    <slot v-if="prepentIsFixed" name="prepend" />
    <slot v-if="isLoading" name="loading-columns" />
    <flex-row
      v-else
      class="gap-2.5 overflow-x-auto pb-2.5"
      :class="cn(contentClass)"
    >
      <slot v-if="!prepentIsFixed" name="prepend" />

      <flex-col
        v-for="(row, index) in enteredData"
        :key="getRowKey(row, index)"
        :class="[columnWidthClass, 'flex-shrink-0 gap-2.5']"
      >
        <slot name="column" :row="row" :row-index="index">
          <div class="flex items-center justify-between gap-2 px-2.5">
            <span class="text-neutral-600 text-sm line-clamp-1">
              <slot name="row-title" :row="row" :row-index="index">
                {{ rowTitle?.(row, index) || \`Объект \${index + 1}\` }}
              </slot>
            </span>

            <div
              v-if="showRemove"
              class="cursor-pointer"
              @click="emit('remove', index)"
            >
              <IconTrash class="text-red-600" :size="20" />
            </div>
          </div>

          <card
            :classes="{
              root: 'mb-4 bg-white border border-gray-200 p-2.5 rounded-[14px]',
              content: 'text-base',
            }"
          >
            <flex-col class="gap-3">
              <template v-for="header in headers" :key="header.key">
                <slot
                  name="cell"
                  :header="header"
                  :row="row"
                  :row-index="index"
                />
              </template>
            </flex-col>
          </card>
        </slot>
      </flex-col>

      <sticky-scrollbar :offset="10" />
    </flex-row>
  </flex-row>
</template>

<script setup lang="ts">
import { MultiPanelMenu } from "#components";
import type { HTMLAttributes } from "vue";
import type { ClientDuplicationMenuItemType } from "~/interfaces/api/clients/clients-duplication-model";
import { cn } from "~/utils/helpers";

interface HeaderType {
  name?: string;
  key: string | number;
  checked?: boolean;
  [key: string]: any;
}

interface RowType {
  id?: string | number;
  [key: string]: any;
}

const props = withDefaults(
  defineProps<{
    headersLabel?: string;
    headers?: HeaderType[];
    enteredData?: RowType[];
    rowTitle?: (row: RowType, index: number) => string;
    rowKey?: (row: RowType, index: number) => string | number;
    showRemove?: boolean;
    headerVariant?: "menu" | "primary";
    columnWidthClass?: string;
    contentClass?: HTMLAttributes["class"];
    menuHeaderTall?: boolean;
    isLoading?: boolean;
    openItems?: Record<string, boolean>;
    prepentIsFixed?: boolean;
  }>(),
  {
    headers: () => [],
    enteredData: () => [],
    showRemove: true,
    headerVariant: "primary",
    menuHeaderTall: false,
    isLoading: false,
    openItems: () => ({}),
    prepentIsFixed: false,
  },
);

const emit = defineEmits<{
  (e: "remove", index: number): void;
  (e: "update:openItems", value: Record<string, boolean>): void;
}>();

const getRowKey = (row: RowType, index: number) => {
  return props.rowKey?.(row, index) ?? row.id ?? \`object_\${index}\`;
};
<\/script>
`;export{e as default};
