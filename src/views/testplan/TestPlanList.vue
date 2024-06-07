<template>
  <div class="testplan-container">
    <div class="testplan-topbar">
      <h1 class="testplan-titlebar">{{ $t('testplan.testPlanTitle') }}</h1>
      <div class="testplan-tailbar">
        <!-- 添加按钮和收起按钮 -->
        <a href="javascript:;" class="new-button">
          <i class="iconfont el-icon-upload2" @click="importPlan">{{ $t('testplan.import') }}</i>
        </a>
        <a href="javascript:;" class="new-button">
          <i class="iconfont icon-create-new" @click="createPlan"></i>
        </a>
      </div>
    </div>
    <div class="testplan-list">
      <template v-if="!isLoadingData">
        <el-tree
          :indent="4"
          draggable
          ref="tree"
          :data="treeData"
          node-key="id"
          highlight-current
          @node-click="handleNodeExpand"
        >
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <!-- connection -->
            <div
              class="testplan-item"
              @click="handleSelectConnection(data)"
              @contextmenu.prevent="handleContextMenu(data, $event)"
            >
              <div class="item-left">
                <div class="client-info">
                  <div :class="['client-name']">
                    <label>{{ data.name }}</label>
                    <el-tag size="mini" style="float: right; margin-right: 16px">{{ data.payload_type }}</el-tag>
                  </div>
                </div>
              </div>
            </div>
          </span>
        </el-tree>
      </template>
      <template v-else>
        <el-skeleton class="testplan-list-skeleton" :row="8" animated />
      </template>
      <contextmenu :visible.sync="showContextmenu" v-bind="contextmenuConfig">
        <a href="javascript:;" :class="['context-menu__item']" @click="handleEdit">
          <i class="iconfont icon-edit"></i>{{ $t('common.edit') }}
        </a>
        <a href="javascript:;" class="context-menu__item danger" @click="handleDelete">
          <i class="iconfont icon-delete"></i>{{ $t('common.delete') }}
        </a>
      </contextmenu>
    </div>
  </div>
</template>

<script lang="ts">
// import { Table,TableColumn } from 'element-ui';
import 'element-ui/lib/theme-chalk/table.css'
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import Contextmenu from '@/components/Contextmenu.vue'
import { ipcRenderer } from 'electron'
import { TreeNode, ElTree } from 'element-ui/types/tree'
import useServices from '@/database/useServices'
import time from '@/utils/time'
import getContextmenuPosition from '@/utils/getContextmenuPosition'
import { v4 as uuidv4 } from 'uuid'

// Vue.component(Table.name, Table);
// Vue.component(TableColumn.name, TableColumn);

@Component({
  components: {
    Contextmenu,
  },
})
export default class TestPlanList extends Vue {
  @Prop() public showDetail!: <T>(testplan: TestplanModelTree) => T | void
  @Prop() public showEmpty!: <T>(isClear: boolean) => T | void

  @Prop() public createPlan!: <T>() => T | void
  @Prop() public editPlan!: <T>(testplanModel: TestplanModel) => T | void

  @Getter('currentTheme') private theme!: Theme

  private isLoadingData: boolean = false
  private connectionId: string = this.$route.params.id
  private showContextmenu: boolean = false
  private selectedTestplan: TestplanModel | null = null
  private contextmenuConfig: ContextmenuModel = {
    top: 0,
    left: 0,
  }
  private collectionsContextmenuConfig: ContextmenuModel = {
    top: 0,
    left: 0,
  }
  private treeData: TestplanModelTree[] = []

  get isNewWindow() {
    return this.$route.name === 'newWindow'
  }

  private handleNodeExpand(data: TestplanModelTree, node: TreeNode<TestplanModelTree['id'], TestplanModelTree>) {
    this.showDetail(data)
  }

  private expandTreeNodeAncestor(id: string) {}

  private handleSelectConnection(data: TestplanModel) {}

