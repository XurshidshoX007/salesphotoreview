const n=`<template>
  <m-btn
    group="outlined"
    :loading="loading"
    :disabled="disabled"
    :class="
      cn(
        '!h-8 ml-auto !font-medium !text-orange-500 hover:!bg-orange-50 flex-row-reverse !bg-transparent !gap-1.5',
        loading && '[&_path]:fill-orange-500',
        props.class,
      )
    "
  >
    {{ t("orders.unpin") }}

    <icon-detach v-if="!loading" :size="20" class="shrink-0" />
  </m-btn>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { cn } from "~/utils/helpers";

// Types
type Props = {
  loading?: boolean;
  disabled?: boolean;
  class?: string;
};

// Props
const props = defineProps<Props>();

// Composables
const { t } = useI18n();
<\/script>
`;export{n as default};
