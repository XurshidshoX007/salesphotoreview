const n=`<template>
  <div>
    <table class="w-[90%] table-content h-fit">
      <thead class="">
        <tr class="mr-1.5 border-primary-gray border-b-1 header-row">
          <th
            :style="{ background: header.bgHeader }"
            v-for="header in headers"
            :key="header"
            class="whitespace-nowrap"
          >
            <div v-if="header.checked">
              <div v-if="header.type === 'checkbox'">
                <div class="pt-1">
                  <label class="mt-1">
                    <input type="checkbox" />
                    <span></span>
                  </label>
                </div>
              </div>
              <div
                v-if="header.type !== 'checkbox'"
                :style="{ width: header.thWidth }"
                class="flex p-1 gap-1 fs-14 fw-4"
                :class="header?.right && 'justify-end'"
              >
                <div class="secondary-gray-text">
                  {{ header.name }}
                </div>
              </div>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <slot name="body"></slot>
      </tbody>
    </table>
    <div v-show="loading" class="absolute top-[50%] left-[50%]">
      <icon-loading :loading="true" :width="14" :height="14" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import type { DataTableConfiguration } from "~/interfaces/ui/data-table-configuration";

// props
const props = defineProps({
  headers: Array,
  sorted: Object,
  bordered: String,
  loading: Boolean,
  configuration: {
    type: Object as PropType<DataTableConfiguration>,
    default: {
      isCreate: false,
      isNoCreate: true,
    },
  },
});

// emits
const emit = defineEmits(["sort"]);
<\/script>

<style scoped>
td,
th {
  padding: 9px;
}

.fa-icon {
  color: #374957;
}

.header-row {
  background: #fafdfd;
}

.table-content {
  width: 100%;
  overflow-y: auto;
  position: relative;
  margin-bottom: 8px;
}

.th-style {
  /*display: flex;*/
  justify-content: center;
  padding-right: 10px;
  position: sticky;
  right: 0px;
  top: auto;
  width: 50px;
  height: 49px;
  background: white;
  box-shadow: -4px 0px 4px 0px rgba(0, 0, 0, 0.04);
}

.th-styles {
  display: flex;
  width: 50px;
}
</style>
`;export{n as default};
