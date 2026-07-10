const e=`<template>
  <div>
    <input
      type="text"
      class="hidden"
      :tabindex="-1"
      :required="required"
      :value="isFormValid(selectedData)"
      @invalid.prevent="
        requiredCheck(selectedData, stateKey, requiredNotification, name)
      "
    />
  </div>
</template>

<script setup>
// props
const props = defineProps({
  name: String,
  required: Boolean,
  requiredNotification: Boolean,
  selectedData: [Array, Object, String, Number],
  stateKey: [String, Number],
  isFormValid: Function,
  requiredCheck: Function,
});
<\/script>
`;export{e as default};
