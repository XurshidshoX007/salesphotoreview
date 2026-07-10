const n=`<template>
  <div class="double-tab-content">
    <div class="tab-content-container">
      <div class="tab-header-content">
        <ul class="nav-tabs">
          <li
            v-if="firstTabName"
            :class="openTab === TABS.FIRST ? 'tab-menu-active' : 'tab-menu'"
          >
            <a
              href="javascript:"
              v-on:click="toggleTabs(TABS.FIRST)"
              :class="[openTab !== TABS.FIRST ? 'tab-list' : 'tab-list-active']"
            >
              {{ firstTabName }}
            </a>
          </li>
          <li
            v-if="secondTabName"
            :class="openTab === TABS.SECOND ? 'tab-menu-active' : 'tab-menu'"
          >
            <a
              href="javascript:"
              v-on:click="toggleTabs(TABS.SECOND)"
              :class="openTab !== TABS.SECOND ? 'tab-list' : 'tab-list-active'"
            >
              {{ secondTabName }}
            </a>
          </li>
          <li
            v-if="thirdTabName"
            :class="openTab === TABS.THIRD ? 'tab-menu-active' : 'tab-menu'"
          >
            <a
              href="javascript:"
              v-on:click="toggleTabs(TABS.THIRD)"
              :class="openTab !== TABS.THIRD ? 'tab-list' : 'tab-list-active'"
            >
              {{ thirdTabName }}
            </a>
          </li>
          <li
            v-if="fourthTabName"
            :class="openTab === TABS.FOURTH ? 'tab-menu-active' : 'tab-menu'"
          >
            <a
              href="javascript:"
              v-on:click="toggleTabs(TABS.FOURTH)"
              :class="openTab !== TABS.FOURTH ? 'tab-list' : 'tab-list-active'"
            >
              {{ fourthTabName }}
            </a>
          </li>
          <li
            v-if="fifthTabName"
            :class="openTab === TABS.FIFTH ? 'tab-menu-active' : 'tab-menu'"
          >
            <a
              href="javascript:"
              v-on:click="toggleTabs(TABS.FIFTH)"
              :class="openTab !== TABS.FIFTH ? 'tab-list' : 'tab-list-active'"
            >
              {{ fifthTabName }}
            </a>
          </li>
          <li
            v-if="tabName"
            :class="openTab === TABS.ORDERS ? 'tab-menu-active' : 'tab-menu'"
          >
            <a
              href="javascript:"
              v-on:click="toggleTabs(TABS.ORDERS)"
              :class="openTab !== TABS.ORDERS ? 'tab-list' : 'tab-list-active'"
            >
              <div class="flex items-center gap-x-2">
                <div>
                  <IconShopping
                    :color="getIconColor(openTab === TABS.ORDERS)"
                  />
                </div>
                <div>{{ tabName }}</div>
              </div>
            </a>
          </li>
          <li
            v-if="rangeTabName"
            :class="openTab === TABS.PRODUCT ? 'tab-menu-active' : 'tab-menu'"
          >
            <a
              href="javascript:"
              v-on:click="toggleTabs(TABS.PRODUCT)"
              :class="openTab !== TABS.PRODUCT ? 'tab-list' : 'tab-list-active'"
            >
              <div class="flex items-center gap-x-2">
                <div>
                  <IconStack :color="getIconColor(openTab === TABS.PRODUCT)" />
                </div>
                <div>{{ rangeTabName }}</div>
              </div>
            </a>
          </li>
          <li
            v-if="salesTabName"
            :class="
              openTab === TABS.DYNAMIC_SALES ? 'tab-menu-active' : 'tab-menu'
            "
          >
            <a
              href="javascript:"
              v-on:click="toggleTabs(TABS.DYNAMIC_SALES)"
              :class="
                openTab !== TABS.DYNAMIC_SALES ? 'tab-list' : 'tab-list-active'
              "
            >
              <div class="flex items-center gap-x-2">
                <div>
                  <IconChart
                    :color="getIconColor(openTab === TABS.DYNAMIC_SALES)"
                  />
                </div>
                <div>{{ salesTabName }}</div>
              </div>
            </a>
          </li>
          <li
            v-if="debtTabName"
            :class="openTab === TABS.DEBT ? 'tab-menu-active' : 'tab-menu'"
          >
            <a
              href="javascript:"
              v-on:click="toggleTabs(TABS.DEBT)"
              :class="openTab !== TABS.DEBT ? 'tab-list' : 'tab-list-active'"
            >
              <div class="flex items-center gap-x-2">
                <div>
                  <IconCash :color="getIconColor(openTab === TABS.DEBT)" />
                </div>
                <div>{{ debtTabName }}</div>
              </div>
            </a>
          </li>
          <li
            v-if="equipmentTabName"
            :class="openTab === TABS.EQUIPMENT ? 'tab-menu-active' : 'tab-menu'"
          >
            <a
              href="javascript:"
              v-on:click="toggleTabs(TABS.EQUIPMENT)"
              :class="
                openTab !== TABS.EQUIPMENT ? 'tab-list' : 'tab-list-active'
              "
            >
              <div class="flex items-center gap-x-2">
                <div>
                  <IconDevice
                    :color="getIconColor(TABS.EQUIPMENT === openTab)"
                  />
                </div>
                <div>{{ equipmentTabName }}</div>
              </div>
            </a>
          </li>
          <li
            v-if="photoTabName"
            :class="
              openTab === TABS.PHOTO_REPORT ? 'tab-menu-active' : 'tab-menu'
            "
          >
            <a
              href="javascript:"
              v-on:click="toggleTabs(TABS.PHOTO_REPORT)"
              :class="
                openTab !== TABS.PHOTO_REPORT ? 'tab-list' : 'tab-list-active'
              "
            >
              <div class="flex items-center gap-x-2">
                <div>
                  <IconFotoSvg
                    :color="getIconColor(openTab === TABS.PHOTO_REPORT)"
                  />
                </div>
                <div>{{ photoTabName }}</div>
              </div>
            </a>
          </li>
          <li
            v-if="coordinateTabName"
            :class="openTab === TABS.LOCATION ? 'tab-menu-active' : 'tab-menu'"
          >
            <a
              href="javascript:"
              v-on:click="toggleTabs(TABS.LOCATION)"
              :class="
                openTab !== TABS.LOCATION ? 'tab-list' : 'tab-list-active'
              "
            >
              <div class="flex items-center gap-x-2">
                <div>
                  <icon-location
                    :size="20"
                    :class="
                      cn(
                        'text-[#6DCECE] fill-transparent hover:text-[#05A9A9] hover:fill-[#05A9A9] transition-colors',
                        openTab === TABS.LOCATION && 'text-teal-600',
                      )
                    "
                  />
                </div>
                <div>{{ coordinateTabName }}</div>
              </div>
            </a>
          </li>
        </ul>
      </div>
      <div class="tab-body-container">
        <div
          v-bind:class="{
            hidden: openTab !== TABS.FIRST,
            block: openTab === TABS.FIRST,
          }"
        >
          <slot name="first"></slot>
        </div>
        <div
          v-bind:class="{
            hidden: openTab !== TABS.SECOND,
            block: openTab === TABS.SECOND,
          }"
        >
          <slot name="second"></slot>
        </div>
        <div
          v-bind:class="{
            hidden: openTab !== TABS.THIRD,
            block: openTab === TABS.THIRD,
          }"
        >
          <slot name="third"></slot>
        </div>
        <div
          v-bind:class="{
            hidden: openTab !== TABS.FOURTH,
            block: openTab === TABS.FOURTH,
          }"
        >
          <slot name="fourth"></slot>
        </div>
        <div
          v-bind:class="{
            hidden: openTab !== TABS.FIFTH,
            block: openTab === TABS.FIFTH,
          }"
        >
          <slot name="fifth"></slot>
        </div>
        <div
          v-bind:class="{
            hidden: openTab !== TABS.ORDERS,
            block: openTab === TABS.ORDERS,
          }"
        >
          <slot name="order"></slot>
        </div>
        <div
          v-bind:class="{
            hidden: openTab !== TABS.PRODUCT,
            block: openTab === TABS.PRODUCT,
          }"
        >
          <slot name="range"></slot>
        </div>
        <div
          v-bind:class="{
            hidden: openTab !== TABS.DYNAMIC_SALES,
            block: openTab === TABS.DYNAMIC_SALES,
          }"
        >
          <slot name="sales"></slot>
        </div>
        <div
          v-bind:class="{
            hidden: openTab !== TABS.DEBT,
            block: openTab === TABS.DEBT,
          }"
        >
          <slot name="debt"></slot>
        </div>
        <div
          v-bind:class="{
            hidden: openTab !== TABS.EQUIPMENT,
            block: openTab === TABS.EQUIPMENT,
          }"
        >
          <slot name="equipment"></slot>
        </div>
        <div
          v-bind:class="{
            hidden: openTab !== TABS.PHOTO_REPORT,
            block: openTab === TABS.PHOTO_REPORT,
          }"
        >
          <slot name="photo"></slot>
        </div>
        <div
          v-bind:class="{
            hidden: openTab !== TABS.LOCATION,
            block: openTab === TABS.LOCATION,
          }"
        >
          <slot name="coordinate"></slot>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { cn, getHexByTWColor } from "~/utils/helpers";
// region Props and Emits

const props = defineProps({
  firstTabName: String,
  secondTabName: String,
  thirdTabName: String,
  fourthTabName: String,
  fifthTabName: String,
  tabName: String,
  rangeTabName: String,
  salesTabName: String,
  debtTabName: String,
  equipmentTabName: String,
  photoTabName: String,
  coordinateTabName: String,
  tabNumber: Number,
  borderless: {
    type: Boolean,
    default: false,
  },
  initialTabNumber: Number,
});

enum TABS {
  FIRST = 1,
  SECOND = 2,
  THIRD = 3,
  FOURTH = 4,
  FIFTH = 12,
  ORDERS = 5,
  PRODUCT = 6,
  DYNAMIC_SALES = 7,
  DEBT = 8,
  EQUIPMENT = 9,
  PHOTO_REPORT = 10,
  LOCATION = 11,
}

const emit = defineEmits(["change"]);

// endregion

// region States

const openTab = ref(props.initialTabNumber || 1);

// endregion

const getIconColor = (isColor?: boolean) => {
  return isColor ? getHexByTWColor("text-teal-600") : undefined;
};

// region Methods
const toggleTabs = (tabNumber: number) => {
  openTab.value = tabNumber;
  emit("change", tabNumber);
};

// endregion
<\/script>
<style scoped lang="scss">
.double-tab-content {
  display: flex;

  .tab-content-container {
    width: 100%;

    .tab-header-content {
      position: relative;

      ::-webkit-scrollbar-track {
        height: 8px;
        border-left: 1px solid #e1e4e4;
        border-right: 1px solid #e1e4e4;
        background: #fafdfd;
        border-radius: 0;
        margin: 0;
      }

      ::-webkit-scrollbar-thumb {
        background: #299b9b;
        border-radius: 0;
        height: 8px;
      }

      .nav-tabs {
        overflow-x: auto;
        overflow-y: hidden;
        display: flex;
        position: relative;
        align-items: end;

        .tab-menu-active {
          border-radius: 12px 12px 0 0;
          text-align: center;
          border: 1px solid #e1e4e4;
          border-bottom: none;
          background: #fafdfd;
          z-index: 2;
          margin-bottom: -1px;
          position: relative;

          &::after {
            content: "";
            position: absolute;
            bottom: -1px;
            left: 0;
            width: 100%;
            height: 3px;
            background: #fafdfd;
            z-index: 3;
            pointer-events: none;
          }
        }

        .tab-menu {
          border: 1px solid transparent;
          border-bottom: none;
          margin-bottom: -1px;
        }

        .tab-list {
          border-radius: 12px 12px 0 0;
          font-size: 14px;
          font-weight: 400;
          font-family: "Inter", sans-serif;
          display: block;
          padding: 8px 20px;
          color: #424f4f;
          position: relative;
          text-wrap: nowrap;

          &::after {
            content: "";
            position: absolute;
            bottom: 0px;
            transform: translateY(-100%);
            left: 0;
            width: 100%;
            height: 1px;
            background: #e1e4e4;
            z-index: 1;
          }
        }

        .tab-list-active {
          border-radius: 12px 12px 0 0;
          font-size: 14px;
          font-weight: 400;
          font-family: "Inter", sans-serif;
          text-align: start;
          display: block;
          padding: 8px 20px;
          color: #299b9b;
          background: #fafdfd;
          text-wrap: nowrap;
        }

        &::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 1px;
          background: #e1e4e4;
          z-index: 1;
        }
      }
    }

    .tab-body-container {
      position: relative;
      display: flex;
      flex-flow: column;
      border-radius: 0 0 12px 12px;
      width: 100%;
      border: 1px solid #e1e4e4;
      border-top: none;
      background: #fafdfd;
      padding: 14px;
    }
  }
}

@media only screen and (max-width: 767px) {
  .double-tab-content {
    .tab-content-container {
      .tab-header-content {
        .nav-tabs {
          .tab-list,
          .tab-list-active {
            font-size: 12px;
          }
        }
      }
    }
  }
}
</style>
`;export{n as default};
