const n=`<template>
  <div>
    <div class="flex flex-row justify-between items-center">
      <div v-if="createAccess" class="flex flex-row gap-4">
        <flex-row v-if="activeTab === 1" class="items-center">
          <DropdownMenu
            :options="filteredAddBtns"
            label-key="name"
            value-key="url"
            :content-width="200"
            @select="(option) => option?.onClick?.()"
          >
            <template #trigger>
              <button
                class="h-10 border-none relative group bg-blue-20 w-10 flex justify-center items-center rounded-l-lg hover:bg-primary-700 transition-colors duration-200"
              >
                <fa-icon hash="&#xf107;" class="text-white font-semibold" />
              </button>
            </template>

            <template #item="{ option }">
              <div
                class="flex w-full items-center justify-between"
                :class="
                  option.tone === 'danger' ? 'text-red-600' : 'text-neutral-950'
                "
              >
                <span>{{ option.name }}</span>
                <IconExcelSVG
                  v-if="
                    [
                      DropdownValues.ImportFromExcel,
                      DropdownValues.UpdateFromExcel,
                    ].includes(option.value)
                  "
                />
              </div>
            </template>
          </DropdownMenu>

          <m-btn
            style="border-top-left-radius: 0; border-bottom-left-radius: 0"
            @click="openDialog"
          >
            {{ t("add") }}
          </m-btn>
        </flex-row>

        <m-btn v-else @click="openDialog">
          {{ t("add") }}
        </m-btn>
      </div>
    </div>
    <transition name="modal">
      <div v-if="isDialogOpen">
        <component :is="addDialogByActiveTab" @close-dialog="closeDialog" />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isExcelImportDialogOpen">
        <SettingsProductsExcelDialog
          @close-dialog="closeExcelImportDialog"
          type="create"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isExcelUpdateDialogOpen">
        <SettingsProductsExcelDialog
          @close-dialog="closeExcelUpdateDialog"
          type="update"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { resolveComponent } from "vue";
import { useProductsAccess } from "~/composables/access/settings/products/products";

// props
const props = defineProps<{
  activeTab: number;
  createAccess: boolean;
}>();

// access
const { hasAccess2ImportProductExcel, hasAccess2ProductCreate } =
  useProductsAccess();

// states
const { t } = useI18n();
const router = useRouter();
const isDialogOpen = ref<boolean>(false);
const isExcelImportDialogOpen = ref<boolean>(false);
const isExcelUpdateDialogOpen = ref<boolean>(false);

enum DropdownValues {
  Add = 1,
  AddMultple = 2,
  ImportFromExcel = 3,
  UpdateFromExcel = 4,
}

const addBtns = ref([
  {
    name: t("clients.add"),
    value: DropdownValues.Add,
    onClick: openDialog,
    get hasAccess() {
      return hasAccess2ProductCreate.value;
    },
  },
  {
    name: t("labels.add_multiple"),
    value: DropdownValues.AddMultple,
    onClick: () => router.push("/settings/products/add"),
    get hasAccess() {
      return hasAccess2ProductCreate.value;
    },
  },
  {
    name: t("clients.import_from_excel"),
    value: DropdownValues.ImportFromExcel,
    onClick: openExcelImportDialog,
    get hasAccess() {
      return hasAccess2ImportProductExcel.value;
    },
  },
  {
    name: t("clients.update_from_excel"),
    value: DropdownValues.UpdateFromExcel,
    onClick: openExcelUpdateDialog,
    get hasAccess() {
      return hasAccess2ImportProductExcel.value;
    },
  },
]);

// hooks
const filteredAddBtns = computed(() => {
  return addBtns.value.filter((btn) => btn.hasAccess);
});

const addDialogByActiveTab = computed(() => {
  switch (props.activeTab) {
    case 1:
      return resolveComponent("SettingsProductsNewProductModal");
    case 2:
      return resolveComponent("SettingsProductsGroupsNewGroup");
    case 3:
      return resolveComponent("SettingsProductsReplacementProductGroupDialog");
    case 4:
      return resolveComponent("SettingsProductsBrandsNewBrand");
    case 5:
      return resolveComponent("SettingsProductsProducersNewProducer");
    case 6:
      return resolveComponent("SettingsProductsSegmentsNewSegment");
    default:
      return resolveComponent("SettingsProductsNewProductModal");
  }
});

// methods
function openDialog() {
  isDialogOpen.value = true;
}

const closeDialog = () => {
  isDialogOpen.value = false;
};

function openExcelImportDialog() {
  isExcelImportDialogOpen.value = true;
}

const closeExcelImportDialog = () => {
  isExcelImportDialogOpen.value = false;
};

function openExcelUpdateDialog() {
  isExcelUpdateDialogOpen.value = true;
}

const closeExcelUpdateDialog = () => {
  isExcelUpdateDialogOpen.value = false;
};
<\/script>
`;export{n as default};
