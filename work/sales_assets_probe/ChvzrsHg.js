const n=`<template>
  <div v-if="!isLinkable" class="flex items-center w-fit gap-1">
    {{ value }}
    <slot></slot>
  </div>

  <div v-else class="flex items-center w-fit gap-1">
    <nuxt-link :to="tenantAwareTo" :target="_target">
      {{ value }}
      <slot></slot>
    </nuxt-link>
    <CopyBtn v-if="value && !nonCopyable" :value="value" />
  </div>
</template>

<script setup lang="ts">
import { useTenantPath } from "~/composables/useTenantPath";

// props
interface Props {
  to?:
    | string
    | {
        path: string;
        query?: Record<string, any>;
        hash?: string;
        params?: Record<string, any>;
      };
  value?: string | number;
  target?: boolean;
  isLinkable?: boolean;
  nonCopyable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isLinkable: true,
  target: false,
  nonCopyable: false,
});

// composables
const { withTenant } = useTenantPath();

// hooks
const isLinkable = computed(() => props.isLinkable !== false);

const _target = computed(() => {
  if (props.target) {
    return "_blank";
  }
  return "";
});

// Generate tenant-aware URL
const tenantAwareTo = computed(() => {
  if (!props.to) return props.to;

  // If it's a string, add tenant prefix
  if (typeof props.to === "string") {
    return withTenant(props.to);
  }

  // If it's an object with path, add tenant prefix to path
  return {
    ...props.to,
    path: withTenant(props.to.path),
  };
});
<\/script>

<style scoped>
a {
  display: inline-block;
  height: 100%;
  cursor: pointer;
  width: fit-content;
  color: #299b9b;
  text-decoration: none;
  white-space: normal;
  font-family: "Inter", sans-serif;
}

a:hover {
  text-decoration: underline;
}
</style>
`;export{n as default};