  public async loadData(firstLoad: boolean = false) {
    firstLoad && (this.isLoadingData = true)
    const { testPlanService } = useServices()
    const treeData: TestplanModelTree[] = (await testPlanService.getAll()) ?? []
    this.treeData = treeData

    firstLoad && (this.isLoadingData = false)
    return
  }

  private handleCollectionNameValidate(name: string): boolean {
    return (name ? true : false) && !/(^\s+$)/g.test(name)
  }

  private handleContextMenu(row: TestplanModel, event: MouseEvent) {
    const { x, y } = getContextmenuPosition(event as MouseEvent, 140, 160)
    this.contextmenuConfig.left = x
    this.contextmenuConfig.top = y
    this.showContextmenu = true
    this.selectedTestplan = row
  }

  /**
   * 删除执行计划
   */
  private async handleDelete() {
    if (this.selectedTestplan != null && this.selectedTestplan.id != null) {
      const id = this.selectedTestplan.id
      const { testPlanService } = useServices()
      const { testPlanCaseGroupService } = useServices()
      const { testPlanCaseService } = useServices()
      try {
        // 删除执行计划
        await testPlanService.delete(id)
        // 删除分组
        await testPlanCaseGroupService.deleteByPlanId(id)
        // 删除测试case
        await testPlanCaseService.deleteByPlanId(id)

        this.refreshTree()
        this.$notify({
          title: this.$tc('common.deleteSuccess'),
          message: '',
          type: 'success',
          duration: 3000,
          offset: 30,
        })

        //主页面显示空白页
        this.showEmpty(true)
      } catch (error) {
        this.$notify({
          title: this.$tc('common.deletefailed'),
          message: `${error.toString()}`,
          type: 'error',
          duration: 3000,
          offset: 30,
        })
      }
    }
  }

  public async refreshTree() {
    try {
      // 加载数据
      await this.loadData(false)
      // 关闭上下文菜单
      this.showContextmenu = false
    } catch (error) {
      console.error('Failed to refresh test plan:', error)
    }
  }

  private handleNewWindow() {}

  private handleEdit() {
    const id = this.selectedTestplan?.id
    this.showContextmenu = false
    this.treeData.forEach((item) => {
      if (item.id === id) {
        this.editPlan(item)
      }
    })
  }

  /**
   * 导入测试计划
   */
  private importPlan() {
    ipcRenderer.send('import-test-plan-data')
  }

  // 验证测试计划数据结构是否合法的函数
  private validateStructure(data: any, expected: any) {
    const keys = Object.keys(expected)
    for (const key of keys) {
      if (typeof data[key] !== typeof expected[key]) {
        return false
      }
      if (typeof expected[key] === 'object') {
        const isNestedValid = this.validateStructure(data[key], expected[key])
        if (!isNestedValid) {
          return false
        }
      }
    }
    return true
  }

  private async import(testPlanData: any) {
    //1、验证testPlanData的完整性
    // 内部结构是否和导出的结构一样
    const expectedStructure = {
      testplan: {
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
      },
      editableTabs: [
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
      ],
    }

    //数据有效性校验
    const isValidStructure = this.validateStructure(testPlanData, expectedStructure)
    if (!isValidStructure) {
      this.$notify({
        title: this.$tc('testplan.test_plan_json_invalid'),
        message: '',
        type: 'error',
        duration: 3000,
        offset: 30,
      })
      return
    }
    //2、创建测试计划
    const { testPlanService, testPlanCaseGroupService, testPlanCaseService } = useServices()
    let planId = uuidv4()
    testPlanData.testplan.id = planId
    await testPlanService.create(testPlanData.testplan)

    //3、创建测试组和测试case
    testPlanData.editableTabs.forEach(async (tab: any, index: number) => {
      let groupName = uuidv4()

      await testPlanCaseGroupService.create({
        label: tab.title,
        name: groupName,
        plan_id: planId,
      })

      //循环创建case
      tab.content.forEach(async (caseItem: TestPlanCaseModel, index: number) => {
        //case的id是8位随机数 容易重复。所以重新随机一次
        caseItem.id = uuidv4().substr(0, 8)
        caseItem.group_id = groupName
        caseItem.planId = planId
        await testPlanCaseService.create(caseItem)
      })
    })

    this.loadData(true)
  }

