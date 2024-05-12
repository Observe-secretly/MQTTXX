<template>
  <div class="testplan-container">
    <div class="testplan-topbar">
      <h1 class="testplan-titlebar">{{ $t('testplan.testPlanTitle') }}</h1>
      <div class="testplan-tailbar">
        <!-- 添加按钮和收起按钮 -->
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
            <el-input
              v-if="data.isEdit"
              ref="newCollectionInput"
              size="small"
              @keyup.enter.native="handleEditCompeleted(node, data)"
              :placeholder="$t('connections.collectionPlaceholder')"
              v-model="data.name"
            ></el-input>
            <!-- connection -->
            <div
              class="testplan-item"
              @click="handleSelectConnection(data)"
              @contextmenu.prevent="handleContextMenu(data, $event)"
            >
              <div class="item-left">
                <div class="client-info">
                  <!-- <el-tooltip
                     :effect="theme !== 'light' ? 'light' : 'dark'"
                     :content="`${data.name}(${data.payload_type})`"
                     :open-delay="500"
                     placement="top"
                   > -->
                  <div :class="['client-name']">
                    {{ data.name }}
                    <el-tag style="float: right; margin-right: 8px">{{ data.payload_type }}</el-tag>
                  </div>
                  <!-- </el-tooltip> -->
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
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import Contextmenu from '@/components/Contextmenu.vue'
import { ipcRenderer } from 'electron'
import { TreeNode, ElTree } from 'element-ui/types/tree'
import { getClientId, getCollectionId } from '@/utils/idGenerator'
import { flushCurSequenceId } from '@/utils/connections'
import { sortConnectionTree } from '@/utils/connections'
import '@/assets/font/iconfont'
import useServices from '@/database/useServices'
import time from '@/utils/time'
import getContextmenuPosition from '@/utils/getContextmenuPosition'

@Component({
  components: {
    Contextmenu,
  },
})
export default class TestPlanList extends Vue {
  @Prop() public showDetail!: <T>(testplan: TestplanModelTree) => T | void
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

  private async handleEditCompeleted(node: TreeNode<'id', CollectionModel>, data: CollectionModel) {
    if (!data) return
    const { collectionService } = useServices()
    if (!this.handleCollectionNameValidate(data.name)) {
      //  await this.handleEditCancel(node, data)
    } else {
      await collectionService.update(data, node.parent?.data.id)
      await this.loadData(false)
    }
    data.isEdit = false
    data.isNewing = false
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

  private async handleDelete() {
    if (this.selectedTestplan != null && this.selectedTestplan.id != null) {
      const id = this.selectedTestplan.id
      const { testPlanService } = useServices()
      try {
        // 直接等待删除操作完成
        await testPlanService.delete(id)
        this.refreshTree()
        this.$notify({
          title: this.$tc('common.deleteSuccess'),
          message: '',
          type: 'success',
          duration: 3000,
          offset: 30,
        })
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
    //TODO 跳转编辑页面
  }

  private mounted() {
    this.loadData(true)
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
