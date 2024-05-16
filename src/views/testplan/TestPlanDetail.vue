<template>
  <div class="testplan-detail">
    <div
      ref="testplanTopbar"
      class="testplan-topbar right-topbar"
      :style="{
        left: leftValue,
      }"
    >
      <h2>
        <span class="title-name">{{ testplan.name }}</span>
      </h2>
    </div>

    <el-card>
      <div
        class="testplan-detail-main"
        :style="{
          paddingTop: mainTopValue,
          marginLeft: leftValue,
        }"
      >
        <el-tabs
          class="tab"
          v-model="editableTabsValue"
          type="card"
          editable
          @edit="handleTabsEdit"
          @tab-click="handleTabsClick"
        >
          <el-tab-pane :key="item.name" v-for="(item, index) in editableTabs" :label="item.title" :name="item.name">
            <!-- Table start -->
            <ag-grid-vue
              class="ag-theme-alpine"
              style="height: 500px"
              :columnDefs="columnDefs"
              :rowData="item.content"
              :defaultColDef="defaultColDef"
              :gridOptions="gridOptions"
              @grid-ready="onGridReady"
            ></ag-grid-vue>

            <!-- Add Row Button -->
            <el-row :gutter="20" class="new-button-row">
              <el-col :span="12">
                <el-button
                  class="btn new-subs-btn"
                  icon="el-icon-plus"
                  plain
                  type="outline"
                  size="mini"
                  @click="addRow"
                >
                  {{ $t('testplan.add_case_row') }}
                </el-button>
              </el-col>
              <el-col :span="12" style="text-align: right">
                <el-button plain icon="el-icon-upload" type="outline" size="mini" @click="savePlanDetail">
                  {{ $t('common.save') }}
                </el-button>
              </el-col>
            </el-row>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>

    <div ref="connectionFooter" class="testplan-footer" :style="{ marginLeft: leftValue }">
      <el-card>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-button @click="savePlanDetail"> {{ $t('common.save') }}</el-button>
          </el-col>
        </el-row>
      </el-card>
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
import { AgGridVue } from 'ag-grid-vue'
import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'

@Component({
  components: {
    AgGridVue,
  },
})
export default class TestPlanDetail extends Vue {
  private printTab() {
    console.log(this.currentTabGroup.name)
    this.editableTabs.forEach((tab, index) => {
      console.log(tab.name + '<-->' + tab.title)
    })
  }

  /**
   * 列表页点击时传入的执行计划数据
   * @param testplan
   */
  public async loadData(testplan: TestplanModelTree) {
    this.editableTabsValue = ''
    this.editableTabs = []
    this.testplan = testplan
    if (testplan == null || testplan == undefined || testplan.id == null || testplan.id == undefined) {
      this.$notify({
        title: this.$tc('testplan.sys_error'),
        message: '',
        type: 'error',
        duration: 3000,
        offset: 30,
      })
      return
    }

    //查询所有tab组
    const { testPlanCaseGroupService } = useServices()
    const tabs: TestPlanCaseGroupModel[] = (await testPlanCaseGroupService.getByPlanId(testplan.id)) ?? []
    if (tabs.length > 0) {
      this.currentTabGroup = tabs[0]
      this.editableTabsValue = this.currentTabGroup.name
      tabs.forEach((tab, index) => {
        this.editableTabs.push({
          title: tab.label,
          name: tab.name,
          content: [this.defaultCase()],
        })
      })
    } else {
      // 如果一个都没有则创建一个
      this.currentTabGroup = {
        label: this.$tc('testplan.new_tab_name'),
        name: uuidv4(),
        plan_id: testplan.id,
      }

      this.dbAddTab(this.currentTabGroup)
      this.editableTabsValue = this.currentTabGroup.name
      this.editableTabs = [
        {
          title: this.currentTabGroup.label,
          name: this.currentTabGroup.name,
          content: [this.defaultCase()],
        },
      ]
    }
  }

  private currentTabGroup: TestPlanCaseGroupModel = {
    label: this.$tc('testplan.new_tab_name'),
    name: uuidv4(),
    plan_id: '',
  }

  /**
   * 新建一个tab时，用于初始化currentGroup
   * @param newTabName
   */
  private newTab() {
    this.currentTabGroup = {
      label: this.$tc('testplan.new_tab_name'),
      name: uuidv4(),
      plan_id: this.testplan.id,
    }
  }

  get leftValue(): string {
    return LeftValues.Show
  }

