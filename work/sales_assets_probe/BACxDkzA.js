const n=`<template>
  <div class="roles-menu">
    <div v-for="role in roleItems" :key="role.id" class="w-full">
      <div
        class="role-icon"
        :class="activeRoleId !== role.id ? '' : 'active'"
        @click="changeRole(role.id)"
      >
        <component :is="role?.icon" />
        <div class="role-title">{{ role.name }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// props
const props = defineProps<{
  roleItems: Array<{
    id: number;
    name: string;
    icon: ReturnType<typeof defineAsyncComponent>;
    tooltip?: string;
  }>;
  activeRoleId?: number;
}>();

// emits
const emit = defineEmits<{
  (e: "change-role", id: number): void;
}>();

// methods
const changeRole = (id: number) => {
  emit("change-role", id);
};
<\/script>

<style lang="scss" scoped>
.roles-menu {
  padding: 5px;
  background-color: theme("colors.primary.600");
  border-radius: 8px;
  color: theme("colors.neutral.0");
  display: flex;
  align-items: center;
  gap: 4px;
}

.role-icon {
  background-color: theme("colors.primary.600");
  color: theme("colors.neutral.0");
  cursor: pointer;
  border-radius: 8px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px;
  flex: 1;
  transition: all 0.3s ease;
  overflow: hidden;

  .role-title {
    opacity: 0;
    width: 0;
    transition: all 0.3s ease;
  }
}

.role-icon.active {
  background-color: theme("colors.neutral.0");
  color: theme("colors.primary.600");

  .role-title {
    opacity: 1;
    width: auto;
    transition: all 0.3s ease;
  }
}
</style>
`;export{n as default};
