const n=`<template>
  <div v-if="!location" class="bordered-item text-red-550">
    {{ t("not_available") }}
  </div>
  <div v-else class="inline-flex items-center gap-2 text-primary-600">
    <span>{{ formatLocation(location) }}</span>
    <copy-btn :value="formatLocation(location)" />
  </div>
</template>

<script setup lang="ts">
import { formatLocation } from "#imports";
import { useI18n } from "vue-i18n";

// Types
type Props = {
  location?: LocationModel;
};

// Props
const props = defineProps<Props>();

// Composables
const { t } = useI18n();
<\/script>
`;export{n as default};
