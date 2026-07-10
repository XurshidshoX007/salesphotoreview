const n=`<template>
  <flex-col
    class="bg-white rounded-large gap-4"
    :class="!noBorder && !noPadding && 'p-4'"
  >
    <div
      class="accordion-content-header"
      :class="headerRight && 'justify-between'"
    >
      <div
        class="accordion-header"
        :class="titlePosition === 'before' && 'flex-row-reverse'"
        @click.stop="changeToggle"
      >
        <button type="button">
          <icon-arrow-bottom
            class="btn-icon transition-transform"
            :class="isToggleOpen ? 'rotate-180' : ''"
          />
        </button>
        <div
          v-if="title"
          class="title"
          :class="{
            [\`text-\${titleSize}\`]: titleSize,
            'text-6': !titleSize,
            [\`font-\${titleWeight}\`]: titleWeight,
            'font-semibold': !titleWeight,
          }"
        >
          {{ title }}
        </div>
      </div>
      <div v-if="hasHeaderSlot" :class="!headerRight && 'w-[calc(100%-70px)]'">
        <slot name="header"></slot>
      </div>
    </div>

    <transition name="toggle-accordion">
      <div v-if="hasBodySlot && isToggleOpen && !noBorder">
        <slot name="body"></slot>
      </div>
    </transition>
  </flex-col>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  disabled?: boolean;
  titleSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  titleWeight?: 400 | 500 | 600;
  noBorder?: boolean;
  noPadding?: boolean;
  isOpen?: boolean;
  headerRight?: boolean;
  titlePosition?: "before" | "after";
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  disabled: false,
  titleSize: undefined,
  noBorder: false,
  noPadding: false,
  isOpen: false,
  headerRight: false,
  titlePosition: "after",
});

const slots = useSlots();
const isToggleOpen = ref<boolean>(props.isOpen);

const hasHeaderSlot = computed<boolean>(() => !!slots.header);
const hasBodySlot = computed<boolean>(() => !!slots.body);

watch(
  () => props.isOpen,
  (newVal: boolean) => {
    isToggleOpen.value = newVal;
  }
);

const changeToggle = (): void => {
  if (props.disabled) return;
  isToggleOpen.value = !isToggleOpen.value;
};
<\/script>

<style lang="scss" scoped>
.accordion-content-header {
  display: flex;
  background: transparent;
  user-select: none;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px;

  .accordion-header {
    cursor: pointer;
    display: flex;
    gap: 12px;
    background: transparent;
    user-select: none;
    align-items: center;

    button {
      border-radius: 8px;
      width: 24px;
      height: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #fafdfd;
      border: 1px solid #e1e4e4;
    }

    button:hover {
      background: #299b9b0d;
    }

    .title {
      font-family: "Inter", sans-serif;
      color: theme("colors.neutral.600");
    }
  }

  button {
    border-radius: 7px;
    width: 24px;
    height: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #fafdfd;
    border: 1px solid #e1e4e4;

    .btn-icon {
      display: block;
      transition: transform 300ms;
      transform-origin: center center;
    }
  }

  button:hover {
    background: #299b9b0d;
  }

  .title {
    font-family: "Inter", sans-serif;
    color: theme("colors.neutral.600");
  }
}

.accordion-header:hover {
  .title {
    color: #299b9b;
  }
}

.toggle-accordion-enter-to,
.toggle-accordion-leave-from {
  max-height: 1000px;
  width: 100%;
}

@media screen and (max-width: 992px) {
  .accordion-content-header {
    .accordion-header {
      gap: 16px;

      .title {
        font-size: 14px;
      }
    }
  }
}
</style>
`;export{n as default};
