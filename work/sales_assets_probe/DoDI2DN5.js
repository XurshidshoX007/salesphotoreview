const n=`<template>
  <side-menu
    variant="tree"
    :data="treeData"
    :open-items="{ created_date: true }"
    :classes="{
      root: 'row-span-3 shadow-[inset_0_-1px_0_#E1E4EA]',
      groupWrapper: 'mt-0',
    }"
  >
    <template #default="{ item }">
      <component v-if="item.render" :is="item.render" />
      <div v-else class="text-sm">{{ item.name }}</div>
    </template>
  </side-menu>
</template>

<script setup lang="ts">
import { h, type Component, type VNode } from "vue";
import { useI18n } from "vue-i18n";
import { getFormattedDate } from "~/utils/formatters";
import { cn, type OrderDetailsDateTreeValueType } from "#imports";
import type { MenuTreeItemType } from "~/interfaces/ui/SideMenuTypes";

// Types
type Props = {
  icon: Component;
  dates?: OrderDetailsDateTreeValueType;
  class?: string;
};

type DateTreeItem = MenuTreeItemType & {
  render?: () => VNode;
};

// Props
const props = defineProps<Props>();

// Composabled
const { t } = useI18n();

// Hooks
const treeData = computed<DateTreeItem[]>(() => [
  {
    id: "created_date",
    name: t("column.created_date"),
    render: () =>
      h(
        "div",
        {
          class: cn(
            "flex items-center justify-between gap-2.5 h-8 py-2 box-content",
            props.class,
          ),
        },
        [
          h("div", { class: "flex items-center gap-2.5" }, [
            h(props.icon, {
              size: 24,
              variant: "twotone",
              class: "text-primary-600",
            }),
            h("span", { class: "text-sm" }, t("column.created_date")),
          ]),
          h(
            "div",
            {
              class:
                "text-sm border rounded-lg px-2.5 py-[3px] max-w-[150px] min-w-0 overflow-hidden",
            },
            h(
              "span",
              { class: "truncate block w-full" },
              getFormattedDate(props.dates?.createdDate) || "-",
            ),
          ),
        ],
      ),
    children: [
      [
        {
          id: "shipping_date",
          name: t("column.shipped_date"),
          render: () =>
            h(
              "div",
              {
                class:
                  "flex items-center justify-between gap-2.5 h-8 py-2 box-content",
              },
              [
                h("span", { class: "text-sm" }, t("column.shipped_date")),
                h(
                  "div",
                  {
                    class:
                      "text-sm border rounded-lg px-2.5 py-[3px] max-w-[150px] min-w-0 overflow-hidden",
                  },
                  h(
                    "span",
                    { class: "truncate block w-full" },
                    getFormattedDate(props.dates?.shippingDate) || "-",
                  ),
                ),
              ],
            ),
        },
        {
          id: "returned_date",
          name: t("column.returned_date"),
          render: () =>
            h(
              "div",
              {
                class:
                  "flex items-center justify-between gap-2.5 h-8 py-2 box-content",
              },
              [
                h("span", { class: "text-sm" }, t("column.returned_date")),
                h(
                  "div",
                  {
                    class:
                      "text-sm border rounded-lg px-2.5 py-[3px] max-w-[150px] min-w-0 overflow-hidden",
                  },
                  h(
                    "span",
                    { class: "truncate block w-full" },
                    getFormattedDate(props.dates?.returnedDate) || "-",
                  ),
                ),
              ],
            ),
        },
      ],
    ],
  },
]);
<\/script>
`;export{n as default};
