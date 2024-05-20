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
              <el-col :span="24">
                <el-button icon="el-icon-upload" type="primary" size="mini" @click="savePlanDetail">
                  {{ $t('common.save') }}
                </el-button>
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
            >
              <template slot="prepend">{{ $t('testplan.send_topic') }}</template>
            </el-input>

            <el-input
              size="mini"
              :disabled="isStartRunTestPlan"
              placeholder="Topic Name"
              v-model="subReceiveRecord.topic"
            >
              <template slot="prepend">{{ $t('testplan.subscribe_topic') }}</template>
              <template slot="suffix">
                <el-button type="text" size="mini">高级</el-button>
              </template>
            </el-input>
          </el-col>
          <el-col :span="12">
            <el-row>
              <el-col :span="8" class="container">
                <div class="name-container">
                  <div class="dot"></div>
                  <div class="name">{{ $t('testplan.case_count') }}</div>
                </div>
                <div class="content">{{ caseCount }}</div>
              </el-col>
              <el-col :span="8" class="container">
                <div class="name-container">
                  <div class="dot-red"></div>
                  <div class="name">{{ $t('testplan.failed_case_count') }}</div>
                </div>
                <div class="content">{{ failedCaseCount }}</div>
              </el-col>
              <el-col :span="8" class="container">
                <div class="name-container">
                  <div class="dot-green"></div>
                  <div class="name">{{ $t('testplan.successed_case_count') }}</div>
                </div>
                <div class="content">{{ successedCaseCount }}</div>
              </el-col>
            </el-row>
          </el-col>
          <el-col :span="4">
            <!-- 运行测试计划 -->
            <el-button v-if="!isStartRunTestPlan" type="primary" icon="el-icon-caret-right" @click="runTestPlan">
              {{ $t('testplan.run_testplan') }}</el-button
            >
            <!-- 停止测试计划 -->
            <el-button v-if="isStartRunTestPlan" type="danger" icon="el-icon-loading" @click="stopTestPlan">
              {{ $t('testplan.stop_testplan') }}</el-button
            >
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

import { MqttClient, IConnackPacket, IPublishPacket, IClientPublishOptions, IDisconnectPacket, Packet } from 'mqtt'
import { createClient } from '@/utils/mqttUtils'
import getErrorReason from '@/utils/mqttErrorReason'
import { Subject, fromEvent } from 'rxjs'
import { bufferTime, map, filter, takeUntil } from 'rxjs/operators'
import cbor from 'cbor'
import time from '@/utils/time'
import validFormatJson from '@/utils/validFormatJson'
import { jsonStringify } from '@/utils/jsonUtils'

@Component({
  components: {
    AgGridVue,
  },
})
export default class TestPlanDetail extends Vue {
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

  private subReceiveRecord: SubscriptionModel = {
    id: '',
    topic: 'limin/receive',
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

  private connectionModel!: ConnectionModel
  private connectLoading = false
  private disconnectLoding = false
  private reTryConnectTimes = 0
  private curConnectionId!: string | undefined
  private sendFrequency: number | undefined = undefined
  private sendTimeId: number | null = null
  private sendTimedMessageCount = 0
  private maxReconnectTimes!: number

  private sendTopicName: string = 'limin/send'
  private caseCount: number = 0
  private failedCaseCount: number = 0
  private successedCaseCount: number = 0

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

  private isStartRunTestPlan: boolean = false

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
    } else if (action === 'remove') {
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

  /**
   * 运行测试计划
   */
  private async runTestPlan() {
    if (this.isStartRunTestPlan) {
      return
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

      //清理测试报告

      //切换状态
      this.isStartRunTestPlan = true
    } else {
      console.log('连接失败')
      return
    }
    //3、循环发送所有case。等待响应
    //4、对比预期结果（中途收到预期外的结果不予理会）
    //5、渲染报告和列表
  }

  /**
   * 停止测试计划
   */
  private stopTestPlan() {
    if (this.isStartRunTestPlan) {
      //断开mqtt连接
      this.disconnect()

      //切换状态
      this.isStartRunTestPlan = false
    }
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

      // this.changeActiveConnection({
      //   id: this.curConnectionId,
      //   client: this.client,
      // })
      this.$notify({
        title: this.$tc('connections.disconnected'),
        message: '',
        type: 'success',
        duration: 3000,
        offset: 30,
      })
      // if (!this.showClientInfo) {
      //   this.setShowClientInfo(true)
      // }
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
    // this.notifyMsgWithCopilot(
    //   this.$t('connections.onDisconnect', { reason, reasonCode }) as string,
    //   JSON.stringify(packet),
    //   () => {},
    //   'warning',
    // )
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
        return content.result == 'successed'
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
            console.log(grant.topic + '<==================================订阅成功')
          } else {
            setTimeout(() => {
              // this.handleSubError(grant.topic, grant.qos)
              console.log(grant.topic + '<==================================订阅失败')
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
            console.log(message.payload)

            //收到一个消息后回复一个消息TODO
            this.sendMessage(message.payload)
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
   * 发送消息
   */
  private async sendMessage(content: string): Promise<string | void> {
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

  @Watch('editableTabs', { deep: true })
  onEditableTabsChange() {
    this.report()
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
}
</style>
