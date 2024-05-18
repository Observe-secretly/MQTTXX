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
              @grid-ready="onGridReady"
            ></ag-grid-vue>
            <!-- edit tips -->
            <el-row :gutter="20">
              <el-col :span="24">
                <font color="#959595">{{ $t('testplan.edit_tab_tips') }}</font>
              </el-col>
            </el-row>
            <!-- Add Row Button -->
            <el-row :gutter="20" class="new-button-row">
              <el-col :span="12">
                <el-button plain icon="el-icon-upload" type="outline" size="mini" @click="savePlanDetail">
                  {{ $t('common.save') }}
                </el-button>
              </el-col>
              <el-col :span="12" style="text-align: right">
                <el-button
                  class="btn new-subs-btn"
                  icon="el-icon-plus"
                  plain
                  type="outline"
                  size="mini"
                  @click="addCase"
                >
                  {{ $t('testplan.add_case_row') }}
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
            <el-button plain type="outline"> {{ $t('testplan.run_testplan') }}</el-button>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { LeftValues } from '@/utils/styles'
import _, { forEach } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { Action, Getter } from 'vuex-class'
import useServices from '@/database/useServices'
import { AgGridVue } from 'ag-grid-vue'
import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'
import { use } from 'chai'

@Component({
  components: {
    AgGridVue,
  },
})
export default class TestPlanDetail extends Vue {
  /**
   * 列表页点击时传入的执行计划数据
   * @param testplan
   */
  async loadData(testplan: TestplanModelTree) {
    this.editableTabsValue = ''
    this.editableTabs = []
    this.testplan = testplan

    // 检查 testplan 是否有效
    if (!testplan || !testplan.id) {
      this.$notify({
        title: this.$tc('testplan.sys_error'),
        message: '',
        type: 'error',
        duration: 3000,
        offset: 30,
      })
      return
    }

    // 查询所有tab组
    const { testPlanCaseGroupService } = useServices()
    const tabs: TestPlanCaseGroupModel[] = (await testPlanCaseGroupService.getByPlanId(testplan.id)) ?? []

    if (tabs.length > 0) {
      this.currentTabGroup = tabs[0]
      this.editableTabsValue = this.currentTabGroup.name

      // 遍历所有的tab组，并获取相应的测试计划用例列表
      for (const tab of tabs) {
        const content = await this.getTestPlanCaseList(tab.name)
        this.editableTabs.push({
          title: tab.label,
          name: tab.name,
          content: content,
        })
      }
    } else {
      // 如果一个都没有则创建一个新的tab组
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

  private getTestPlanCaseList(id: string) {
    const { testPlanCaseService } = useServices()
    return testPlanCaseService.getByGroupId(id)
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

  /**
   * 添加case
   */
  private addCase() {
    // 根据 this.currentGroup.name 找到对应的 tab
    const tab = this.editableTabs.find((tab) => tab.name === this.currentTabGroup.name)
    if (tab) {
      // 在 content 中增加一个 this.defaultCase()
      tab.content.push(this.defaultCase())
    } else {
      console.error(`Tab with name ${this.currentTabGroup.name} not found`)
    }
  }

  /**
   * 删除case
   * @param id
   */
  private removeCase(id: any) {
    // 根据 this.currentGroup.name 找到对应的 tab
    const tab = this.editableTabs.find((tab) => tab.name === this.currentTabGroup.name)
    if (tab) {
      // 从 content 中删除指定的元素(前端渲染)
      if (tab.content.length > 0) {
        for (let i = 0; i < tab.content.length; i++) {
          if (tab.content[i].id === id) {
            // 删除找到的行
            tab.content.splice(i, 1)
            break // 删除第一个匹配的行后跳出循环
          }
        }
      } else {
        console.error(`No rows to remove in tab with name ${this.currentTabGroup.name}`)
      }
    } else {
      console.error(`Tab with name ${this.currentTabGroup.name} not found`)
    }
  }

  /**
   * 渲染删除case的删除按钮
   */
  private renderDeleteCaseButton(row: any) {
    return `<a style="color:red;" href="#" class="delete-case-button" data-id="${row.data.id}">Delete</a>`
  }

  private handleDeleteButtonClick(event: any) {
    if (event.target.classList.contains('delete-case-button')) {
      event.preventDefault() // 阻止默认链接点击行为
      const id = event.target.dataset.id
      this.removeCase(id)
    }
  }

  /**
   * 定义表格的头
   */
  private columnDefs = [
    { headerName: this.$tc('testplan.id'), field: 'id', editable: false, maxWidth: 110 },
    { headerName: this.$tc('testplan.head_name'), field: 'name', editable: true, minWidth: 100, maxWidth: 180 },
    {
      headerName: this.$tc('testplan.head_send_payload'),
      field: 'sendPayload',
      editable: true,
      minWidth: 100,
      maxWidth: 200,
    },
    {
      headerName: this.$tc('testplan.head_expect_payload'),
      field: 'expectPayload',
      editable: true,
      minWidth: 100,
      maxWidth: 200,
    },
    {
      headerName: this.$tc('testplan.head_response_payload'),
      field: 'responsePayload',
      editable: false,
      minWidth: 200,
    },
    { headerName: this.$tc('testplan.head_result'), field: 'result', editable: false, maxWidth: 80 },
    {
      headerName: this.$tc('testplan.operation'),
      cellRenderer: this.renderDeleteCaseButton,
      editable: false,
      maxWidth: 80,
    },
  ]

  private defaultColDef = {
    editable: true,
    sortable: true,
    flex: 1,
    minWidth: 100,
    filter: true,
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
    //1、校验表格的名称、发送、预期数据不能为空
    for (let i = 0; i < this.editableTabs.length; i++) {
      const tab = this.editableTabs[i]
      if (tab.name === this.currentTabGroup.name) {
        if (tab.content.length == 0) return
        for (let j = 0; j < tab.content.length; j++) {
          const caseItem = tab.content[j]
          if (caseItem.name === '' || caseItem.sendPayload === '' || caseItem.expectPayload === '') {
            this.$notify({
              title: this.$tc('testplan.case_info_incomplete'),
              message: '',
              type: 'error',
              duration: 3000,
              offset: 30,
            })
            return
          }
        }
        break
      }
    }
    //2、删除这个tab下的所有case
    const { testPlanCaseService } = useServices()
    try {
      testPlanCaseService.deleteByGroupId(this.currentTabGroup.name)
    } catch (error) {
      this.$notify({
        title: this.$tc('testplan.case_info_incomplete'),
        message: `${error.toString()}`,
        type: 'error',
        duration: 3000,
        offset: 30,
      })
      return
    }

    //3、保存当前数据
    try {
      for (let i = 0; i < this.editableTabs.length; i++) {
        const tab = this.editableTabs[i]
        if (tab.name === this.currentTabGroup.name) {
          for (let j = 0; j < tab.content.length; j++) {
            const caseItem = tab.content[j]
            testPlanCaseService.create(caseItem)
          }
          break // 找到匹配的 tab 后跳出外层循环
        }
      }
      this.$notify({
        title: this.$tc('testplan.save_case_successed'),
        message: '',
        type: 'success',
        duration: 3000,
        offset: 30,
      })
    } catch (error) {
      this.$notify({
        title: this.$tc('testplan.createfailed_case'),
        message: `${error.toString()}`,
        type: 'error',
        duration: 3000,
        offset: 30,
      })
    }
  }

  private mounted() {
    this.$el.addEventListener('click', this.handleDeleteButtonClick)
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