  get mainTopValue(): string {
    return 32 + 'px'
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
   * 创建一个空的测试用例
   */
  private defaultCase(): TestPlanCaseModel {
    return {
      id: uuidv4().substr(0, 8),
      group_id: this.currentTabGroup.name,
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

  //Tab页初始化数据 End

  /**
   * tabs新增和删除事件
   * @param targetName
   * @param action
   */
  private async handleTabsEdit(targetName: string, action: string) {
    if (action === 'add') {
      this.newTab()
      this.editableTabs.push({
        title: this.currentTabGroup.label,
        name: this.currentTabGroup.name,
        content: [this.defaultCase()],
      })
      this.editableTabsValue = this.currentTabGroup.name
      //添加到数据库中
      this.dbAddTab(this.currentTabGroup)
    }
    if (action === 'remove') {
      let delId: string = this.editableTabsValue
      const tabs = this.editableTabs
      let activeName = this.editableTabsValue
      const filteredTabs = tabs.filter((tab) => tab.name !== targetName)

      // If the current active tab is being removed, select the next tab or the previous one
      if (activeName === targetName) {
        const tabIndex = tabs.findIndex((tab) => tab.name === targetName)
        const nextTab = tabs[tabIndex + 1] || tabs[tabIndex - 1]
        if (nextTab) {
          activeName = nextTab.name
        } else {
          activeName = ''
        }
      }

      this.editableTabs = filteredTabs
      this.editableTabsValue = activeName

      //从数据库删除
      this.dbDelTab(delId)
    }

    // 在tab发生改变的时候修改当前的Tab
    this.resetCurrentTab()
  }

  /**
   * 添加新的tab到数据库
   * @param addTab
   */
  private async dbAddTab(addTab: TestPlanCaseGroupModel) {
    const { testPlanCaseGroupService } = useServices()
    let res: TestPlanCaseGroupModel | undefined = undefined
    try {
      res = await testPlanCaseGroupService.create(addTab)
      this.$log.info(`Created testPlanCaseGroupService for the : ${res?.name}, label: ${res?.label}`)
      this.$notify({
        title: this.$tc('testplan.create_case_group_successed'),
        message: '',
        type: 'success',
        duration: 3000,
        offset: 30,
      })
    } catch (error) {
      this.$notify({
        title: this.$tc('testplan.createfailed'),
        message: `${error.toString()}`,
        type: 'error',
        duration: 3000,
        offset: 30,
      })
    }
  }

  /**
   * 从数据库删除tab
   * @param id
   */
  private async dbDelTab(id: string) {
    const { testPlanCaseGroupService } = useServices()
    let res: TestPlanCaseGroupModel | undefined = undefined
    try {
      res = await testPlanCaseGroupService.delete(id)
      this.$log.info(`Created testPlanCaseGroupService for the : ${res?.name}, label: ${res?.label}`)
      this.$notify({
        title: this.$tc('testplan.delete_case_group_successed'),
        message: '',
        type: 'success',
        duration: 3000,
        offset: 30,
      })
    } catch (error) {
      this.$notify({
        title: this.$tc('testplan.deletefailed'),
        message: `${error.toString()}`,
        type: 'error',
        duration: 3000,
        offset: 30,
      })
    }
  }

  private resetCurrentTab() {
    let tabs = this.editableTabs
    tabs.forEach((tab, index) => {
      if (tab.name === this.editableTabsValue) {
        this.currentTabGroup = {
          label: tab.title,
          name: tab.name,
          plan_id: this.testplan.id,
        }
        console.log(tabs[tabs.length - 1].name)
        console.log('--->' + this.currentTabGroup.name)
      }
    })
  }

  private handleTabsClick(tab: any) {
    this.currentTabGroup = {
      label: uuidv4(),
      name: tab.name,
      plan_id: this.testplan.id,
    }
  }

  private addRow() {
    // 根据 this.currentGroup.name 找到对应的 tab
    const tab = this.editableTabs.find((tab) => tab.name === this.currentTabGroup.name)
    console.log(this.editableTabs.length)
    console.log(tab?.name)
    if (tab) {
      // 在 content 中增加一个 this.defaultCase()
      tab.content.push(this.defaultCase())
    } else {
      console.error(`Tab with name ${this.currentTabGroup.name} not found`)
    }
  }

  private removeRow() {
    // 根据 this.currentGroup.name 找到对应的 tab
    const tab = this.editableTabs.find((tab) => tab.name === this.currentTabGroup.name)
    if (tab) {
      // 从 content 中删除最后一个元素
      if (tab.content.length > 0) {
        tab.content.pop()
      } else {
        console.error(`No rows to remove in tab with name ${this.currentTabGroup.name}`)
      }
    } else {
      console.error(`Tab with name ${this.currentTabGroup.name} not found`)
    }
  }

  /**
   * 定义表格的头
   */
  private columnDefs = [
    { headerName: this.$tc('testplan.id'), field: 'id', editable: false },
    { headerName: this.$tc('testplan.head_name'), field: 'name', editable: true },
    { headerName: this.$tc('testplan.head_send_payload'), field: 'sendPayload', editable: true },
    { headerName: this.$tc('testplan.head_expect_payload'), field: 'expectPayload', editable: true },
    { headerName: this.$tc('testplan.head_response_payload'), field: 'responsePayload', editable: false },
    { headerName: this.$tc('testplan.head_result'), field: 'result', editable: false },
  ]

  private defaultColDef = {
    editable: true,
    sortable: true,
    flex: 1,
    minWidth: 100,
    filter: true,
  }

  private gridOptions = {
    overlayNoRowsTemplate:
      '<span style="padding: 10px; border: 1px solid #444; background: lightgoldenrodyellow;">No data available</span>',
  }

  private gridApi: any
  private gridColumnApi: any

  private onGridReady(params: any) {
    this.gridApi = params.api
    this.gridColumnApi = params.columnApi
  }

  /**
   * 保存测试计划明细
   */
  private savePlanDetail() {
    console.log(this.editableTabs[0].content[0])
  }
}
</script>

<style lang="scss" scope>
@import '~@/assets/scss/mixins.scss';

.testplan-detail {
  .testplan-topbar {
    margin: 20px 0px 20px 20px;
    h2 .title-name {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-right: 12px;
      color: var(--color-text-light);
    }
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

  .new-button-row {
    margin-top: 16px;
  }

  .el-tabs__content {
    overflow: hidden;
    position: relative;
    margin-top: -16px !important;
  }
  .ag-theme-alpine .ag-root-wrapper {
    border: solid 1px;
    border-color: #d3dce6 !important;
    border-radius: 0 4px 4px 4px;
  }
  .ag-theme-alpine .ag-header {
    border-color: #d3dce6 !important;
  }
}
</style>
