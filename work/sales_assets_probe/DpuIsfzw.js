const n=`<template>
  <form @submit.prevent="save">
    <d-modal
      :name="!productFormData.id ? t('clients.add') : t('edit')"
      data-container-width="994px"
      :loading="isGetByIdLoading"
      @closeDialog="closeDialog"
      only-close-dialog
    >
      <flex-col class="gap-7">
        <Stepper
          ref="StepperComponent"
          :total-steps="3"
          :icons="stepIcons"
          :labels="[
            t('settings.product.basic_info'),
            t('settings.product.additional_info'),
            t('settings.product.product_photos'),
          ]"
          label-class="text-sm text-neutral-400"
          variant="badge"
        >
          <template #content-1>
            <SettingsProductsNewProductModalBasicInformationStep :id="id" />
          </template>
          <template #content-2>
            <SettingsProductsNewProductModalAdditionalInformationStep
              :id="id"
            />
          </template>
          <template #content-3>
            <SettingsProductsNewProductModalProductPhotoStep
              v-model:photos="productPhotos"
            />
          </template>
        </Stepper>
      </flex-col>
      <template #footer>
        <div class="flex justify-between items-center">
          <m-btn
            :disabled="activeTab === TabsEnum.BasicInfo"
            @click="onPrev"
            class="w-32"
          >
            {{ t("back") }}
          </m-btn>

          <flex-row class="gap-4">
            <m-btn
              v-if="requiredFieldsFilled"
              group="gray"
              class="w-32"
              type="submit"
              :loading="isBtnLoading"
            >
              {{ t("save") }}
            </m-btn>

            <template v-if="requiredFieldsFilled">
              <m-btn @click.prevent="onNext" type="button" class="w-32">
                {{ t("next") }}
              </m-btn>
            </template>
            <template v-else>
              <m-btn
                :loading="activeTab === TabsEnum.Images ? isBtnLoading : false"
                type="submit"
                class="w-32"
              >
                {{ activeTab === TabsEnum.Images ? t("save") : t("next") }}
              </m-btn>
            </template>
          </flex-row>
        </div>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { IconFileWrite, IconImage, IconListPlay } from "#components";
import type { Stepper } from "#components";
import { storeToRefs } from "pinia";
import type { SettingsProductImage } from "~/interfaces/api/settings/products-model";

// types
enum TabsEnum {
  BasicInfo = 1,
  AdditionalInfo = 2,
  Images = 3,
}

// stores
const productsStore = useProductsStore("new-product");

// props
const props = defineProps<{
  id?: string;
}>();

// emits
type Emits = {
  (e: "closeDialog"): void;
  (e: "clearFetchedTab", isActive: boolean): void;
};

const emit = defineEmits<Emits>();

// child components
const StepperComponent = ref<typeof Stepper | null>(null);

// composables
const { t } = useI18n();
const eventBus = useEventBus();

// states
const { productFormData } = storeToRefs(productsStore);
const isGetByIdLoading = ref<boolean>(false);
const isBtnLoading = ref<boolean>(false);
const updateListEventKey = SettingsEventKeys.PRODUCTS_TABLE_UPDATE;
let activeTab = ref<number>(TabsEnum.BasicInfo);

interface PhotoItem {
  id?: string;
  url?: string;
  path?: string;
  name?: string;
  file?: File;
  is_default: boolean;
}
const productPhotos = ref<Map<string, PhotoItem>>(new Map());

const stepIcons: Component[] = [
  markRaw(IconFileWrite),
  markRaw(IconListPlay),
  markRaw(IconImage),
];

const initialDetailData = ref<ProductsModel>(); // used to store the detail data on edit

// hooks
const requiredFieldsFilled = computed(() => {
  return (
    !!(
      productFormData.value.category_id &&
      productFormData.value.unit_id &&
      productFormData.value.default_name
    ) && activeTab.value !== TabsEnum.Images
  );
});

const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== productFormData.value.is_active;
});

onMounted(async () => {
  if (props.id) {
    await getById();
  }
});

// Methods
const onPrev = () => {
  if (activeTab.value > TabsEnum.BasicInfo) {
    activeTab.value--;
  }
  StepperComponent.value?.previousStep();
};

const onNext = () => {
  if (activeTab.value < TabsEnum.Images) {
    activeTab.value++;
  }
  StepperComponent.value?.nextStep();
};

const closeDialog = () => {
  emit("closeDialog");

  productsStore.clearNewProductFormData();
};

const updateListByActiveState = (isActive: boolean) => {
  if (isActiveStateChangedOnEdit.value) {
    eventBus.emit(updateListEventKey, {
      isActive: !isActive,
    });
    emit("clearFetchedTab", !isActive);
    return;
  }
  eventBus.emit(updateListEventKey, { isActive });
};

const save = async () => {
  isBtnLoading.value = true;
  try {
    const imageIds: SettingsProductImage[] = [];
    productPhotos.value.forEach((photo) => {
      photo?.id &&
        imageIds.push({
          id: photo.id,
          is_default: photo.is_default,
        });
    });

    await productsStore.add({
      ...productFormData.value,
      image_arr: imageIds,
    });

    updateListByActiveState(productFormData.value.is_active!);
    notify({ title: t("saved"), type: "success" });
    closeDialog();
  } catch (error) {
    console.log(error);
  } finally {
    isBtnLoading.value = false;
  }
};

const getById = async () => {
  isGetByIdLoading.value = true;
  initialDetailData.value = await productsStore.getById(props.id!);

  const imagesMap: Map<string, PhotoItem> = new Map(
    initialDetailData.value?.images?.map(({ id, path, is_default }) => [
      path as string,
      {
        id,
        path,
        is_default,
      },
    ]),
  );

  productPhotos.value = imagesMap;

  productFormData.value = {
    ...initialDetailData.value,
    item_dimension: initialDetailData.value?.item_dimension || {
      width: 0,
      thickness: 0,
      length: 0,
    },
  };
  isGetByIdLoading.value = false;
};
<\/script>
`;export{n as default};
