<template>
  <div class="testplan-detail">
    <div
      ref="testplanTopbar"
      class="testplan-topbar right-topbar topbar"
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
          @tab-click="tabClick"
        >
          <el-tab-pane :key="item.name" v-for="(item, index) in editableTabs" :label="item.title" :name="item.name">
            <template slot="label">
              <span
                v-if="!isEditTabName && editTabName != item.name"
                style="display: inline-block; text-align: center"
                @dblclick="tabsContent(item.name)"
              >
                {{ item.title }}
              </span>
              <el-input
                @keydown.native.delete.capture.stop
                v-if="isEditTabName && editTabName == item.name"
                size="mini"
                class="edit-tab-input"
                v-model="item.title"
                type="text"
                @blur="updateTabName"
              />
            </template>

            <!-- Table start -->
            <ag-grid-vue
              class="ag-theme-alpine"
              style="height: calc(100vh - 304px)"
              :columnDefs="columnDefs"
              :rowData="item.content"
              :defaultColDef="defaultColDef"
              @grid-ready="
                (tdata) => {
                  onGridReady(tdata, item.name)
                }
              "
              @cell-value-changed="updateCase"
            ></ag-grid-vue>
            <!-- edit tips -->
            <el-row :gutter="20">
              <el-col :span="24">
                <font color="#959595">{{ $t('testplan.edit_tab_tips') }}</font>
              </el-col>
            </el-row>
            <!-- Add Row Button -->
            <el-row :gutter="20" class="new-button-row">
              <el-col :span="24">
                <el-button class="btn new-subs-btn" icon="el-icon-plus" type="outline" size="mini" @click="addCase">
                  {{ $t('testplan.add_case_row') }}
                </el-button>
              </el-col>
            </el-row>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>

    <div ref="connectionFooter" class="testplan-footer" :style="{ marginLeft: leftValue }">
      <el-card class="footer-card">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input
              size="mini"
              :disabled="isStartRunTestPlan"
              placeholder="Topic Name"
              style="margin-bottom: 10px"
              v-model="sendTopicName"
              @input="topicUpdate"
            >
              <template slot="prepend">{{ $t('testplan.send_topic') }}</template>
            </el-input>

            <el-input
              size="mini"
              :disabled="isStartRunTestPlan"
              placeholder="Topic Name"
              v-model="subReceiveRecord.topic"
              @input="topicUpdate"
            >
              <template slot="prepend">{{ $t('testplan.subscribe_topic') }}</template>
              <!-- <template slot="suffix">
                <el-button type="text" size="mini">高级</el-button>
              </template> -->
            </el-input>
          </el-col>
          <el-col :span="12">
            <el-row>
              <el-col :span="8" class="container">
                <div class="name-container">
                  <div class="dot"></div>
                  <div class="name">{{ $t('testplan.case_count') }}</div>
                </div>
                <h1 class="content">{{ caseCount }}</h1>
              </el-col>
              <el-col :span="8" class="container">
                <div class="name-container">
                  <div class="dot-red"></div>
                  <div class="name">{{ $t('testplan.failed_case_count') }}</div>
                </div>
                <h1 class="content">{{ failedCaseCount }}</h1>
              </el-col>
              <el-col :span="8" class="container">
                <div class="name-container">
                  <div class="dot-green"></div>
                  <div class="name">{{ $t('testplan.successed_case_count') }}</div>
                </div>
                <h1 class="content">{{ successedCaseCount }}</h1>
              </el-col>
            </el-row>
          </el-col>
          <el-col :span="4" class="container">
            <div class="name-container">
              <!-- 运行测试计划 -->
              <el-button
                v-if="!isStartRunTestPlan"
                type="primary"
                size="small"
                icon="el-icon-caret-right"
                @click="runTestPlanAll"
              >
                {{ $t('testplan.run_testplan') }}</el-button
              >
              <!-- 停止测试计划 -->
              <el-button
                v-if="isStartRunTestPlan"
                type="danger"
                size="small"
                icon="el-icon-loading"
                @click="stopTestPlan"
              >
                {{ $t('testplan.stop_testplan') }}</el-button
              >
            </div>
            <div class="content">
              <!-- 导出测试用例 -->
              <p>
                <el-button plain size="small" icon="el-icon-download" @click="exportTestPlan">
                  {{ $t('testplan.export') }}</el-button
                >
              </p>
              <!-- 打开开发者工具 -->
              <p>
                <a href="#" @click="openDevTools">打开开发者工具</a>
              </p>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { LeftValues } from '@/utils/styles'
import { MessageBox } from 'element-ui'
import _, { forEach } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { Action, Getter } from 'vuex-class'
import useServices from '@/database/useServices'
import { AgGridVue } from 'ag-grid-vue'
import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'

