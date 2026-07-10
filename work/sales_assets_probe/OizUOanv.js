const n=`<template>
  <div
    :class="
      cn(
        'flex flex-col fixed left-0 top-0 h-full min-h-min w-[105px] z-[99] transition-all duration-300 ease space-y-6 select-none bg-[#013636] group/sidebar',
        isOpened && 'w-[250px]',
        props.classes?.root,
      )
    "
    :data-for-mobile="props.forMobile"
  >
    <div class="flex justify-center relative">
      <nuxt-link
        to="/dashboard/supervisor"
        class="size-11 bg-white rounded-lg mt-[30px]"
      />

      <div
        v-if="!forMobile"
        @click="() => openDrawer()"
        :class="
          cn(
            'absolute right-0 top-1/2 translate-x-1/2',
            'size-[30px] bg-[#013636] rounded-md border border-[#027878] grid place-items-center cursor-pointer',
          )
        "
      >
        <icon-arrow-righti
          :class="
            cn(
              'transition-transform [&>path]:fill-white',
              isOpened && 'rotate-180',
            )
          "
        />
      </div>
    </div>

    <div
      :class="
        cn(
          'w-full max-h-[calc(100%-98px)] overflow-y-auto pb-4 text-xs text-white font-medium scrollbar-none',
          isOpened ? 'px-4' : 'px-2.5',
        )
      "
      @mouseenter="handleSidebarMouseEnter"
      @mouseleave="handleSidebarMouseLeave"
    >
      <ul class="space-y-3 flex flex-col items-start">
        <template v-for="menuItem in sidebarMenu" :key="menuItem.key">
          <!-- Divider -->
          <li
            v-if="menuItem.type === 'divider' && menuItem?.isShowable"
            class="w-full my-6"
          >
            <div class="h-px bg-white/10"></div>
          </li>

          <!-- Regular menu item -->
          <li
            v-else-if="menuItem?.isShowable && menuItem.type !== 'divider'"
            @click="openItem(menuItem)"
            @mouseenter="(e) => handleLiMouseEnter(e, menuItem)"
            :class="cn('w-full', !isOpened && 'max-w-[85px]')"
          >
            <component
              :is="menuItem.url ? NuxtLink : 'div'"
              :to="menuItem.url ? withTenant(menuItem.url) : null"
              :class="
                cn(
                  'py-1.5 flex items-center hover:bg-white/5 rounded-lg cursor-pointer group transition-opacity',
                  isOpened ? 'flex-row px-[5px]' : 'flex-col px-1 space-y-2',
                  'data-[active=true]:bg-white/10 data-[active=true]:hover:bg-white/5',
                )
              "
              :data-active="hasActiveChild(menuItem)"
            >
              <div
                :class="
                  cn(
                    'bg-[#036666] rounded-lg group-data-[active=true]:bg-white shrink-0 transition-all duration-300',
                    'grid place-items-center transition-all duration-300',
                    isOpened ? 'size-6 mr-2' : 'size-10',
                  )
                "
              >
                <component
                  :is="loadIcon(menuItem.icon)"
                  :class="
                    cn(
                      'text-white group-data-[active=true]:text-[#012E2E] transition-colors',
                      isOpened ? 'size-[18px]' : 'size-6',
                    )
                  "
                />
              </div>

              <div :class="cn('truncate', !isOpened && 'max-w-[77px]')">
                {{ menuItem?.name }}
              </div>

              <icon-arrow-righti
                v-if="!!menuItem?.groups?.length"
                :class="
                  cn(
                    'size-4 ml-auto [&>path]:fill-white opacity-50 transition-all',
                    'group-data-[active=true]:opacity-100 group-hover:opacity-100',
                    openedMenuKey === menuItem.key && 'rotate-90',
                    !isOpened && 'hidden',
                  )
                "
              />
            </component>

            <transition-expand
              :is-open="openedMenuKey === menuItem.key && isOpened"
              :duration="300"
            >
              <transition-fade :show="!!menuItem?.groups?.length && isOpened">
                <sidebar-item-content
                  :groups="menuItem.groups"
                  @change-url="onChangeUrl"
                />
              </transition-fade>
            </transition-expand>
          </li>
        </template>
      </ul>
    </div>

    <transition name="modal">
      <div v-if="isCreateOrderOpen">
        <OrdersCreateOrdersClientsTableWithFilter
          @closeDialog="isCreateOrderOpen = false"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isCreateOrderOpenForRefund">
        <OrdersOrderRefundCreateOrderRefundDialog
          @closeDialog="isCreateOrderOpenForRefund = false"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="openedCheckedMenuKey">
        <SidebarCheckedItemsDialog
          :itemsArr="openedCheckedMenuChildren"
          :menu-key="openedCheckedMenuKey"
          @close-dialog="openedCheckedMenuKey = null"
          @update-children="updateCheckedChildren"
        />
        <icon-setting />
      </div>
    </transition>

    <!-- Floating Menu -->
    <teleport to="body">
      <transition name="floating-menu-fade">
        <div
          v-if="floatingMenuVisible && currentHoveredLi && !isOpened"
          ref="floatingMenuContent"
          class="fixed z-50 bg-[#043f3f] rounded-xl shadow-[-4px_4px_20px_0px_#00000033] min-w-[230px] max-w-[250px] pointer-events-auto transition-all duration-300 ease-in-out will-change-auto select-none"
          :style="floatingStyles"
          @mouseenter="handleFloatingMenuMouseEnter"
          @mouseleave="handleFloatingMenuMouseLeave"
        >
          <div class="p-2.5 text-xs text-white font-medium">
            <transition name="floating-menu-content" mode="out-in">
              <sidebar-item-content
                :key="currentHoveredLi?.key"
                :groups="currentHoveredLi?.groups"
                @change-url="onChangeUrl"
              />
            </transition>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { useTenantPath } from "~/composables/useTenantPath";
import {
  useFloating,
  offset,
  shift,
  flip,
  autoUpdate,
  type ReferenceElement,
} from "@floating-ui/vue";
import { useSidebarMenu } from "~/variable/sidebar-menu";
import { useSidebarStore } from "~/stores/sidebar.store";
import { cn, type SidebarMenuType } from "#imports";
import { NuxtLink } from "#components";
import { AppRoutes } from "~/variable/routes";

// Types
type Props = {
  forMobile?: boolean;
  classes?: {
    root?: string;
  };
};

type SidebarMenuItemWithGroups = Extract<SidebarMenuType, { type?: "menu" }>;

// Props
const props = withDefaults(defineProps<Props>(), {
  forMobile: false,
});

// States
const isCreateOrderOpen = ref(false);
const isCreateOrderOpenForRefund = ref(false);
const openedCheckedMenuKey = ref<string | null>("");
const openedMenuKey = ref();

const floatingMenuVisible = ref(false);
const floatingMenuContent = ref(null);
const currentHoveredLi = ref<SidebarMenuItemWithGroups | null>(null);
const floatingReference = ref<ReferenceElement | null>(null);
const isPointerInSidebar = ref(false);
const isPointerInFloating = ref(false);
const isMenuClosing = ref(false);

let hideTimeout: ReturnType<typeof setTimeout> | null = null;

// Composables
const router = useRouter();
const sidebarMenu = useSidebarMenu();
const sidebarStore = useSidebarStore();
const { withTenant, currentPathWithoutTenant, isFullPathActive } =
  useTenantPath();
const { floatingStyles } = useFloating(floatingReference, floatingMenuContent, {
  placement: "right-start",
  strategy: "fixed",
  middleware: [offset(20), shift({ padding: 8 }), flip()],
  whileElementsMounted: autoUpdate,
});

// Hooks
onMounted(() => {
  for (let menu of sidebarMenu.value) {
    if (menu.type === "divider") continue;

    const openedMenu = menu?.groups?.find((group) =>
      group.items.some((item) => isFullPathActive(item.url)),
    );

    if (openedMenu) {
      openedMenuKey.value = menu.key;
    }
  }
});

onBeforeUnmount(() => {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }
});

const isOpened = computed(() => sidebarStore.isOpened || props.forMobile);

watch(
  () => isOpened.value,
  () => {
    if (isOpened.value) {
      closeFloatingMenuImmediate();
    }
  },
);

const openedCheckedMenuChildren = computed(() => {
  const menu = sidebarMenu.value.find(
    (item) => item.key === openedCheckedMenuKey.value,
  );

  if (!menu || menu.type === "divider") return [];

  // For reports menu, return the items from the first group
  if (menu?.groups?.[0]?.items) {
    return menu.groups[0].items;
  }
  return menu?.groups || [];
});

const loadedIcons = computed(() => {
  const cache = new Map();
  return (iconName: string) => {
    if (!cache.has(iconName)) {
      cache.set(
        iconName,
        defineAsyncComponent(() => import(\`@/components/icon/\${iconName}.vue\`)),
      );
    }
    return cache.get(iconName);
  };
});

// Methods
const loadIcon = (iconName: string) => {
  return loadedIcons.value(iconName);
};

const hasActiveChild = (menuItem: SidebarMenuType) => {
  if (menuItem.type === "divider") return false;

  if (
    menuItem.url === AppRoutes.settings.route &&
    currentPathWithoutTenant.value?.startsWith(AppRoutes.settings.route)
  ) {
    return true;
  }

  return (
    isFullPathActive(menuItem.url) ||
    menuItem.groups?.some((group) =>
      group.items?.some((item) => isFullPathActive(item.url)),
    )
  );
};

const onChangeUrl = (item: SidebarMenuItemType, event: MouseEvent) => {
  event.stopPropagation();

  if (event.ctrlKey) {
    // For actions, don't open in new tab
    if (item.action) {
      return;
    }

    // Open in new tab with tenant-aware URL
    navigateTo(withTenant(item?.url), { external: true });
  } else {
    // Handle actions (dialogs)
    if (item.action) {
      switch (item.action) {
        case "open-create-order-dialog":
          isCreateOrderOpen.value = true;
          router.push({ query: { request: "" } });
          break;
        case "open-refund-dialog":
          isCreateOrderOpen.value = true;
          router.push({ query: { refund: "" } });
          break;
        case "open-exchange-dialog":
          isCreateOrderOpen.value = true;
          router.push({ query: { exchange: "" } });
          break;
        case "open-refundable-order-dialog":
          isCreateOrderOpenForRefund.value = true;
          router.push({ query: { "refundable-order": "" } });
          break;
        case "open-report-settings-dialog":
          // Get parent menu key from the context
          const parentMenu = sidebarMenu.value.find(
            (menu) =>
              menu.type !== "divider" &&
              menu.groups?.some((group) => group.items?.includes(item)),
          );
          if (parentMenu) {
            openedCheckedMenuKey.value = parentMenu.key;
          }
          break;
      }
      return;
    }

    // Navigate to URL
    if (item?.url) {
      const targetUrl = withTenant(item.url);

      if (targetUrl) {
        router.push(targetUrl);
      }
    }
  }
};

const openDrawer = () => {
  sidebarStore.toggle();
};

const openItem = async (menuItem: SidebarMenuType) => {
  if (menuItem.type === "divider") return;

  if (menuItem.url) {
    return navigateTo(withTenant(menuItem.url));
  }

  if (openedMenuKey.value === menuItem.key) {
    openedMenuKey.value = null;
    return;
  }

  openedMenuKey.value = menuItem.key;
};

const updateCheckedChildren = (
  key: string,
  checkedChildren: SidebarMenuItemType[],
) => {
  const item = sidebarMenu.value.find((_item) => _item.key === key);

  if (item && item.type !== "divider" && item.groups && item.groups[0]) {
    // Update items in the first group
    item.groups[0].items = checkedChildren;
  }
};

const openFloatingMenu = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  if (!floatingMenuVisible.value) {
    floatingMenuVisible.value = true;
  }
};

const scheduleCloseFloatingMenu = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }
  hideTimeout = setTimeout(() => {
    if (!isPointerInSidebar.value && !isPointerInFloating.value) {
      closeFloatingMenu();
    }
  }, 120);
};

const closeFloatingMenuImmediate = () => {
  isMenuClosing.value = false;
  floatingMenuVisible.value = false;
  currentHoveredLi.value = null;
  floatingReference.value = null;
};

const closeFloatingMenu = () => {
  isMenuClosing.value = true;

  setTimeout(() => {
    if (!isPointerInSidebar.value && !isPointerInFloating.value) {
      floatingMenuVisible.value = false;
      currentHoveredLi.value = null;
      floatingReference.value = null;
      isMenuClosing.value = false;
    }
  }, 160);
};

const handleSidebarMouseEnter = () => {
  if (isMenuClosing.value) return;
  isPointerInSidebar.value = true;
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
};

const handleSidebarMouseLeave = () => {
  isPointerInSidebar.value = false;
  scheduleCloseFloatingMenu();
};

const handleLiMouseEnter = (event: MouseEvent, menuItem: SidebarMenuType) => {
  if (menuItem.type === "divider") return;

  const menuItemWithGroups = menuItem as SidebarMenuItemWithGroups;

  if (menuItemWithGroups?.url) {
    closeFloatingMenuImmediate();
    return;
  }

  if (
    isOpened.value ||
    !menuItemWithGroups?.groups?.some((g) => g.items?.length) ||
    isMenuClosing.value
  )
    return;

  openFloatingMenu();
  floatingReference.value = event.currentTarget as Element;
  currentHoveredLi.value = menuItemWithGroups;
};

const handleFloatingMenuMouseEnter = () => {
  if (isMenuClosing.value) return;
  isPointerInFloating.value = true;
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
};

const handleFloatingMenuMouseLeave = () => {
  isPointerInFloating.value = false;
  scheduleCloseFloatingMenu();
};
<\/script>

<style lang="scss">
.floating-menu-fade-enter-active,
.floating-menu-fade-leave-active {
  transition: opacity 0.3s ease;
}

.floating-menu-fade-enter-from,
.floating-menu-fade-leave-to {
  opacity: 0;
}

.floating-menu-content-enter-active,
.floating-menu-content-leave-active {
  transition: opacity 120ms ease;
}

.floating-menu-content-enter-from,
.floating-menu-content-leave-to {
  opacity: 0;
}
</style>
`;export{n as default};
