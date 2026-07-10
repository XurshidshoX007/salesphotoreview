const n=`<template>
  <div class="accordion-content" :class="!noBorder && 'border-class'">
    <div
      @click="onOpenTable"
      v-if="title"
      class=""
      :class="[
        isTableOpen && 'bg-[#FAFDFD]',
        (children && 'accordion-header-children') || 'accordion-header',
      ]"
    >
      <div class="icon">
        <IconMinus color="#299B9B" v-if="isTableOpen" />
        <IconPlus v-else />
      </div>
      <div :class="(isTableOpen && 'active-title') || 'title'">
        {{ title }}
      </div>
    </div>

    <transition name="toggle-accordion">
      <div v-if="isTableOpen">
        <div :class="(special && 'accordion-body-special') || 'accordion-body'">
          <slot name="body"></slot>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
// props

const props = defineProps({
  isOpen: Boolean,
  noBorder: Boolean,
  title: String,
  special: Boolean,
  children: Boolean,
});

// emit
const emit = defineEmits(["change"]);
// state

const isTableOpen = ref(false);
// method
const onOpenTable = () => {
  isTableOpen.value = !isTableOpen.value;
  emit("change", isTableOpen.value);
};

watch(
  () => props.isOpen,
  (newIsOpen) => {
    isTableOpen.value = newIsOpen;
  }
);
<\/script>
<style scoped lang="scss">
.accordion-content {
  background-color: #fafdfd;
  gap: 20px;
  overflow: hidden;

  .icon {
    width: 20px;
  }

  .accordion-header {
    padding: 14px;
    display: flex;
    align-items: center;
    cursor: pointer;

    gap: 0 4px;

    .title {
      font-weight: 500;
      font-family: "Inter", sans-serif;
      font-size: 16px;
      color: #424f4f;
    }

    .active-title {
      font-weight: 500;
      font-family: "Inter", sans-serif;
      font-size: 16px;
      color: #299b9b;
    }
  }

  .accordion-header-children {
    padding: 9px 14px;
    display: flex;
    align-items: center;
    cursor: pointer;

    gap: 0 4px;

    .title {
      font-family: "Inter", sans-serif;
      font-size: 14px;
      font-weight: 500;
    }

    .active-title {
      font-weight: 500;
      font-size: 14px;
      color: #299b9b;
    }
  }

  .accordion-header:hover {
    .title {
      color: #299b9b;
    }
  }

  .accordion-body {
    padding: 0px 24px 24px;
    background-color: #fafdfd;
  }

  .accordion-body-special {
    padding: 0;
    background-color: #fafdfd;
  }
}

.border-class {
  border-bottom: 1px solid #e1e4e4;
}
</style>
`;export{n as default};
