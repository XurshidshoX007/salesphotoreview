const n=`<template>
  <div class="w-full">
    <div class="flex flex-wrap gap-3 pb-1">
      <SettingsProductsNewProductModalProductPhotoStepCard
        v-for="[key, value] in photos"
        :key="key"
        :path="value.url || value.path"
        :alt="value.name || ''"
        :is-main="value.is_default ?? false"
        :show-remove="true"
        @remove="removePhoto(key)"
        @set-main="setMainPhoto(key)"
      />

      <SettingsProductsNewProductModalProductPhotoStepUpload
        @click="triggerUpload"
        :is-loading="isUploading"
      />
    </div>

    <input
      id="product_photo_upload"
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      style="display: none"
      @change="onFileChanged"
    />
  </div>
</template>

<script setup lang="ts">
interface PhotoItem {
  id?: string;
  url?: string;
  path?: string;
  name?: string;
  file?: File;
  is_default?: boolean;
}

// Stores
const productsStore = useProductsStore("new-product");

// States
const fileInput = ref<HTMLInputElement>();
const isUploading = ref<boolean>(false);

// Models
const photos = defineModel<Map<string, PhotoItem>>("photos", {
  default: () => new Map(),
});

// Methods
const setMainPhoto = (key: string) => {
  photos.value.forEach((photo) => {
    photo.is_default = false;
  });

  const photo = photos.value.get(key);
  if (photo) {
    photo.is_default = true;
  }

  photos.value = new Map(photos.value);
};

const triggerUpload = () => {
  fileInput.value?.click();
};

const onUploadPhotoFile = async (
  photoFile: File,
): Promise<PhotoItem | null> => {
  if (!photoFile) return null;

  const formData = new FormData();
  formData.append("form_file", photoFile);
  const photoFileData = await productsStore.onPhotoFileUpload(formData);

  return photoFileData?.data;
};

const onFileChanged = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target?.files?.length) return;

  const currentMap = new Map(photos.value);
  const filesToUpload: File[] = [];
  const uniqueKeys: string[] = [];

  for (let i = 0; i < target.files.length; i++) {
    const file = target.files[i];
    const uniqueKey = \`\${file.name}-\${file.size}-\${file.lastModified}\`;

    if (!currentMap.has(uniqueKey)) {
      filesToUpload.push(file);
      uniqueKeys.push(uniqueKey);
    }
  }

  if (filesToUpload.length === 0) {
    target.value = "";
    return;
  }

  try {
    isUploading.value = true;
    const uploadPromises = filesToUpload.map((file) => onUploadPhotoFile(file));
    const responses = await Promise.all(uploadPromises);

    let hasDefault = false;

    responses.forEach((responseFile, i) => {
      const file = filesToUpload[i];
      const uniqueKey = uniqueKeys[i];

      const newPhoto: PhotoItem = {
        id: responseFile?.id,
        url: URL.createObjectURL(file),
        file,
        name: file.name,
        path: responseFile?.path,
        is_default: false,
      };

      currentMap.set(uniqueKey, newPhoto);
    });

    hasDefault = Array.from(currentMap.values()).some((p) => p.is_default);
    if (!hasDefault && currentMap.size > 0) {
      const firstKey = currentMap.keys().next().value;
      currentMap.get(firstKey as string)!.is_default = true;
    }

    photos.value = currentMap;
  } catch (error) {
    console.error("Error uploading photos:", error);
  } finally {
    isUploading.value = false;
    target.value = "";
  }
};

const removePhoto = (key: string) => {
  const removed = photos.value.get(key);
  if (removed?.url?.startsWith("blob:")) {
    URL.revokeObjectURL(removed.url);
  }

  const wasDefault = removed?.is_default;
  photos.value.delete(key);

  if (wasDefault && photos.value.size > 0) {
    const firstKey = photos.value.keys().next().value;
    photos.value.get(firstKey as string)!.is_default = true;
  }

  photos.value = new Map(photos.value);
};

onBeforeUnmount(() => {
  for (const photo of photos.value.values()) {
    if (photo.url?.startsWith("blob:")) {
      URL.revokeObjectURL(photo.url);
    }
  }
});
<\/script>
`;export{n as default};
