const n=`<template>
  <div
    class="border-l dropdown-icon-btn flex items-center justify-center px-2.5"
    @click.stop="handleClick"
  >
    <div v-if="icon === 'config'">
      <icon-settings-alt />
    </div>
    <div v-if="icon === 'settings'">
      <IconSettings />
    </div>
    <div v-if="icon === 'menu-control'">
      <icon-menu-control-icon />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  icon: String,
  handleClick: Function,
});
<\/script>
`;export{n as default};
