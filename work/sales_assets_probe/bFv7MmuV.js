const n=`<template>
  <div>
    <div class="calendar-container" v-click-outside="outside2">
      <div class="content-input">
        <div class="calendar-input-quarter" @click="personal">
          <IconCalendarSVG />
          <div :title="formatTitle" class="input-text">
            {{ format(quarterData) }}
          </div>
        </div>
      </div>
      <div v-if="openPersonal" class="range-calendar-content">
        <div class="left-content">
          <VueDatePicker
            v-model="year"
            multi-dates
            year-picker
            locale="ru"
            :year-range="[2020, new Date().getFullYear()]"
            auto-apply
            inline
          >
          </VueDatePicker>
        </div>
        <div class="right-content grid grid-cols-2">
          <div v-for="date in quarterData" class="quarter-section col-span-1">
            <Checkbox
              :title="date.name"
              :checked="date.is_active"
              :id="date.id"
              @change="changeCheckBox($event, 'quarter', date.id)"
            />
            <div v-for="sec in date.items" class="item">
              <Checkbox
                :title="sec.name"
                :id="sec.id"
                :checked="sec.is_active"
                @change="changeCheckBox($event, 'quarter-item', sec.id)"
              />
            </div>
          </div>
          <div class="arr"></div>
        </div>
        <div class="footer">
          <div @click="outside2" class="exit">{{ t("labels.exit") }}</div>
          <div @click="onApply" class="save">{{ t("save") }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import { useI18n } from "vue-i18n";

// emit

const emit = defineEmits(["onApply"]);

// props

const props = defineProps({
  defaultQuartersValues: Array,
});

// state
const { t } = useI18n();
const year = ref([new Date().getFullYear()]);
const formatTitle = ref("");
const defaultQuarterValues = ref([]);
const openPersonal = ref(false);
const quarterData = ref([
  {
    name: t("date_picker.1_st_quarter"),
    id: "1_st_quarter",
    is_active: false,
    items: [
      {
        name: t("months.january"),
        id: 1,
        is_active: false,
      },
      {
        name: t("months.february"),
        id: 2,
        is_active: false,
      },
      {
        name: t("months.march"),
        id: 3,
        is_active: false,
      },
    ],
  },
  {
    name: t("date_picker.2_st_quarter"),
    id: "2_st_quarter",
    is_active: false,
    items: [
      {
        name: t("months.april"),
        id: 4,
        is_active: false,
      },
      {
        name: t("months.may"),
        id: 5,
        is_active: false,
      },
      {
        name: t("months.june"),
        id: 6,
        is_active: false,
      },
    ],
  },
  {
    name: t("date_picker.3_st_quarter"),
    id: "3_st_quarter",
    is_active: false,
    items: [
      {
        name: t("months.july"),
        id: 7,
        is_active: false,
      },
      {
        name: t("months.august"),
        id: 8,
        is_active: false,
      },
      {
        name: t("months.september"),
        id: 9,
        is_active: false,
      },
    ],
  },
  {
    name: t("date_picker.4_st_quarter"),
    id: "4_st_quarter",
    is_active: false,
    items: [
      {
        name: t("months.october"),
        id: 10,
        is_active: false,
      },
      {
        name: t("months.november"),
        id: 11,
        is_active: false,
      },
      {
        name: t("months.december"),
        id: 12,
        is_active: false,
      },
    ],
  },
]);

// method

const format = (formatData) => {
  if (!formatData?.length) return "";

  const formattedNames = [];
  year.value = year.value.sort((a, b) => a - b);
  formatData.forEach((item) => {
    year.value.forEach((yearItem) => {
      const yearSuffix = year.value.length > 1 ? \` \${yearItem}\` : "";

      if (item.is_active) {
        const formattedName = \`\${item.name?.split("ар")[0]}\${yearSuffix}\`;
        formattedNames.push(formattedName);
      } else {
        item.items?.forEach((nItem) => {
          if (nItem.is_active) {
            const formattedName = \`\${nItem.name?.slice(0, 3)}\${yearSuffix}\`;
            formattedNames.push(formattedName);
          }
        });
      }
    });
  });
  let returnInputText = formattedNames.join(", ");
  formatTitle.value = returnInputText;
  if (returnInputText?.length > 22) {
    return returnInputText.slice(0, 22) + " ...";
  } else {
    return returnInputText;
  }
};

function outside2() {
  openPersonal.value = false;
  defaultValues();
}

function personal() {
  openPersonal.value = !openPersonal.value;
}

const onApply = () => {
  if (year.value && quarterData.value) {
    const emitData = [];
    const years = year.value;

    const processItems = (items, isActive = false) => {
      items?.forEach((item) => {
        if (isActive || item.items?.find((n) => n.is_active)) {
          item.items?.forEach((nItem) => {
            if (isActive || nItem.is_active) {
              years.forEach((yearItem) => {
                emitData.push({ year: yearItem, month: nItem.id });
              });
              if (isActive) nItem.is_active = true;
            }
          });
          if (isActive) item.is_active = true;
        }
      });
    };

    processItems(quarterData.value);

    if (emitData.length === 0) {
      processItems(quarterData.value, true);
    }

    emit("onApply", emitData);
    format(quarterData.value);
  }
  openPersonal.value = !openPersonal.value;
  defaultQuarterValues.value = quarterData.value;
};

const defaultValues = () => {
  const years = [];
  quarterData.value = quarterData.value?.map((item) => {
    item.items?.map((chItem) => {
      if (props.defaultQuartersValues?.find((k) => k.month === chItem.id)) {
        chItem.is_active = true;
        return chItem;
      } else {
        chItem.is_active = false;
        return chItem;
      }
    });
    item.is_active =
      item.items?.filter((k) => k.is_active)?.length === item.items.length;
    return item;
  });
  props?.defaultQuartersValues?.map((item) => {
    years.push(item.year);
  });
  defaultQuarterValues.value = quarterData.value;
  year.value = [...new Set(years)];
};

const isDeleted = () => {
  year.value = [new Date().getFullYear()];
  quarterData.value = quarterData.value?.map((item) => {
    item.items?.map((chItem) => {
      if (chItem.id === new Date().getMonth() + 1) {
        chItem.is_active = true;
        return chItem;
      } else {
        chItem.is_active = false;
        return chItem;
      }
    });
    item.is_active = false;
    return item;
  });
};

const changeCheckBox = (
  isChecked: boolean,
  type: string,
  id: string | number,
) => {
  if (type === "quarter") {
    quarterData.value?.forEach((item) => {
      if (item.id === id) {
        item.is_active = isChecked;
        item.items?.forEach((chItem) => {
          chItem.is_active = isChecked;
        });
      }
    });
  } else {
    quarterData.value?.forEach((item) => {
      let allActive = true;
      item.items?.forEach((chItem) => {
        if (chItem.id === id) {
          chItem.is_active = isChecked;
        }
        if (!chItem.is_active) {
          allActive = false;
        }
      });
      item.is_active = allActive;
    });
  }
};

// hooks

onMounted(() => {
  defaultValues();
});

// define

defineExpose({
  onApply,
  isDeleted,
});
<\/script>

<style scoped lang="scss">
.calendar-container {
  position: relative;

  .content-input {
    .calendar-input-quarter {
      height: 42px;
      border: 1px solid #299b9b;
      border-radius: 8px;
      font-weight: 400;
      font-size: 15px;
      font-family: "Inter", sans-serif;
      color: #000;
      cursor: pointer;
      display: flex;
      flex-wrap: nowrap;
      overflow: hidden;
      float: right;
      width: 255px;
      padding: 16px 12px;
      background: white;
      align-items: center;
      gap: 10px;

      .input-text {
        display: flex;
        text-wrap: nowrap;
        line-height: 20px;
        width: calc(100% - 28px);
        padding: 0 5px;
      }
    }
  }

  .range-calendar-content {
    position: absolute;
    top: 52px;
    right: 0;
    width: 580px;
    box-shadow: 0px 4px 18px 0px #00000014;
    z-index: 111 !important;
    border-radius: 8px;
    background: white;
    border: 1px solid #d2d7d7;
    flex-wrap: wrap;
    display: flex;

    .left-content {
      width: 42%;
    }

    .right-content {
      border-radius: 8px;
      position: relative;
      width: 58%;
      gap: 16px;
      padding: 18px;

      .quarter-section {
        .item {
          padding: 2px 0 2px 15px;
        }
      }

      .arr {
        width: 12px;
        height: 12px;
        background: white;
        border-left: 1px solid #d2d7d7;
        border-top: 1px solid #d2d7d7;
        transform: rotate(45deg);
        position: absolute;
        top: -6.6px;
        left: 50%;
      }
    }

    .footer {
      width: 100%;
      padding: 10px;
      display: flex;
      justify-content: end;
      gap: 0 10px;
      align-items: center;
      border-top: 1px solid #d2d7d7;

      .exit {
        padding: 6px 15px;
        color: #424f4f;
        font-family: "Inter", sans-serif;
        font-weight: 400;
        cursor: pointer;
        font-size: 14px;
        background: #fafdfd;
        border: 1px solid #d2d7d7;
        border-radius: 8px;
      }

      .save {
        padding: 6px 15px;
        color: white;
        font-family: "Inter", sans-serif;
        font-weight: 400;
        cursor: pointer;
        font-size: 14px;
        background: #299b9b;
        border-radius: 8px;
      }

      .exit:active,
      .exit:hover,
      .save:hover {
        opacity: 0.8;
      }
    }
  }
}
</style>
`;export{n as default};
