const n=`<template>
  <div class="w-full overflow-auto rounded-t-large rounded-b-1.5 border-grey">
    <data-table :loading="isLoading" :is-empty="!products?.products?.length">
      <template #header>
        <c-tr class="border-t-0 bg-[#F5FBFB] z-11">
          <c-td-no-edit
            class="fs-14 fw-4 text-grey"
            v-for="key in headers"
            :key="key.key"
          >
            <div v-if="key.key === 'cost'">
              <div class="flex items-center gap-x-2 float-right">
                {{ key.name }}
                <d-input
                  type="number"
                  class="w-60"
                  :value="totalInput"
                  :disabled="!products?.products?.length"
                  @input="onChangeAllProductPrice($event.target.value)"
                />
              </div>
            </div>
            <div v-else>
              {{ key.name }}
            </div>
          </c-td-no-edit>
        </c-tr>
      </template>
      <template #body>
        <c-tr
          v-for="(data, index) in products?.products"
          :key="data.id"
          :class="[index + 1 === products?.products?.length && 'border-b-0']"
        >
          <c-td-no-edit v-for="key in headers" :key="key">
            <span v-if="key.key === 'no'">{{ ++index }}</span>
            <span v-if="key.key !== 'cost'">
              {{ data[key.key] }}
            </span>
            <div v-if="key.key === 'cost'" class="float-right">
              <d-input
                :value="data?.cost"
                @change="onChangePrice($event, data)"
                type="number"
                class="w-60"
              />
            </div>
          </c-td-no-edit>
        </c-tr>
      </template>
    </data-table>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  products: Object,
  data: Object,
  isLoading: Boolean,
});
const totalInput = ref<string>("");

const emit = defineEmits(["onChangePrice", "onChangeAllProductPrice"]);

const headers = ref([
  {
    name: "№",
    key: "no",
    checked: true,
    type: "come",
  },
  {
    name: "Название",
    key: "product_name",
    checked: true,
    type: "come",
  },
  {
    name: "Сумма",
    key: "cost",
    checked: true,
    type: "come",
  },
]);

function onChangePrice(
  newValue: number | null,
  product: { cost: number | null; product_id: string }
) {
  product.cost = newValue;
  const { cost, product_id } = product;
  emit("onChangePrice", { cost, product_id });
}

const onChangeAllProductPrice = (newValue: string | null) => {
  totalInput.value = Number(newValue?.toString().replace(/\\s/g, ""));
  emit(
    "onChangeAllProductPrice",
    Number(newValue?.toString().replace(/\\s/g, ""))
  );
};

watch(
  () => props.products,
  (newValue, oldValue, onCleanup) => {
    totalInput.value = "";
  }
);
<\/script>
`;export{n as default};
