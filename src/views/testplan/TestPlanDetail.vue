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
        <div class="topbar">{{ testplan.name }}</div>
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
        <el-tab-pane :key="item.id" v-for="(item, index) in editableTabs" :label="item.title" :name="item.name">
          {{ item.content.id }}
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
import { v4 as uuidv4 } from 'uuid'
import { Action, Getter } from 'vuex-class'
import useServices from '@/database/useServices'
import { getDefaultRecord } from '@/utils/mqttUtils'

@Component({
  components: {},
})
export default class TestPlanDetail extends Vue {
  private currentGroup: TestPlanCaseGroup = {
    id: uuidv4(),
    name: '新分类(1)',
  }

  /**
   * 新建一个tab时，用于初始化currentGroup
   * @param newTabName
   */
  private newTab(newTabName: string) {
    this.currentGroup = {
      id: uuidv4(),
      name: newTabName,
    }
  }

  get leftValue(): string {
    return LeftValues.Show
  }

  get mainTopValue(): string {
    return 68 + 'px'
  }

  /**
   * 执行计划
   */
  private testplan: TestplanModelTree = {
    id: '',
    name: '',
    connection_id: '',
    protocol_version: '',
    payload_type: '',
    create_persion: '',
    resp_timeout: 3,
    retry_num: 0,
  }

  /**
   * 列表页点击时传入的执行计划数据
   * @param testplan
   */
  public async loadData(testplan: TestplanModelTree) {
    this.testplan = testplan
  }

  /**
   * 创建一个空的测试用例
   */
  private defaultCase(): TestPlanCase {
    return {
      id: uuidv4(),
      group_id: this.currentGroup.id,
      planId: this.testplan.id,
      name: '',
      sendPayload: '',
      expectPayload: '',
      responsePayload: '',
      result: '',
    }
  }
  /**
   * Tab页初始化数据 Start
   */
  editableTabsValue = ''
  editableTabs = [
    {
      title: '',
      name: '',
      content: [
        {
          id: '',
          group_id: '',
          planId: '',
          name: '',
          sendPayload: '',
          expectPayload: '',
          responsePayload: '',
          result: '',
        },
      ],
    },
  ]
  tabIndex: any = 1
  //Tab页初始化数据 End

  mounted() {
    // 在组件挂载后初始化tabs
    this.editableTabsValue = this.currentGroup.name
    this.editableTabs = [
      {
        title: this.currentGroup.name,
        name: this.currentGroup.name,
        content: [this.defaultCase()],
      },
    ]
  }

  /**
   * tabs新增和删除事件
   * @param targetName
   * @param action
   */
  private handleTabsEdit(targetName: string, action: string) {
    if (action === 'add') {
      let newTabName = '新分类(' + ++this.tabIndex + ')'
      this.newTab(newTabName)
      this.editableTabs.push({
        title: this.currentGroup.name,
        name: this.currentGroup.name,
        content: [this.defaultCase()],
      })
      this.editableTabsValue = newTabName
      console.log(this.editableTabsValue)
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