  /**
   * 第一次运行没有数据库表，则自动创建表
   */
  private async initTable() {
    let isReload = false
    const { testPlanService, testPlanCaseGroupService, testPlanCaseService } = useServices()
    let exist = await testPlanService.tableExist()
    if (!exist) {
      await testPlanService.craeteTable()
      isReload = true
    }
    exist = await testPlanCaseGroupService.tableExist()
    if (!exist) {
      await testPlanCaseGroupService.craeteTable()
      isReload = true
    }
    exist = await testPlanCaseService.tableExist()
    if (!exist) {
      await testPlanCaseService.craeteTable()
      isReload = true
    }

    if (isReload) {
      location.reload()
    }
  }

  private mounted() {
    this.initTable()
    this.loadData(true)
    // 监听主进程发送的导入响应消息。拿到json文件后做校验 没问题则导入
    ipcRenderer.on('imported-test-plan-data', (event, testPlanData) => {
      if (testPlanData != null) {
        this.import(testPlanData)
      }
    })
  }
}
</script>

<style lang="scss" scope>
@import '~@/assets/scss/variable.scss';
@import '~@/assets/scss/mixins.scss';
.testplan-container {
  height: 100%;
  width: 100%;
  .testplan-topbar {
    @include flex-space-between;
    min-height: 10px;
    height: 59px;
    -webkit-app-region: drag;
    .new-dropdown {
      &.is-new-window {
        display: none;
      }
    }
    .new-button {
      margin-right: 16px;
      .icon-create-new,
      .icon-hide-testplan {
        font-size: 20px;
        color: var(--color-text-title);
        &:hover {
          color: var(--color-text-title);
        }
      }
    }
    .testplan-titlebar {
      padding: 16px;
    }
    .testplan-tailbar {
      display: flex;
      align-items: center;
    }
  }
  .testplan-list {
    height: calc(100% - 59px);
    overflow-y: hidden;
    &:hover {
      overflow-y: overlay;
    }
    .testplan-list-skeleton {
      margin: 0 16px;
    }
    .el-icon-document-copy {
      font-size: 16px;
    }
    .el-tree {
      height: 100%;
      background-color: var(--color-bg-normal);
      .is-current > .el-tree-node__content {
        background-color: var(--color-bg-item);
      }
      .el-tree-node__content {
        height: 100%;
        margin: 0 8px;
        border-radius: 8px;
        &:hover {
          background-color: var(--color-bg-item);
        }
        .custom-tree-node {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          .testplan-item {
            @include flex-space-between;
            height: 48px;
            width: 100%;
            cursor: pointer;
            position: relative;
            transition: background 0.3s ease;
            user-select: none;
            .item-left {
              width: 100%;
              .client-info {
                display: inline-block;
                margin-left: 8px;
                width: 100%;
                .client-name {
                  display: block;
                  font-size: $font-size--body;
                  font-weight: 500;
                  color: var(--color-text-title);
                  white-space: nowrap;
                  text-overflow: ellipsis;
                  overflow: hidden;
                  &.online {
                    color: var(--color-main-green);
                  }
                }
              }
            }

            .ssl-tag {
              position: absolute;
              right: 0;
              top: 0;
              width: 0;
              height: 0;
              border-top: 36px solid var(--color-main-green);
              border-left: 36px solid transparent;
              div {
                position: absolute;
                top: -32px;
                right: -1px;
                font-size: 12px;
                transform: rotate(45deg);
                color: var(--color-text-active);
              }
            }
            .new-msg-count {
              margin-right: 28px;
              min-width: 18px;
              height: 18px;
              line-height: 18px;
              background: var(--color-bg-unreadmsg);
              border-radius: 9px;
              padding: 0 3px;
              color: var(--color-text-active);
              font-size: $font-size--tips;
              text-align: center;
            }
          }
        }
      }
    }
  }
}
</style>