import { MqttClient, IConnackPacket, IPublishPacket, IClientPublishOptions, IDisconnectPacket, Packet } from 'mqtt'
import { createClient } from '@/utils/mqttUtils'
import getErrorReason from '@/utils/mqttErrorReason'
import { Subject, fromEvent } from 'rxjs'
import { bufferTime, map, filter, takeUntil } from 'rxjs/operators'
import cbor from 'cbor'
import time from '@/utils/time'
import validFormatJson from '@/utils/validFormatJson'
import { jsonStringify } from '@/utils/jsonUtils'
import CircularQueue from '@/utils/CircularQueue'

import { ipcRenderer } from 'electron'

@Component({
  components: {
    AgGridVue,
  },
})
export default class TestPlanDetail extends Vue {
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
    send_topic: '',
    receive_topic: '',
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
          retryNum: 0,
          result: '',
        },
      ],
    },
  ]
  //Tab页初始化数据 End

  /**
   * 定义表格的头
   */
  private columnDefs = [
    { headerName: this.$tc('testplan.id'), field: 'id', editable: false, minWidth: 110, maxWidth: 110 },
    { headerName: this.$tc('testplan.head_name'), field: 'name', editable: true, resizable: true, minWidth: 100 },
    {
      headerName: this.$tc('testplan.head_send_payload'),
      field: 'sendPayload',
      editable: true,
      resizable: true,
      minWidth: 100,
    },
    {
      headerName: this.$tc('testplan.head_expect_payload'),
      field: 'expectPayload',
      editable: true,
      resizable: true,
      minWidth: 100,
    },
    {
      headerName: this.$tc('testplan.head_response_payload'),
      field: 'responsePayload',
      editable: true,
      resizable: true,
      minWidth: 200,
    },
    {
      headerName: this.$tc('testplan.retry_num'),
      field: 'retryNum',
      minWidth: 80,
    },
    {
      headerName: this.$tc('testplan.head_result'),
      field: 'result',
      editable: false,
      minWidth: 80,
      maxWidth: 80,
      cellRenderer: this.renderCaseResultButton,
    },
    {
      headerName: this.$tc('testplan.operation'),
      cellRenderer: this.renderDeleteCaseButton,
      editable: false,
      minWidth: 100,
      maxWidth: 100,
    },
  ]

  private subReceiveRecord: SubscriptionModel = {
    id: '',
    topic: '',
    qos: 0,
    disabled: false,
    createAt: time.getNowDate(),
    alias: '',
    nl: undefined,
    rap: undefined,
    rh: undefined,
    subscriptionIdentifier: undefined,
  }
  private subLoading = false

  private client: Partial<MqttClient> = {
    connected: false,
    options: {},
  }

  private isEditTabName = false
  private editTabName = ''

  private connectionModel!: ConnectionModel
  private connectLoading = false
  private disconnectLoding = false
  private reTryConnectTimes = 0
  private curConnectionId!: string | undefined
  private sendFrequency: number | undefined = undefined
  private sendTimeId: number | null = null
  private sendTimedMessageCount = 0
  private maxReconnectTimes!: number

  private sendTopicName: string = ''
  private caseCount: number = 0
  private failedCaseCount: number = 0
  private successedCaseCount: number = 0

  private restoreCircularQueue: CircularQueue<string> = new CircularQueue<string>(100)

  private defaultColDef = {
    editable: true,
    sortable: true,
    flex: 1,
    minWidth: 100,
    filter: true,
  }

  private gridApiMap = new Map()
  private gridColumnApiMap = new Map()

  private onGridReady(params: any, name: string) {
    this.gridApiMap.set(name, params.api)
    this.gridColumnApiMap.set(name, params.columnApi)
  }

  private isStartRunTestPlan: boolean = false

  /**
   * 更新topic信息
   */
  private async topicUpdate() {
    this.testplan.send_topic = this.sendTopicName
    this.testplan.receive_topic = this.subReceiveRecord.topic

    //更新topic到数据库
    const { testPlanService } = useServices()
    await testPlanService.update(this.testplan.id, this.testplan)
  }

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

    this.sendTopicName = this.testplan.send_topic
    this.subReceiveRecord.topic = this.testplan.receive_topic
  }

  /**
   * 根据分组ID获取case列表
   * @param id 分组ID
   */
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
      retryNum: 0,
    }
  }

  private tabClick(tab: any) {
    this.currentTabGroup.label = tab.label
    this.currentTabGroup.name = tab.name
    this.editableTabsValue = tab.name
  }

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
        content: [],
      })
      this.editableTabsValue = this.currentTabGroup.name
      //添加到数据库中
      this.dbAddTab(this.currentTabGroup)
    } else if (action === 'remove') {
      const confirmation = confirm(this.$tc('testplan.del_case_group_confirm'))
      if (confirmation) {
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

        // //从数据库删除
        this.dbDelTab(targetName)
      }
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
    const { testPlanCaseGroupService, testPlanCaseService } = useServices()
    let res: TestPlanCaseGroupModel | undefined = undefined
    try {
      //删除分组
      res = await testPlanCaseGroupService.delete(id)
      this.$log.info(`Delete testPlanCaseGroupService for the : ${res?.name}, label: ${res?.label}`)
      //删除分组下的case
      await testPlanCaseService.deleteByGroupId(id)
      this.$log.info(`Delete testPlanCaseService for group id : ${id}`)
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
      }
    })
  }

  /**
   * 添加case
   */
  private async addCase() {
    // 根据 this.currentGroup.name 找到对应的 tab
    const tab = this.editableTabs.find((tab) => tab.name === this.currentTabGroup.name)
    if (tab) {
      // 在 content 中增加一个 this.defaultCase()
      let testCase = this.defaultCase()
      tab.content.push(testCase)
      //在数据库中增加case
      const { testPlanCaseService } = useServices()
      await testPlanCaseService.create(testCase)
    } else {
      console.error(`Tab with name ${this.currentTabGroup.name} not found`)
    }
  }

  /**
   * 单独运行某一个case
   * @param id
   */
  private singleRunCase(id: any) {
    this.runTestPlan(id)
  }

  /**
   * 删除case
   * @param id
   */
  private async removeCase(id: any) {
    try {
      await MessageBox.confirm('你确定要删除测试用例吗?', '删除', {
        confirmButtonText: '是',
        cancelButtonText: '否',
        type: 'error',
      })

      // 根据 this.currentGroup.name 找到对应的 tab
      const tab = this.editableTabs.find((tab) => tab.name === this.currentTabGroup.name)
      if (tab) {
        // 从 content 中删除指定的元素(前端渲染)
        if (tab.content.length > 0) {
          for (let i = 0; i < tab.content.length; i++) {
            if (tab.content[i].id === id) {
              // 删除找到的行
              tab.content.splice(i, 1)
              //在数据库中删除case
              const { testPlanCaseService } = useServices()
              await testPlanCaseService.delete(id)

              break // 删除第一个匹配的行后跳出循环
            }
          }
        } else {
          console.error(`No rows to remove in tab with name ${this.currentTabGroup.name}`)
        }
      } else {
        console.error(`Tab with name ${this.currentTabGroup.name} not found`)
      }
    } catch (error) {
      // User cancelled the confirmation
      console.log('Deletion cancelled by user')
    }
  }

  /**
   * 更新case
   */
  private async updateCase(event: any) {
    // 当单元格值改变时的事件处理程序
    // event参数包含了改变后的值以及相关的数据
    const newValue = event.newValue
    const oldValue = event.oldValue
    const rowNode = event.node
    const rowData = rowNode.data

    const { testPlanCaseService } = useServices()
    await testPlanCaseService.update(rowData.id, rowData)
  }

  /**
   * 渲染操作按钮
   */
  private renderDeleteCaseButton(row: any) {
    let html = `
      <i class="run-case-button el-icon-video-play" data-id="${row.data.id}"></i> 
      <i class="delete-case-button el-icon-delete" data-id="${row.data.id}"></i>
    `
    return html
  }

  private renderCaseResultButton(row: any) {
    if (row.data.result) {
      if (row.data.result == 'success') {
        return `<i class='el-icon-circle-check' style='color:#34c388;font-size:20px;'></i>`
      } else if (row.data.result == 'failed') {
        return `<i class='el-icon-circle-close' style='color:red;font-size:20px;'></i>`
      } else if (row.data.result == 'send') {
        return `<i class='el-icon-loading' style='font-size:20px;'></i>`
      }
    } else {
      return ''
    }
  }

  /**
   * 给表格上的操作列增加监听
   * @param event
   */

  private handleDeleteButtonClick(event: any) {
    if (event.target.classList.contains('delete-case-button')) {
      event.preventDefault() // 阻止默认链接点击行为
      const id = event.target.dataset.id
      this.removeCase(id)
    } else if (event.target.classList.contains('run-case-button')) {
      event.preventDefault() // 阻止默认链接点击行为
      const id = event.target.dataset.id
      this.singleRunCase(id)
    }
  }
  /**
   * 运行所有测试用例
   */
  private async runTestPlanAll() {
    this.runTestPlan(undefined)
  }

  /**
   * 运行测试计划
   * @param caseId 此值可以为空。为空时测试全部测试用例。
   */
  private async runTestPlan(caseId: any) {
    let isSignleRunCase = false
    if (this.isStartRunTestPlan) {
      return
    }

    //只有测试全部的时候才清空测试报告
    if (!caseId) {
      //清理测试报告
      this.clearReport()
    } else {
      isSignleRunCase = true
    }

    // this.editableTabs
    const { connectionService } = useServices()
    //1、查询mqtt连接详情
    const connection: ConnectionModel | undefined = await connectionService.get(this.testplan.connection_id)
    if (connection === null || connection === undefined) {
      this.$notify({
        title: this.$tc('testplan.connect_info_invalidate'),
        message: '',
        type: 'error',
        duration: 3000,
        offset: 30,
      })
      return
    }
    this.connectionModel = connection
    this.curConnectionId = this.connectionModel.id
    //2、尝试获取连接
    if (await this.connect(this.connectionModel)) {
      console.log('连接成功')
      //订阅topic
      this.subscribe()

      //切换状态
      this.isStartRunTestPlan = true
    } else {
      console.log('连接失败')
      return
    }
    //3、循环发送所有case。等待响应
    if (isSignleRunCase) {
      this.sendSingleCaseMessage(caseId)
    } else {
      this.sendCaseMessage()
    }
  }

  /**
   * 停止测试计划
   */
  private async stopTestPlan() {
    //断开mqtt连接
    this.disconnect()
    //切换状态
    this.isStartRunTestPlan = false
  }

  // Connect
  public async connect(connection: ConnectionModel): Promise<boolean | void> {
    if (this.client.connected || this.connectLoading) {
      return false
    }
    this.connectLoading = true
    // new client
    try {
      const { curConnectClient, connectUrl } = await createClient(connection)
      this.client = curConnectClient
      const { name, id } = connection
      if (id && this.client.on) {
        this.$log.info(`Assigned ID ${id} to MQTTX client`)
        this.client.on('connect', this.onConnect)
        this.client.on('error', this.onError)
        this.client.on('reconnect', this.onReConnect)
        this.client.on('disconnect', this.onDisconnect)
        this.client.on('offline', this.onOffline)
        this.onMessageArrived(this.client as MqttClient, id)
        // Debug MQTT Packet Log
        this.client.on('packetsend', (packet) => this.onPacketSent(packet, name))
        this.client.on('packetreceive', (packet) => this.onPacketReceived(packet, name))
      }

      const protocolLogMap: ProtocolMap = {
        mqtt: 'MQTT/TCP connection',
        mqtts: 'MQTT/SSL connection',
        ws: 'MQTT/WS connection',
        wss: 'MQTT/WSS connection',
      }
      const curOptionsProtocol: Protocol = (this.client as MqttClient).options.protocol as Protocol
      let connectLog = `Client ${connection.name} connected using ${protocolLogMap[curOptionsProtocol]} at ${connectUrl}`
      this.$log.info(connectLog)
      return true
    } catch (error) {
      const err = error as Error
      this.connectLoading = false
      // this.notifyMsgWithCopilot(err.toString())
    }
  }

  // Disconnect
  private disconnect(): boolean | void {
    if (!this.client.connected || this.disconnectLoding) {
      return false
    }
    this.stopTimedSend()
    this.disconnectLoding = true
    this.client.end!(false, () => {
      this.disconnectLoding = false
      this.reTryConnectTimes = 0
      this.$notify({
        title: this.$tc('connections.disconnected'),
        message: '',
        type: 'success',
        duration: 3000,
        offset: 30,
      })
      this.$log.info(
        `MQTTX client named ${this.connectionModel.name} with client ID ${this.connectionModel.clientId} disconnected`,
      )
    })
  }

  // Connect callback
  private onConnect(conBack: IConnackPacket) {
    this.connectLoading = false

    // this.changeActiveConnection({
    //   id: this.curConnectionId,
    //   client: this.client,
    // })
    this.$notify({
      title: this.$tc('connections.connected'),
      message: '',
      type: 'success',
      duration: 3000,
      offset: 30,
    })
    // this.setShowClientInfo(false)
    // this.$emit('reload', false, false, this.handleReSubTopics)
    this.$log.info(`Successful connection for ${this.connectionModel.name}, MQTT.js onConnect trigger`)
  }

  // Error callback
  private onError(error: Error) {
    let msgTitle = this.$tc('connections.connectFailed')
    if (error) {
      msgTitle = error.toString()
    }
    this.forceCloseTheConnection()
    // this.notifyMsgWithCopilot(msgTitle)
    this.$log.error(
      `Connection for ${this.connectionModel.name} failed, MQTT.js onError trigger, Error: ${error.stack}`,
    )
    // this.$emit('reload')
  }

  // Reconnect callback
  private onReConnect() {
    if (!this.connectionModel.reconnect) {
      this.forceCloseTheConnection()
      this.$notify({
        title: this.$tc('connections.connectFailed'),
        message: '',
        type: 'error',
        duration: 3000,
        offset: 30,
      })
      // this.$emit('reload')
    } else {
      if (this.reTryConnectTimes > this.maxReconnectTimes) {
        this.$log.warn('Max reconnect limit reached, stopping retries')
        this.forceCloseTheConnection()
      } else {
        this.$log.info(`Retrying connection for ${this.connectionModel.name}, attempt: ${this.reTryConnectTimes}`)
        this.reTryConnectTimes += 1
        this.connectLoading = true
        this.$notify({
          title: this.$tc('connections.reconnect'),
          message: '',
          type: 'warning',
          duration: 3000,
          offset: 30,
        })
      }
    }
  }

  private onDisconnect(packet: IDisconnectPacket) {
    const reasonCode = packet.reasonCode!
    const reason = reasonCode === 0 ? 'Normal disconnection' : getErrorReason('5.0', reasonCode)
    console.log('onDisconnect:' + reason)
    const logMessage = 'Received disconnect packet from Broker. MQTT.js onDisconnect trigger'
    this.$log.warn(logMessage)
  }

  private onOffline() {
    this.$log.info(
      `The connection ${this.connectionModel.name} (clientID ${this.connectionModel.clientId}) is offline. MQTT.js onOffline trigger`,
    )
  }

  /**
   * Handles the event when a packet is sent.
   * @param {Packet} packet - The packet that was sent.
   * @param {string} name - The name of the connection.
   */
  private onPacketSent(packet: Packet, name: string) {
    this.$log.debug(`[${name}] Sent packet: ${JSON.stringify(packet)}`)
  }

  /**
   * Handles the event when a packet is received.
   *
   * @param {Packet} packet - The received packet.
   * @param {string} name - The name of the connection.
   */
  private onPacketReceived(packet: Packet, name: string) {
    this.$log.debug(`[${name}] Received packet: ${JSON.stringify(packet)}`)
  }

  public stopTimedSend() {
    // const timedMessageRef: TimedMessage = this.$refs.timedMessage as TimedMessage
    // timedMessageRef['record'] = {
    //   sendFrequency: undefined,
    // }
    this.sendFrequency = undefined
    this.sendTimedMessageCount = 0
    if (this.sendTimeId) {
      clearInterval(this.sendTimeId)
      this.sendTimeId = null
      this.$message.success(this.$tc('connections.stopTimedMessage'))
      this.$log.info(`Timed messages sending stopped for ${this.connectionModel.name}`)
    }
  }

  private forceCloseTheConnection() {
    if (this.client.end) {
      this.client.end(true, () => {
        this.reTryConnectTimes = 0
        this.connectLoading = false
        this.$log.warn(
          `MQTTX force closed the connection ${this.connectionModel.name} (Client ID: ${this.connectionModel.clientId})`,
        )
      })
    }
  }

  private onClose() {
    this.$log.info(`Connection for ${this.connectionModel.name} closed, MQTT.js onClose trigger`)
    this.connectLoading = false
  }

  /**
   *  清空统计数据
   */
  private clearReport() {
    this.editableTabs.forEach((tab, index) => {
      tab.content.forEach((content, index) => {
        content.result = ''
        content.responsePayload = ''
        content.retryNum = 0
      })

      // 刷新当前渲染的表格
      let gridApi = this.gridApiMap.get(tab.name)
      if (gridApi && gridApi != undefined) {
        const rowCount = gridApi.rowModel.getRowCount()
        for (let i = 0; i < rowCount; i++) {
          this.refreshGridRow(gridApi, i)
        }
      }
    })
  }

  /**
   * 统计测试计划信息<br>
   * 可以在未开始、测试中、测试结束后调用
   */
  private report() {
    //统计用例总数
    let total = this.editableTabs.reduce((total, tab) => {
      // 过滤满足条件的 content 元素
      const filteredContent = tab.content.filter((content) => {
        // 判断case的完整性 //TODO

        // 判断条件，判断是否启用 TODO
        return content.sendPayload != null
      })

      // 将满足条件的元素数量加入总数
      return total + filteredContent.length
    }, 0)

    let successed = this.editableTabs.reduce((total, tab) => {
      const filteredContent = tab.content.filter((content) => {
        return content.result == 'success'
      })

      // 将满足条件的元素数量加入总数
      return total + filteredContent.length
    }, 0)

    let failed = this.editableTabs.reduce((total, tab) => {
      const filteredContent = tab.content.filter((content) => {
        return content.result == 'failed'
      })

      // 将满足条件的元素数量加入总数
      return total + filteredContent.length
    }, 0)

    this.caseCount = total
    this.failedCaseCount = failed
    this.successedCaseCount = successed
  }

  public async subscribe() {
    let isFinished = false
    let qos = this.subReceiveRecord.qos
    let nl = this.subReceiveRecord.nl
    let rap = this.subReceiveRecord.rap
    let rh = this.subReceiveRecord.rh

    if (this.client.subscribe) {
      let properties: { subscriptionIdentifier: number } | undefined = undefined
      if (this.connectionModel.mqttVersion === '5.0' && this.subReceiveRecord.subscriptionIdentifier != undefined) {
        properties = {
          subscriptionIdentifier: this.subReceiveRecord.subscriptionIdentifier,
        }
      }
      this.client.subscribe(this.subReceiveRecord.topic, { qos, nl, rap, rh, properties }, async (error, granted) => {
        this.subLoading = false
        if (error) {
          this.$message.error(error)
          return false
        }
        const successSubscriptions: string[] = []
        granted.forEach((grant) => {
          if ([0, 1, 2].includes(grant.qos)) {
            successSubscriptions.push(grant.topic)
          } else {
            setTimeout(() => {
              console.log(grant.topic + '订阅失败')
            }, 0)
          }
        })
        if (!successSubscriptions.length) {
          return false
        }

        isFinished = true
      })
    }
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    // TODO: maybe we should replace mqtt.js to mqtt-async.js
    await new Promise(async (resolve) => {
      // long pool query base on sleep
      while (!isFinished) {
        await sleep(100)
      }
      resolve(isFinished)
    })
  }

  // 处理接收数据
  private onMessageArrived(client: MqttClient, id: string) {
    this.restoreCircularQueue = new CircularQueue<string>(100)
    const unsubscribe$ = new Subject()

    if (client.listenerCount('close') <= 1) {
      fromEvent(client, 'close').subscribe(() => {
        unsubscribe$.next()
        unsubscribe$.complete()
        this.onClose()
      })
    }

    const messageSubject$ = fromEvent(client, 'message').pipe(takeUntil(unsubscribe$))

    const processMessageSubject$ = messageSubject$.pipe(
      map(([topic, payload, packet]: [string, Buffer, IPublishPacket]) => {
        return this.processReceivedMessage(topic, payload, packet)
      }),
    )

    const filterMessageSubject$ = processMessageSubject$.pipe(
      filter((m: MessageModel) => id === this.curConnectionId && m.topic.includes(this.subReceiveRecord.topic)),
    )

    filterMessageSubject$.pipe(bufferTime(1000)).subscribe((messages: MessageModel[]) => {
      try {
        messages.forEach((message: MessageModel) => {
          if (id === this.curConnectionId && message.payload != undefined) {
            console.log('%c<--：' + message.payload, 'background-color: #409EFF; color: #ffffff;')
            //回复的消息放入环形队列中
            this.restoreCircularQueue.enqueue(message.payload)
          } else {
            this.$log.info(`Connection with ID: ${id} has received a new, unread message`)
          }
        })
      } catch (error) {
        this.$log.error((error as Error).toString())
        return
      }
    })
  }

  /**
   * 响应结果比对
   * @param receivedMessage 实际结果
   * @param expectPayload 预期结果
   */
  private msgCompare(receivedMessage: string, expectPayload: string) {
    // 移除接收到的消息和预期结果中的所有空格
    const trimmedReceivedMessage = receivedMessage.replace(/\s/g, '')
    const trimmedExpectPayload = expectPayload.replace(/\s/g, '')

    // 将通配符 '*' 转换为正则表达式 '.*'
    let regexPattern = trimmedExpectPayload.replace(/\*/g, '.*')

    // 创建正则表达式对象，使用 ^ 和 $ 来确保完全匹配
    let regex = new RegExp('^' + regexPattern + '$')

    // 使用正则表达式进行匹配
    return regex.test(trimmedReceivedMessage)
  }

  /**
   * 切换tab
   * @param tab
   */
  private switchTab(tab: any) {
    this.editableTabsValue = tab.name

    this.currentTabGroup = {
      label: tab.label,
      name: tab.name,
      plan_id: this.currentTabGroup.plan_id,
    }
  }

  /**
   * 发送单个测试用例消息
   * @param caseId
   */
  private async sendSingleCaseMessage(caseId: any) {
    // 串行发送测试用例
    for (let i = 0; i < this.editableTabs.length; i++) {
      let tab = this.editableTabs[i]

      for (let j = 0; j < tab.content.length; j++) {
        let testCase = tab.content[j]
        if (caseId != testCase.id) {
          continue
        }

        await this.sendCaseCore(tab, testCase, j)
      }
    }
    this.stopTestPlan()
  }

  /**
   * 循环发送Case消息
   */
  private async sendCaseMessage() {
    // 串行发送测试用例
    for (let i = 0; i < this.editableTabs.length; i++) {
      let tab = this.editableTabs[i]

      if (this.isStartRunTestPlan) {
        //防止中断后页面切换到了最后一个tab
        this.switchTab(tab)
      }

      for (let j = 0; j < tab.content.length; j++) {
        let testCase = tab.content[j]

        await this.sendCaseCore(tab, testCase, j)
      }
    }
    this.stopTestPlan()
  }

  /**
   * 发送测试消息并且更新table的核心方法
   * @param tab
   * @param testCase
   * @param rowIndex
   */
  private async sendCaseCore(tab: any, testCase: any, rowIndex: any) {
    let gridApi = this.gridApiMap.get(tab.name)
    let currentRetryNum = 0
    while (true) {
      currentRetryNum = 0
      // 如果测试计划已经停止，则退出
      if (!this.isStartRunTestPlan) {
        break
      }

      testCase.result = 'failed'
      if (testCase.name != '' || testCase.sendPayload != '' || testCase.expectPayload != '') {
        while (currentRetryNum <= this.testplan.retry_num) {
          // 发送消息
          this.sendMessage(testCase.id, testCase.sendPayload)
          testCase.retryNum = currentRetryNum

          //更新table状态
          testCase.result = 'send'
          this.refreshGridRow(gridApi, rowIndex)
          // 每100毫秒获取一次数据，最多获取3秒钟
          const startTime = Date.now()
          let receivedMessage
          let timeout = this.testplan.resp_timeout * 1000

          let isSuccess = false
          while (Date.now() - startTime < timeout) {
            receivedMessage = await this.getMessageFromQueue(timeout - (Date.now() - startTime))
            if (receivedMessage !== undefined && this.msgCompare(receivedMessage, testCase.expectPayload)) {
              testCase.result = 'success'
              testCase.responsePayload = receivedMessage
              isSuccess = true
              break
            } else if (receivedMessage !== undefined) {
              console.log('Received unexpected message:', receivedMessage)
            }
          }

          if (isSuccess) {
            break
          } else {
            testCase.result = 'failed'
          }

          currentRetryNum++
        }
      }

      // 刷新表格
      this.refreshGridRow(gridApi, rowIndex)
      //刷新统计报表
      this.report()
      break
    }
  }

  /**
   * 刷新表格的某一个行
   * @param gridApi
   */
  private refreshGridRow(gridApi: any, index: number) {
    if (gridApi && gridApi != undefined) {
      gridApi.refreshCells({ rowNodes: [gridApi.getRowNode(index)] })
    }
  }

  /**
   * 从环形队列获取消息
   * @param timeout 超时时间
   */
  private async getMessageFromQueue(timeout: number): Promise<string | undefined> {
    const interval = 50 // 每50毫秒检查一次
    const maxTries = timeout / interval // 最多尝试次数

    return new Promise((resolve) => {
      let tries = 0
      const intervalId = setInterval(() => {
        const message = this.restoreCircularQueue.dequeue()
        if (message !== undefined) {
          clearInterval(intervalId)
          resolve(message.trim())
        } else if (tries >= maxTries) {
          clearInterval(intervalId)
          resolve(undefined)
        }
        tries++
      }, interval)
    })
  }

  /**
   * 发送消息
   */
  private async sendMessage(caseId: string, content: string): Promise<string | void> {
    console.log('\n%c' + caseId, 'background-color: red; color: #ffffff;')
    console.log('%c-->' + content, 'background-color: #34c388; color: #ffffff;')
    let message: MessageModel = {
      id: uuidv4,
      out: false,
      createAt: time.getNowDate(),
      topic: this.sendTopicName,
      payload: content,
      qos: 0,
      retain: false,
    }

    await this.publishMessage(message, this.testplan.payload_type)
  }

  /**
   * 根据类型，把接收到的数据转换成对应的格式
   * @param topic
   * @param payload
   * @param packet
   */
  private processReceivedMessage(topic: string, payload: Buffer, packet: IPublishPacket) {
    const { qos, retain, properties } = packet
    let receivedPayload
    let receiveType = this.testplan.payload_type
    if (receiveType == 'Plaintext') {
      receivedPayload = payload
    } else if (receiveType === 'Base64') {
      receivedPayload = payload.toString('base64')
    } else if (receiveType === 'Hex') {
      receivedPayload = payload.toString('hex').replace(/(.{4})/g, '$1 ')
    } else if (receiveType === 'JSON') {
      let jsonValue: string | undefined
      try {
        jsonValue = validFormatJson(payload.toString())
      } catch (error) {
        throw error
      }
      if (jsonValue) {
        receivedPayload = jsonValue
      }
    } else if (receiveType === 'CBOR') {
      try {
        receivedPayload = jsonStringify(cbor.decodeFirstSync(payload), null, 2)
      } catch (error) {
        throw error
      }
    }

    if (!receivedPayload) {
      return
    }

    const receivedMessage: MessageModel = {
      id: uuidv4,
      out: false,
      createAt: time.getNowDate(),
      topic,
      payload: receivedPayload.toString(),
      qos,
      retain,
      properties,
    }

    return receivedMessage
  }

  private filterNonNullEntries(properties: any): any {
    return Object.fromEntries(Object.entries(properties).filter(([_, v]) => v != null))
  }

  private processProperties(properties: any) {
    const props = this.filterNonNullEntries(properties)
    if (props.correlationData && typeof props.correlationData === 'string') {
      props.correlationData = Buffer.from(props.correlationData)
    }
    if (props.userProperties) {
      props.userProperties = { ...props.userProperties } // Convert Vue object to JS object
    }
    return props
  }

  /**
   * 发布消息到mqtt
   * @param message
   * @param type
   */
  private async publishMessage(message: MessageModel, type: PayloadType): Promise<void> {
    const { topic, qos, payload, retain, properties } = message

    const props = properties ? this.processProperties(properties) : undefined

    let finalPayload: string | Buffer | undefined = payload

    if (payload) {
      finalPayload = this.convertPublishPayload(type, message.payload)
      if (finalPayload === undefined) return
    }

    this.client.publish!(
      topic,
      finalPayload,
      { qos, retain, properties: props as IClientPublishOptions['properties'] },
      async (error: Error) => {
        if (error) {
          this.handleErrorOnPublish(error)
          return
        }
      },
    )
  }

  /**
   * 根据PayloadType转换待发布的数据类型
   * @param publishType
   * @param publishValue
   */
  private convertPublishPayload = (publishType: PayloadType, publishValue: string) => {
    if (publishType === 'Base64') {
      return Buffer.from(publishValue, 'base64')
    }
    if (publishType === 'Hex') {
      return Buffer.from(publishValue.replaceAll(' ', ''), 'hex')
    }
    if (publishType === 'JSON') {
      try {
        validFormatJson(publishValue.toString())
      } catch (error) {
        const err = error as Error
        let errorMessage = `${this.$t('connections.publishMsg')} ${err.toString()}`
        this.$message.error(errorMessage)
        return undefined
      }
    }
    if (publishType === 'CBOR') {
      try {
        return cbor.encodeOne(JSON.parse(publishValue))
      } catch (error) {
        const err = error as Error
        let errorMessage = `${this.$t('connections.publishMsg')} ${err.toString()}`
        this.$message.error(errorMessage)
        return undefined
      }
    }
    return publishValue
  }

  private handleErrorOnPublish(error: Error) {
    const errorMsg = error.toString()
    this.$message.error(errorMsg)
    this.stopTimedSend()
    this.$log.error(
      `Failed to publish message for ${this.connectionModel.name}. Error: ${errorMsg}. Stack trace: ${error.stack}`,
    )
  }

  /**
   * 导出测试计划
   */
  private exportTestPlan() {
    //导出前清空测试报告信息
    this.clearReport()

    const testPlanData = {
      testplan: this.testplan,
      editableTabs: this.editableTabs,
    }

    //调用系统窗口导出测试计划文件
    ipcRenderer.send('export-test-plan-data', testPlanData, this.testplan.name)
  }

  @Watch('editableTabs', { deep: true })
  onEditableTabsChange() {
    this.report()
  }

  /**
   * tabs的双击可编辑
   **/
  private tabsContent(name: string) {
    this.isEditTabName = true
    this.editTabName = name
  }

  /**
   * 更新tab名称
   */
  private updateTabName() {
    //改动写进数据库
    const { testPlanCaseGroupService } = useServices()
    this.editableTabs.forEach((tab, index) => {
      if (tab.name == this.editTabName) {
        testPlanCaseGroupService.updateName(tab.name, tab.title)
      }
    })

    //退出编辑模式
    this.isEditTabName = false
    this.editTabName = ''
  }

  /**
   * 打开开发者工具
   */
  private openDevTools() {
    ipcRenderer.send('openDevTools')
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
    h2 .title-name {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-right: 12px;
      color: var(--color-text-text);
    }
  }

  .topbar {
    border-bottom: 0px;
    -webkit-app-region: drag;
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

  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .name-container {
    display: flex;
    align-items: center;
  }
  .name {
    font-weight: bold;
  }
  .content {
    margin-top: 10px;
  }
  .footer-card {
    text-align: center;
  }
  .dot-red {
    width: 8px;
    height: 8px;
    background-color: red;
    border-radius: 50%;
    margin-right: 5px;
  }

  .dot-green {
    width: 8px;
    height: 8px;
    background-color: green;
    border-radius: 50%;
    margin-right: 5px;
  }

  .el-input__suffix {
    display: table-cell !important;
    position: relative !important;
    padding-left: 10px;
  }

  .edit-tab-input {
    width: 120px;
  }

  .delete-case-button {
    color: red;
    font-size: 24px;
    cursor: pointer;
  }

  .run-case-button {
    color: var(--color-main-green);
    font-size: 24px;
    cursor: pointer;
    margin-right: 10px;
  }
}
</style>
