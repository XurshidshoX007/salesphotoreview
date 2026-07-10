const n=`<template>
  <div
    data-slot="root"
    :data-hide-lines="props.hideLines"
    :class="cn(variantClasses.root(), props.classes?.root)"
  >
    <div
      v-if="props.searchable"
      :class="cn(variantClasses.searchWrapper(), props.classes?.searchWrapper)"
    >
      <search-input
        no-debounce
        :value="searchValue"
        :class="cn(variantClasses.search(), props.classes?.search)"
        @change="onSearch"
      />
    </div>

    <!-- LOADING -->
    <div v-show="loading">
      <skeleton-rows :rows="6" />
    </div>

    <!-- EMPTY -->
    <div
      v-show="showEmpty"
      class="flex justify-center items-center flex-col py-6"
    >
      <no-data size="large" />
    </div>

    <div
      v-show="showContent"
      data-slot="wrapper"
      :class="cn(variantClasses.wrapper(), props.classes?.wrapper)"
    >
      <side-menu-item
        v-for="item in filteredData"
        :key="item.id"
        :item="item"
      />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends MenuBaseItem">
import type { Slot } from "vue";
import type {
  MenuBaseItem,
  NestedKeyOf,
  SideMenuClassesType,
  SideMenuTypes,
  NormalizedItem,
} from "~/interfaces/ui/SideMenuTypes";
import { SIDE_MENU_CTX, SIDE_MENU_SLOTS } from "~/interfaces/ui/SideMenuTypes";
import { MENU_TYPES } from "~/variable/static-constants";
import { menuVariants } from "./variants";
import { cn } from "#imports";

type SlotProps = {
  item: T;
  level: number;
  isOpen: boolean;
  hasChildren: boolean;
  isActive: boolean;
  toggle: () => void;
};

type Props = {
  variant: SideMenuTypes;
  data: T[];
  openItems?: Record<string, boolean>;
  activeItemId?: string | number;
  searchable?: boolean;
  searchKeys?: NestedKeyOf<T>[];
  loading?: boolean;
  hideLines?: boolean;
  expandMaxDuration?: number;
  classes?: Partial<SideMenuClassesType>;
};

type Emits = {
  (e: "update:openItems", value: Record<string, boolean>): void;
  (e: "change:activeItemId", id: string | number): void;
};

defineSlots<
  {
    default?: Slot<SlotProps>;
  } & {
    [K in \`level-\${number}\`]?: Slot<SlotProps>;
  }
>();

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const searchValue = ref("");
const internalOpenItems = ref<Record<string, boolean>>({});

const variantClasses = menuVariants({
  variant: props.variant,
});

const isControlled = computed(
  () => "openItems" in props && props.openItems !== undefined,
);

const openItems = computed<Record<string, boolean>>({
  get() {
    return isControlled.value ? props.openItems! : internalOpenItems.value;
  },
  set(value: Record<string, boolean>) {
    if (isControlled.value) {
      emit("update:openItems", value);
    } else {
      internalOpenItems.value = value;
    }
  },
});

const expandDuration = computed<number | undefined>(() => {
  return props.variant === MENU_TYPES.GROUP ? 0 : undefined;
});

// Methods
const handleToggle = (id: string, value: boolean) => {
  if (props.variant === MENU_TYPES.TREE) {
    openItems.value = {
      ...openItems.value,
      [id]: value,
    };
  }
};

// Provide context + slots to all Item descendants
const slots = useSlots();

provide(SIDE_MENU_CTX, {
  variant: props.variant,
  openItems,
  activeItemId: toRef(props, "activeItemId"),
  expandDuration,
  expandMaxDuration: props.expandMaxDuration,
  classes: props.classes,
  onToggle: handleToggle,
  onActiveChange: (id) => emit("change:activeItemId", id),
});

provide(SIDE_MENU_SLOTS, slots);

// Hooks
onMounted(() => {
  if (props.variant === MENU_TYPES.GROUP) {
    openItems.value = props.data.reduce(
      (acc, item) => {
        acc[getKey(item)] = true;
        return acc;
      },
      {} as Record<string, boolean>,
    );
  }
});

// Search helpers
const getByPath = (obj: T, path: NestedKeyOf<T>): string => {
  const value = (path as string)
    .split(".")
    .reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj);
  return value != null ? String(value) : "";
};

// Normalization helpers
const getKey = (item: T): string | number => item.id;

const getLabel = (item: T): string => item.name ?? "";

const getUrl = (item: T): string | undefined => item.url;

const getDisabled = (item: T): boolean | undefined => (item as any).isDisabled;

const getInactive = (item: T): boolean | undefined => (item as any).isInactive;

const getChildren = (item: T): T[][] | undefined => {
  if (props.variant === MENU_TYPES.GROUP && (item as any).items) {
    return [(item as any).items];
  }
  return (item as any).children;
};

function normalize(item: T): NormalizedItem<T> {
  const children = getChildren(item);
  return {
    id: getKey(item),
    name: getLabel(item),
    url: getUrl(item),
    isDisabled: getDisabled(item),
    isInactive: getInactive(item),
    children: children?.map((group: T[]) => group.map(normalize)),
    original: item,
  };
}

const normalizedData = computed(() => props.data.map(normalize));

const filteredData = computed(() => {
  if (!props.searchable || !searchValue.value?.trim())
    return normalizedData.value;

  const lowerCasedSearch = searchValue.value.toLowerCase().trim();

  function filterItems(items: NormalizedItem<T>[]): NormalizedItem<T>[] {
    const result: NormalizedItem<T>[] = [];

    for (const item of items) {
      const labelMatches = props.searchKeys
        ? props.searchKeys.some((key) =>
            getByPath(item.original, key)
              .toLowerCase()
              .includes(lowerCasedSearch),
          )
        : item.name.toLowerCase().includes(lowerCasedSearch);

      if (labelMatches) {
        result.push(item);
      } else if (item.children) {
        const filteredChildren: NormalizedItem<T>[][] = [];

        for (const childGroup of item.children) {
          const filteredGroup = filterItems(childGroup);
          if (filteredGroup.length > 0) {
            filteredChildren.push(filteredGroup);
          }
        }

        if (filteredChildren.length > 0) {
          result.push({
            ...item,
            children: filteredChildren,
          });
        }
      }
    }

    return result;
  }

  return filterItems(normalizedData.value);
});

const showEmpty = computed(() => {
  return !props.loading && !props.data.length;
});

const showContent = computed(() => {
  return !props.loading && !!props.data.length;
});

const onSearch = (value: string) => {
  searchValue.value = value;
};
<\/script>
`;export{n as default};
