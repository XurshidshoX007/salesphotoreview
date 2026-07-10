const n=`<template>
  <div>
    <flex-col>
      <div class="text-2xl font-semibold text-gray-3">
        {{ title }}
      </div>
      <div class="w-full overflow-auto bg-white rounded-[12px] border mt-4">
        <table class="w-full overflow-auto rounded-[12px] bg-white">
          <tr class="whitespace-nowrap border-b border-b-grey bg-[#FAFDFD]">
            <th v-for="key in headers" :key="key.name">
              <div
                v-if="key.key === selectKey"
                class="w-9/10 m-auto font-normal"
              >
                <DropdownsByFilterStates
                  :filterStates="filterStates"
                  @onOpenDropdown="onOpenDropdown"
                  @search="search"
                />
              </div>
              <div
                v-else
                class="flex items-center pl-2 justify-start h-14 border-r-1"
              >
                {{ key.name }}
              </div>
            </th>
          </tr>
          <tr
            class="border-b border-b-grey"
            v-for="(data, index) in productBatchList"
            :key="data?.id"
          >
            <td v-for="key in headers" :key="key.name">
              <div>
                <div
                  v-if="key.key === selectKey"
                  class="w-9/10 m-auto font-normal"
                >
                  <DropdownsByFilterStates
                    :filterStates="getTypesFilterStateByIdAndIdx(index)"
                    @onOpenDropdown="onOpenDropdown"
                    @search="search"
                    :key="data?.id"
                  />
                </div>
                <div
                  v-else
                  class="h-14 fs-14 px-2 flex items-center border-r-1"
                >
                  {{ data[key.key] }}
                </div>
              </div>
            </td>
          </tr>
        </table>
      </div>
      <div class="flex justify-end mt-2">
        <m-btn :loading="loading" @click="onSave">Сохранить</m-btn>
      </div>
    </flex-col>
  </div>
</template>

<script setup lang="ts">
// emit
const emit = defineEmits(["onSave", "onOpenDropdown", "search"]);

// props
const props = defineProps({
  title: String,
  filterStates: Array,
  headers: Array,
  productBatchList: Array,
  loading: Boolean,
  selectName: String,
  selectKey: String,
  headerKey: String,
  selectId: String,
  data: Array,
});

// methods

const onSave = async () => {
  emit("onSave");
};

const search = async (state, value) => {
  emit("search", state, value);
};

const onOpenDropdown = async (state, value) => {
  emit("onOpenDropdown", state, value);
};

const getTypesFilterStateByIdAndIdx = (idx) => {
  return [
    {
      name: props.selectName,
      key: props.selectKey,
      isSingleSelect: true,
      get data() {
        return props.data || [];
      },
      get getSelectedData() {
        return props.productBatchList[idx][props.selectId];
      },
      set setSelectedData(value) {
        props.productBatchList[idx][props.selectId] = value;
      },
    },
  ];
};
<\/script>

<style scoped>
tr:last-child {
  border-bottom: none;
}
</style>
`;export{n as default};
