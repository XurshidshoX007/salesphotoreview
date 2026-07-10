const n=`<template>
  <div class="grid grid-cols-1 w-full gap-2">
    <div class="flex-row">
      <span class="fs-14 fw-4 text-gray-3"> Наименования </span>
    </div>
    <div class="flex-row">
      <d-input
        placeholder="Введите"
        class="w-full"
        type="text"
        @change="(value) => (value = value)"
      />
    </div>

    <div class="flex flex-row mt-2 items-center justify-between w-full gap-2">
      <m-btn class="grow" @click="save"> Добавить </m-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";

const save = async () => {
  // notify({ title: "Пожалуйста подождите!" });

  notify({ title: "Сохранено!" });
};
<\/script>
`;export{n as default};
