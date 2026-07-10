const n=`<template>
  <div
    data-slot="item-wrapper"
    :data-id="String(item.id)"
    :data-level="level"
    :class="cn(variantClasses.itemWrapper(), ctx.classes?.itemWrapper)"
    @click.stop
  >
    <!-- Render consumer slot (via inject) or fallback header -->
    <component v-if="resolvedSlot" :is="() => resolvedSlot!(slotBindings)" />
    <component
      v-else
      :is="is"
      :to="tenantAwareUrl"
      :class="variantClasses.trigger()"
      @click="onFallbackClick"
    >
      <icon-chevron-down
        v-if="hasChildren"
        size="16"
        :class="
          cn('shrink-0 transition-transform duration-300', {
            '-rotate-90': !isOpen,
          })
        "
      />
      <icon-dot v-else size="16" class="shrink-0" />
      <span :class="variantClasses.triggerLabel()" :title="item.name">
        {{ item.name }}
      </span>
    </component>

    <!-- Recursive rendering of children -->
    <transition-expand
      data-slot="content-wrapper"
      :data-level="level"
      :class="cn(variantClasses.contentWrapper(), ctx.classes?.contentWrapper)"
      :destroy-on-close="false"
      :is-open="hasChildren && isOpen"
      :duration="ctx.expandDuration.value"
      :max-duration="ctx.expandMaxDuration"
    >
      <div
        v-for="(childGroup, childGroupIndex) in item.children"
        :key="\`\${String(item.id)}-\${childGroupIndex}\`"
      >
        <div
          v-for="child in childGroup"
          :key="\`\${String(item.id)}-\${childGroupIndex}-\${child.id}\`"
          data-slot="group-wrapper"
          :data-level="level"
          :class="cn(variantClasses.groupWrapper(), ctx.classes?.groupWrapper)"
        >
          <side-menu-item :item="child" :level="level + 1" />
        </div>
      </div>
    </transition-expand>
  </div>
</template>

<script setup lang="ts" generic="T extends MenuBaseItem">
import type {
  MenuBaseItem,
  NormalizedItem,
} from "~/interfaces/ui/SideMenuTypes";
import { SIDE_MENU_CTX, SIDE_MENU_SLOTS } from "~/interfaces/ui/SideMenuTypes";
import { menuVariants } from "~/components/global/SideMenu/variants";
import { cn } from "#imports";
import { NuxtLink } from "#components";
import { useTenantPath } from "~/composables/useTenantPath";

type Props = {
  item: NormalizedItem<T>;
  level?: number;
};

const props = withDefaults(defineProps<Props>(), {
  level: 0,
});

const ctx = inject(SIDE_MENU_CTX)!;
const consumerSlots = inject(SIDE_MENU_SLOTS, {});

const { withTenant } = useTenantPath();

const hasChildren = computed(() => !!props.item.children);
const isOpen = computed(() => ctx.openItems.value[props.item.id] ?? false);
const isActive = computed(() => {
  const activeItemId = ctx.activeItemId.value;
  return (
    activeItemId !== undefined &&
    activeItemId !== null &&
    String(activeItemId) === String(props.item.id)
  );
});

const variantClasses = computed(() =>
  menuVariants({
    variant: ctx.variant,
    isRoot: props.level === 0,
    withChildren: hasChildren.value,
    isActive: isActive.value,
  }),
);

// Fallback header helpers
const is = computed(() => (props.item.url ? NuxtLink : "div"));
const tenantAwareUrl = computed(() => withTenant(props.item.url));

// Resolve slot: level-{N} → default → undefined (fallback header)
const resolvedSlot = computed(() => {
  return (
    consumerSlots[\`level-\${props.level}\`] ||
    consumerSlots["default"] ||
    undefined
  );
});

const slotBindings = computed(() => ({
  item: props.item.original,
  level: props.level,
  isOpen: isOpen.value,
  hasChildren: hasChildren.value,
  isActive: isActive.value,
  toggle,
}));

const toggle = () => {
  if (hasChildren.value) {
    ctx.onToggle(String(props.item.id), !isOpen.value);
  }
};

const onFallbackClick = () => {
  toggle();
  if (!hasChildren.value) {
    ctx.onActiveChange(props.item.id);
  }
};
<\/script>
`;export{n as default};
