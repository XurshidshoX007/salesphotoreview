const t=`<template>
  <d-modal name="Успешный" @closeDialog="closeDialog">
    <div class="text-5 fw-6 text-center text-[#299B9B]">
      {{ title }}
    </div>
  </d-modal>
</template>

<script setup lang="ts">
// props
const props = defineProps<{
  title: String;
}>();

// emit
const emit = defineEmits(["closeDialog"]);

// states

// methods
const closeDialog = () => emit("closeDialog");
<\/script>
`;export{t as default};
