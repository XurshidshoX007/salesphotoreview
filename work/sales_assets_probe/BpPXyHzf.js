const n=`<script setup lang="ts">
import { useStickyScrollbar } from "~/composables/useStickyScrollbar";

type Props = {
  el?: HTMLElement | null;
  direction?: "vertical" | "horizontal";
  offset?: number | string;
};

// Props
const props = withDefaults(defineProps<Props>(), {
  direction: "horizontal",
  offset: 0,
});

// Composables
const { currentEl, stickyScrollWrapperStyle, fakeContentStyle } =
  useStickyScrollbar(props);
<\/script>

<template>
  <div ref="currentEl" :style="stickyScrollWrapperStyle">
    <div :style="fakeContentStyle" />
  </div>
</template>
`;export{n as default};
