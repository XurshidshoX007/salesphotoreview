const n=`<template>
  <div v-if="hasData" class="show-more-content">
    <div v-if="!title">
      <div
        :class="[
          maxLength > 2 && 'flex-wrap',
          group === 'avatar' ? 'flex items-center -space-x-2' : 'show-items',
        ]"
      >
        <!-- slot for custom rendering of each item -->
        <template
          v-for="(item, index) in showItems"
          :key="getItemKey(item, index)"
        >
          <slot name="item" :item="item" :index="index">
            <!-- Default fallback rendering -->
            <div
              v-if="group === 'avatar' && typeof item === 'object'"
              v-tooltip="{ text: item.name, placement: 'top', nowrap: true }"
              :class="[
                item.avatar_url ? '!bg-transparent' : 'bg-neutral-500',
                cn(variantClasses.avatar(), props.class),
              ]"
            >
              <img
                v-if="item.avatar_url"
                :src="item.avatar_url"
                :alt="item.name"
                class="w-full h-full object-cover"
              />
              <IconAvatar v-else />
            </div>
            <div v-else :class="cn(variantClasses.tag(), props.class)">
              {{ getItemDisplay(item) }}
            </div>
          </slot>
        </template>

        <span v-if="data?.length > maxLength" style="cursor: pointer">
          <menu-btn2 size-free without-padding>
            <template #btn>
              <div
                v-if="group === 'avatar'"
                :class="cn(variantClasses.avatar(), props.class)"
                class="!bg-neutral-100 !text-neutral-600 !font-medium !text-xs"
              >
                +{{ data?.length - maxLength }}
              </div>
              <span v-else>
                <div v-if="title" class="warning-title">
                  {{ title }}
                </div>
                <span v-else class="show-more-text">
                  {{ t("users.more") }} {{ data?.length - maxLength }}
                </span>
              </span>
            </template>
            <template #content>
              <div>
                <div v-if="data.length > 8" class="border-b-1 show-more-search">
                  <search-input-border-none @updated="search" />
                </div>
                <div v-if="data?.length > maxLength">
                  <div class="content-more">
                    <!-- slot for dropdown items -->
                    <template
                      v-for="(item, index) in dataShowMore"
                      :key="getItemKey(item, index)"
                    >
                      <slot name="dropdown-item" :item="item" :index="index">
                        <!-- Default fallback rendering for dropdown -->
                        <div class="item flex items-center gap-2">
                          <div
                            v-if="
                              group === 'avatar' && typeof item === 'object'
                            "
                            class="flex-shrink-0 border-none"
                            :class="[
                              item.avatar_url
                                ? 'bg-transparent'
                                : 'bg-neutral-500',
                              cn(variantClasses.avatar(), props.class),
                            ]"
                          >
                            <img
                              v-if="item.avatar_url"
                              :src="item.avatar_url"
                              :alt="item.name"
                              class="w-full h-full object-cover"
                            />
                            <IconAvatar v-else :size="24" />
                          </div>

                          <span>{{ getItemDisplay(item) }}</span>
                        </div>
                      </slot>
                    </template>
                  </div>
                </div>
              </div>
            </template>
          </menu-btn2>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ClassValue } from "clsx";
import { cn } from "#imports";
import { showMoreVariants } from "./variants";

// Props
interface BaseItem {
  [key: string]: any;
}

export interface AgentAvatarItem {
  id: string;
  name: string;
  avatar_url: string | null;
}

const props = defineProps<{
  data: Array<AgentAvatarItem | BaseItem | string>;
  showCount?: number | null;
  title?: string;
  // Optional prop to customize key extraction
  itemKey?: string | ((item: BaseItem | string, index: number) => string);
  // Optional prop to customize display text extraction
  displayKey?: string | ((item: BaseItem | string) => string);
  class?: ClassValue;
  group?: keyof typeof showMoreVariants.slots;
  variant?: keyof typeof showMoreVariants.variants.variant;
  size?: keyof typeof showMoreVariants.variants.size;
  color?: keyof typeof showMoreVariants.variants.color;
}>();

// Composables
const { t } = useI18n();

// States
const dataShowMore = ref(props.data);

// hooks
const variantClasses = computed(() =>
  showMoreVariants({
    variant: props.variant,
    color: props.color,
    size: props.size,
  }),
);

const maxLength = computed<number>(() =>
  props.showCount === null ? 0 : props.showCount || 3,
);

const filteredData = computed(() => {
  return props.data?.filter(Boolean);
});

const showItems = computed(() => {
  if (props.data?.length > maxLength.value) {
    return filteredData.value?.slice(0, maxLength.value);
  }
  return filteredData.value;
});

const hasData = computed(() => filteredData.value?.length > 0);

watch(
  () => props.data,
  () => {
    dataShowMore.value = props.data;
  },
);

// methods
const getItemDisplay = (item: BaseItem | string): string => {
  if (typeof props.displayKey === "function") {
    return props.displayKey(item);
  }

  if (
    typeof props.displayKey === "string" &&
    typeof item === "object" &&
    item !== null
  ) {
    return String(item[props.displayKey] || "");
  }

  if (typeof item === "string") {
    return item;
  }

  if (typeof item === "object" && item !== null) {
    return (
      item.name ||
      item.title ||
      item.label ||
      item.text ||
      item.issue_name ||
      String(Object.values(item)[0] || "")
    );
  }

  return String(item);
};

const getItemKey = (item: BaseItem | string, index: number): string => {
  if (typeof props.itemKey === "function") {
    return props.itemKey(item, index);
  }

  if (
    typeof props.itemKey === "string" &&
    typeof item === "object" &&
    item !== null
  ) {
    return String(item[props.itemKey]) || index.toString();
  }

  if (typeof item === "object" && item !== null) {
    return String(item.id || item.key || item.value) || index.toString();
  }

  return typeof item === "string" ? item : index.toString();
};

const search = (value: string) => {
  const searchTerm = value.toLowerCase();

  dataShowMore.value = searchTerm
    ? props.data?.filter((item) => {
        const displayText = getItemDisplay(item);
        return displayText?.toLowerCase().includes(searchTerm);
      })
    : props.data;
};
<\/script>

<style scoped lang="scss">
.show-more-content {
  display: flex;
  gap: 0 8px;
  align-items: center;
  white-space: nowrap;

  .show-more-text {
    color: #299b9b;
  }

  .warning-title {
    user-select: none;
    cursor: pointer;
    font-family: "Inter", sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: #bd7f06;
  }

  .warning-title:hover {
    text-decoration-line: underline;
    text-decoration-style: solid;
  }

  .dropdown {
    width: fit-content !important;
  }
}

.show-items {
  display: flex;
  align-items: center;
  gap: 6px;
}

.content-more {
  width: 266px;
  box-shadow: 6px 6px 18px 12px rgba(0, 0, 0, 0.12);
  z-index: 122 !important;
  max-height: 320px;
  float: right;
  overflow-y: auto;
  border-radius: 0 0 8px 8px;

  .item {
    padding: 10px;
    border-bottom: 1px solid #e5e7eb;
    color: #424f4f !important;
    font-family: Inter, sans-serif;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
    word-wrap: break-word;
  }

  .hover-item {
    background: #299b9b0d;
    color: #299b9b;
  }

  .item:hover {
    background: #299b9b0d;
    color: #299b9b;
  }

  .item:last-child {
    border-bottom: none;
  }

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: #fafafa;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    margin-top: 10px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 10px;
    border: 3px solid transparent;
    background-clip: padding-box;
  }
}
</style>

<style lang="scss">
.show-more-search {
  input {
    border-radius: 8px 8px 0 0 !important;
    color: #424f4f !important;
  }
}
</style>
`;export{n as default};
