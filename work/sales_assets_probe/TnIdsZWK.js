const t=`<template>
  <card size="compact-y">
    <template #header>
      <page-title size="xl" weight="500" :title="t('filters.filter')" />
    </template>
  </card>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// Composables
const { t } = useI18n();
<\/script>
`;export{t as default};
