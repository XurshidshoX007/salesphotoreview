const e=`<template>
  <div class="flex gap-2" v-if="availablePages">
    <ArrowBtn
      direction="left"
      :disabled="currentPage === 1"
      @click="currentPage !== 1 && setPage(currentPage - 1)"
    />
    <div v-for="page in pageNumbers" :key="page" class="flex group">
      <div
        v-if="page === 'three-dots'"
        class="flex items-center justify-center"
      >
        <icon-dots-icon />
      </div>
      <index-btn
        v-else
        :is-active="currentPage === page"
        @click="setPage(page)"
      >
        <div :class="{ 'group-hover:text-[#299B9B]': currentPage !== page }">
          {{ page }}
        </div>
      </index-btn>
    </div>
    <ArrowBtn
      direction="right"
      :disabled="currentPage === availablePages"
      @click="currentPage !== availablePages && setPage(currentPage + 1)"
    />
  </div>
</template>

<script setup lang="ts">
import ArrowBtn from "./ArrowBtn.vue";

// props
const props = defineProps<{
  currentPage?: number;
  availablePages?: number;
}>();

// emits
const emit = defineEmits(["setPage"]);

// hooks
const pageNumbers = ref<(number | string)[]>([]);

const generatePageNumbers = () => {
  const { availablePages: totalPages, currentPage } = props;
  const viewportWidth = window.innerWidth;
  const isMobile = viewportWidth <= 456;

  if (totalPages <= 5) {
    pageNumbers.value = Array.from({ length: totalPages }, (_, i) => i + 1);
    return;
  }

  if (isMobile) {
    const pages: (number | string)[] = [];
    pages.push(1);

    if (currentPage > 2) pages.push("three-dots");
    if (currentPage !== 1 && currentPage !== totalPages)
      pages.push(currentPage);
    if (currentPage < totalPages - 1) pages.push("three-dots");

    pages.push(totalPages);
    pageNumbers.value = pages;
    return;
  }

  const pages: (number | string)[] = [1];
  if (currentPage > 2) pages.push("three-dots");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    if (i !== 1 && i !== totalPages) pages.push(i);
  }

  if (currentPage < totalPages - 1) pages.push("three-dots");
  pages.push(totalPages);

  pageNumbers.value = pages;
};

const setPage = (page: number) => {
  emit("setPage", page);
};

onMounted(() => {
  generatePageNumbers();
  window.addEventListener("resize", generatePageNumbers);
  window.addEventListener("load", generatePageNumbers);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", generatePageNumbers);
  window.removeEventListener("load", generatePageNumbers);
});

watch(() => [props.currentPage, props.availablePages], generatePageNumbers);
<\/script>

<style scoped lang="scss">
.arrow-button {
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.arrow-button-a {
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.arrow-button-a:hover {
  border: 1px solid #e1e4e4;
  border-radius: 8px;
}
</style>
`;export{e as default};
