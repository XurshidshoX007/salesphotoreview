const e=`<template>
  <div class="table-component relative">
    <table
      :style="tableStyles"
      :class="{
        'w-full table-content-bottom': headerT,
        'w-full table-content': !headerT,
        'sticky-header-table': stickyHeader,
      }"
    >
      <thead
        v-if="!withoutHeader"
        :class="{ 'sticky-header w-full': stickyHeader }"
      >
        <slot name="header"></slot>
        <div
          v-if="props.stickyHeader && !withInformationAboveHeader"
          class="absolute top-[1px] z-50 left-0 w-full h-[1px] bg-[#E1E4E4]"
        ></div>
        <tr
          class="border-primary-gray header-row relative"
          :class="[
            (!withInformationAboveHeader && !headerT && 'border-y-1') ||
              (headerT && 'border-t-1'),
          ]"
        >
          <th
            v-for="header in headers"
            :rowspan="header.rowspan"
            :key="header.key"
            v-show="header?.checked"
            :style="{ background: header.bgHeader }"
            class="text-start"
            :class="[
              header.key === 'stockEnough' || header.borderX
                ? 'border-r-1 last:border-r-0'
                : '',
              orderBy ? 'brr' : '',
              border ? 'brr1' : '',
              header.type === 'action',
            ]"
          >
            <div
              @click="
                changeSort(
                  header.key,
                  header?.is_sortable,
                  header?.type,
                  header?.accessorKey,
                  header?.sortKey,
                )
              "
              class="text-start relative"
              :class="
                isSortable(header?.is_sortable) &&
                header.type !== 'action' &&
                'cursor-pointer'
              "
            >
              <div
                v-if="header.type === 'checkbox'"
                :class="header?.right && 'flex justify-end'"
              >
                <div class="w-fit">
                  <Checkbox
                    id="all-select-row-items"
                    :disabled="loading || checkDisabled || isEmpty"
                    :checked="check"
                    :indeterminate="indeterminate"
                    @change="$emit('getAllId', $event)"
                  />
                </div>
              </div>
              <div
                v-if="
                  header.type !== 'checkbox' &&
                  header.checked &&
                  header.type !== 'action'
                "
                class="flex gap-1 fs-14 fw-4 items-center select-none"
                :class="
                  header?.right || header?.type === 'number'
                    ? 'justify-end text-end'
                    : ''
                "
              >
                <div class="secondary-gray-text">
                  {{ header.name }}
                </div>
                <div v-show="isSortable(header.is_sortable)" class="grid h-fit">
                  <div v-if="showSortIcon(header.sortKey || header.key)">
                    <div>
                      <icon-bottom-order-by
                        v-if="
                          !(
                            sorted?.field?.includes(
                              header.sortKey || header.key,
                            ) && !sorted.is_asc
                          )
                        "
                        class="rotate-180"
                      />
                    </div>
                    <div>
                      <icon-bottom-order-by
                        v-if="
                          !(
                            sorted?.field?.includes(
                              header.sortKey || header.key,
                            ) && sorted.is_asc
                          )
                        "
                      />
                    </div>
                  </div>
                </div>
                <div
                  v-if="header?.infoTooltip"
                  v-tooltip="{
                    text: header.infoTooltip,
                  }"
                >
                  <icon-info-circle color="#525866" />
                </div>
              </div>
              <div
                v-show="header.type === 'action'"
                class="flex gap-1 fs-14 fw-4 items-center justify-end"
              >
                <div class="secondary-gray-text text-center">
                  <icon-three-dots-s-v-g />
                </div>
              </div>
            </div>
          </th>
        </tr>
        <div
          v-if="stickyHeader"
          class="absolute bottom-0 left-0 w-full h-[1px] bg-[#E1E4E4]"
        ></div>
      </thead>
      <tbody :class="loading && 'opacity-50'" class="h-10 overflow-auto">
        <slot name="body"></slot>
      </tbody>
      <tfoot>
        <slot name="footer"></slot>
      </tfoot>
    </table>
    <div :class="isEmpty && 'h-16 flex justify-center items-center w-full'">
      <div
        v-if="isEmpty && !loading"
        class="flex items-center justify-center h-16 pt-2 w-full"
      >
        {{ t("empty") }}
      </div>
      <div v-show="loading" class="absolute top-[55%] left-[50%]">
        <icon-loading :loading="true" :width="14" :height="14" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import { useI18n } from "vue-i18n";
import type { OrderByParams } from "~/interfaces/api/params/list-parameters";
import type { Template } from "~/interfaces/ui/template";

// props
const props = defineProps({
  check: Boolean,
  headers: Array as PropType<Template[]>,
  loading: Boolean,
  sorted: Object as PropType<OrderByParams | null>,
  orderBy: Boolean,
  border: Boolean,
  withoutHeader: {
    type: Boolean,
    default: false,
  },
  withInformationAboveHeader: Boolean,
  isEmpty: Boolean,
  headerT: Boolean,
  checkDisabled: Boolean,
  tableStyles: Object,
  indeterminate: Boolean,
  stickyHeader: Boolean,
});

// emits
const emit = defineEmits(["sort", "getAllId"]);

// states
const previousField = ref<string>("");
const { t } = useI18n();

// methods
const changeSort = (
  field: string,
  is_sortable: boolean | undefined,
  type?: string,
  accKey?: string,
  sortKey?: string,
) => {
  if (!isSortable(is_sortable) || type === "checkbox" || type === "action") {
    return;
  }

  if (sortKey) {
    field = sortKey;
  } else if (type === "object" && accKey) {
    field = accKey.replace(".", "_");
  }

  // if (type?.includes(".")) {
  //   field = type?.replace(".", "_");
  // }

  if (field !== previousField.value) {
    emit("sort", { field, is_asc: true });
    previousField.value = field;
    return;
  }

  if (props.sorted) {
    if (props.sorted.is_asc) {
      emit("sort", { field, is_asc: false });
    } else {
      emit("sort", { field, is_asc: true });
    }
  } else {
    emit("sort", { field, is_asc: true });
  }

  previousField.value = field;
};

const isSortable = (is_sortable: boolean | undefined) => {
  if (typeof is_sortable === "undefined") return true;
  return is_sortable;
};

const showSortIcon = (key: string) => {
  if (!props.sorted) return false;
  return (
    props.sorted?.field === key ||
    props.sorted?.field === key ||
    props.sorted?.field === key + "_id" ||
    props.sorted?.field === key + "_name" ||
    props.sorted?.field === key + "_visual_id" ||
    props.sorted?.field === key + "_sort_value"
  );
};
<\/script>

<style scoped>
@-moz-document url-prefix() {
  .table-content {
    border-collapse: separate;
    border-spacing: 0px;
  }

  th {
    border-top: 1px solid #e1e4e4;
    border-bottom: 1px solid #e1e4e4;
  }

  td {
    border-top: 1px solid #e1e4e4;
    border-bottom: 1px solid #e1e4e4;
  }

  .border-primary-gray {
    border-color: #e1e4e4;
  }
}

td,
th {
  padding: 10px;
}

.header-row {
  background: theme("colors.neutral.50");
}

.table-content {
  width: 100%;
  overflow-y: auto;
  position: relative;
}

.table-content-bottom {
  width: 100%;
  overflow-y: auto;
  position: relative;
}

label input {
  display: none; /* Hide the default checkbox */
}

/* Style the artificial checkbox */
label span {
  height: 20px;
  width: 20px;
  border-radius: 4px;
  border: 1px solid #d2d7d7;
  display: inline-block;
  position: relative;
}

/* Style its checked state...with a ticked icon */
[type="checkbox"]:checked + span:before {
  content: "\\f106";
  position: absolute;
  font-weight: 700;
  color: transparent;
  transition: all 0.4s;
  left: 7px;
  top: 2px;
  width: 5px;
  height: 11px;
  border: solid #299b9b;
  border-width: 0 1px 1px 0;
  -ms-transform: rotate(45deg);
  transform: rotate(45deg);
}

.brr {
  border-right: 1px solid #e1e4e4;
}

.brr1:nth-child(3) {
  border-right: 1px solid #e1e4e4;
}

.brr1:nth-child(5) {
  border-right: 1px solid #e1e4e4;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  border: none;
}

.sticky-header th {
  position: sticky;
  top: 0;
  z-index: 10;
}

.sticky-header tr {
  border-bottom: none;
  border-top: none;
}

@media only screen and (max-width: 576px) {
  th {
    text-wrap: nowrap !important;
  }
}
</style>
`;export{e as default};
