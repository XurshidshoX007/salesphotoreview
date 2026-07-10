const n=`<template>
  <d-modal
    @closeDialog="closeDialog"
    :dataContainerWidth="'590px'"
    :name="'Добавить'"
  >
    <div class="w-full">
      <div class="">
        <div class="fs-12">Имя</div>
        <div class="py-2">
          <d-input placeholder="Введите" type="text" class="w-full" />
        </div>
      </div>
      <div class="">
        <div class="py-2"></div>
      </div>
    </div>
    <template #footer>
      <div class="p-4">
        <m-btn class="w-full"> Добавить </m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
// emits
const emit = defineEmits(["closeDialog"]);

// methods
const closeDialog = () => emit("closeDialog");

const filter = ref({
  isElement: false,
});
<\/script>
`;export{n as default};
