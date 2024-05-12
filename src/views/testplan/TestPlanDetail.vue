<template>
  <div class="testplan-detail">
    <div
      ref="testplanTopbar"
      class="testplan-topbar right-topbar"
      :style="{
        left: leftValue,
      }"
    >
      <div class="testplan-info">
        <div class="topbar">测试计划分组</div>
      </div>
    </div>

    <div
      class="testplan-detail-main"
      :style="{
        paddingTop: mainTopValue,
        marginLeft: leftValue,
      }"
    >
      <el-tabs class="tab" v-model="editableTabsValue" type="card" editable @edit="handleTabsEdit">
        <el-tab-pane :key="item.name" v-for="(item, index) in editableTabs" :label="item.title" :name="item.name">
          {{ item.content }}
        </el-tab-pane>
      </el-tabs>

      <div ref="connectionFooter" class="testplan-footer" :style="{ marginLeft: leftValue }">footer</div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { LeftValues } from '@/utils/styles'
import _ from 'lodash'
import { Action, Getter } from 'vuex-class'
import useServices from '@/database/useServices'
import { getDefaultRecord } from '@/utils/mqttUtils'

@Component({
  components: {},
})
export default class TestPlanDetail extends Vue {
  private mainTopValues = 68

  get leftValue(): string {
    return LeftValues.Show
  }

  get mainTopValue(): string {
    return this.mainTopValues + 'px'
  }

  private testplan: TestplanModelTree = {
    id: '123',
    name: '',
    connection_id: '',
    protocol_version: '',
    payload_type: '',
    create_persion: '',
    resp_timeout: 3,
    retry_num: 0,
  }
  private name: string = 'limin'

  public async loadData(testplan: TestplanModelTree) {
    this.testplan = testplan
    console.log()
  }

  editableTabsValue = '2'
  editableTabs = [
    {
      title: 'Tab 1',
      name: '1',
      content: 'Tab 1 content',
    },
    {
      title: 'Tab 2',
      name: '2',
      content: 'Tab 2 content',
    },
  ]
  tabIndex = 2

  private handleTabsEdit(targetName: string, action: string) {
    if (action === 'add') {
      let newTabName = ++this.tabIndex + ''
      this.editableTabs.push({
        title: 'New Tab',
        name: newTabName,
        content: 'New Tab content',
      })
      this.editableTabsValue = newTabName
    }
    if (action === 'remove') {
      let tabs = this.editableTabs
      let activeName = this.editableTabsValue
      if (activeName === targetName) {
        tabs.forEach((tab, index) => {
          if (tab.name === targetName) {
            let nextTab = tabs[index + 1] || tabs[index - 1]
            if (nextTab) {
              activeName = nextTab.name
            }
          }
        })
      }

      this.editableTabsValue = activeName
      this.editableTabs = tabs.filter((tab) => tab.name !== targetName)
    }
  }
}
</script>

<style lang="scss" scope>
@import '~@/assets/scss/mixins.scss';

.testplan-detail {
  .testplan-topbar {
    border-bottom: 1px solid var(--color-border-default);
    .testplan-info {
      background-color: var(--color-bg-normal);
      .topbar {
        border-bottom: 0px;
        -webkit-app-region: drag;
      }
      .connection-head {
        display: flex;
        align-items: center;
        h2 .title-name {
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-right: 12px;
        }
        .offline {
          color: var(--color-text-light);
        }
        .icon-show-testplan,
        .icon-collapse {
          font-size: 20px;
        }
        a.show-testplan-button {
          color: var(--color-text-title);
          margin-right: 16px;
        }
        .icon-collapse {
          font-weight: bold;
        }
        .connection-message-count {
          margin-left: 12px;
          display: flex;
        }
        @include collapse-btn-transform(0deg, 180deg);
      }
      .connection-info {
        padding: 0 16px;
      }
    }
  }

  .testplan-detail-main {
    height: 100%;
    transition: all 0.5s;
    .testplan-body {
      position: relative;
    }
    .testplan-footer {
      transition: all 0.4s ease;
      position: fixed;
      width: inherit;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 3;
    }
  }
}

.tab {
  margin: 0px 16px 0 16px;
}
</style>
