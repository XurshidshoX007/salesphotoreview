const n=`<template>
  <button
    class="btn"
    :class="[
      groupClasses,
      (isDisable || loading) && 'btn-loading',
      textCenter ? 'justify-start' : 'justify-center',
    ]"
    :disabled="isDisable || loading"
    :type="type || 'button'"
  >
    <slot></slot>
    <loaders-btn-loader v-show="loading" :loading="loading" />
  </button>
</template>

<script setup lang="ts">
// props

const props = defineProps<{
  loading?: boolean;
  disabled?: boolean;
  type?: string;
  group?: string;
  textCenter?: boolean;
}>();

// hooks
const isDisable = computed((): boolean => {
  if (props.disabled || props.loading) return true;
  return false;
});

const groupClasses = computed(() => {
  switch (props.group) {
    case "delete":
      return "delete-btn";
    case "success":
      return "success-btn";
    case "blue":
      return "blue-btn";
    case "outlined":
      return "btn-outlined";
    case "gray":
      return "gray-btn";
    case "border":
      return "border-btn";
    case "orange":
      return "orange-btn";
    default:
      return "primary-btn";
  }
});
<\/script>

<style lang="scss" scoped>
.btn {
  padding: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  font-size: 14px;
  font-family: "Inter", sans-serif;
  font-weight: 400;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 0 16px;
  line-height: 18px;
  background-color: #fafdfd;
  color: #424f4f;
  border: 1px solid #d2d7d7;
  user-select: none;
  transition: all 0.2s ease-in-out;
}

.btn-loading {
  pointer-events: none;
  cursor: auto;
  opacity: 0.3;
}

.delete-btn {
  background-color: red;
  border: 1px solid red;
  color: white;
}

.delete-btn:hover {
  background-color: #dd0707;
  border: 1px solid #dd0707;
  color: white;
}

.delete-btn:active {
  background-color: #cd0202;
  border: 1px solid #cd0202;
  color: white;
}

.primary-btn {
  background-color: #299b9b;
  border: 1px solid #299b9b;
  color: white;
}

.border-btn {
  background-color: #fff;
  border: 1px solid #299b9b;
  color: #000000;
  text-overflow: ellipsis;
}

.border-btn:hover {
  background: #f1fefe;
}

.primary-btn:hover {
  background: #127e7e;
  border: 1px solid #127e7e;
  color: white;
}

.primary-btn:active {
  background: #0b6565;
  border: 1px solid #0b6565;
  color: white;
}

.success-btn {
  background-color: #23c00a;
  border: 1px solid #23c00a;
  color: white;
}

.success-btn:hover {
  background-color: #1fac09;
  border: 1px solid #1fac09;
  color: white;
}

.success-btn:active {
  border: 1px solid #1a9408;
  background-color: #1a9408;
}

.blue-btn {
  background-color: #057cd1;
  border: 1px solid #057cd1;
  color: white;
}

.blue-btn:hover {
  background-color: #026cb8;
  border: 1px solid #026cb8;
  color: white;
}

.blue-btn:active {
  background-color: #0166ad;
  border: 1px solid #0166ad;
  color: white;
}

.orange-btn {
  background-color: #ff8901;
  border: 1px solid #ff8901;
  color: white;
}

.orange-btn:hover {
  background-color: #e67601;
  border: 1px solid #e67601;
  color: white;
}

.orange-btn:active {
  background-color: #cd5201;
  border: 1px solid #cd5201;
  color: white;
}

.btn-outlined:hover {
  background-color: #eef6f6;
  color: #424f4f;
  border: 1px solid theme("colors.neutral.200");
}

.gray-btn {
  background-color: #e5e7eb;
  border: 1px solid transparent;
  color: theme("colors.neutral.600");
}

.gray-btn:hover {
  background-color: #d1d5db;
  color: theme("colors.neutral.600");
}

.gray-btn:active {
  background-color: #9ca3af;
  color: theme("colors.neutral.600");
}

@media only screen and (max-device-width: 767px) {
  .btn {
    padding: 6.5px 16px;
  }
}
</style>
`;export{n as default};
