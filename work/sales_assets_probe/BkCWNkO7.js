const n=`<template>
  <d-modal
    :dataContainerWidth="'618px'"
    :name="'Установите коэффициент продажа'"
    @closeDialog="closeDialog"
  >
    <div class="w-full">
      <div class="">
        <div class="fs-12">Установить</div>
        <div class="py-2">
          <d-input placeholder="Введите" type="text" class="w-full" />
        </div>
      </div>
    </div>
    <template #footer>
      <div class="grid grid-cols-2 gap-4">
        <cancel-btn @click="closeDialog">Отменить</cancel-btn>
        <m-btn class="w-full"> Установить </m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
// emits
const emit = defineEmits(["closeDialog"]);

// methods
const closeDialog = () => emit("closeDialog");
<\/script>
`;export{n as default};
