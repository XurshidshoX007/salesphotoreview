const n=`<template>
  <div>
    <div class="flex items-center gap-x-4">
      <m-btn @click="openDialog"> {{ btnTitle }} </m-btn>
    </div>
    <transition name="modal">
      <div v-if="isDialogOpen">
        <SettingsProductCategoryNewCategoryBody
          v-if="activeTab === 1"
          @clearFetchedTab="clearFetchedTab"
          @closeDialog="closeDialog"
        />
        <SettingsProductCategoryGroupNewGroupBody
          v-if="activeTab === 2"
          @clearFetchedTab="clearFetchedTab"
          @closeDialog="closeDialog"
        />
        <SettingsProductCategorySubcategoryNewDataBody
          v-if="activeTab === 3"
          @closeDialog="closeDialog"
          @clearFetchedTab="clearFetchedTab"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  activeTab: number;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// states
const { t } = useI18n();
const isDialogOpen = ref(false);

// hooks
const btnTitle = computed(() => {
  switch (props.activeTab) {
    case 1:
      return t("settings.add_product_category");
    case 2:
      return t("settings.add_category_group");
    case 3:
      return t("settings.add_sub_category");
    default:
      return t("settings.add_product_category");
  }
});

// methods
const openDialog = () => {
  isDialogOpen.value = true;
};

const closeDialog = () => {
  isDialogOpen.value = false;
};

const clearFetchedTab = () => {
  emit("clearFetchedTab");
};
<\/script>
`;export{n as default};
