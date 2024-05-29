<template>
  <div class="testplan">
    <transition name="slide">
      <div class="left-list">
        <TestPlanList
          ref="testplanListRef"
          :create-plan="toCreatePlan"
          :edit-plan="toEditPlan"
          :show-detail="showDetail"
          :show-empty="showEmpty"
        />
      </div>
    </transition>
    <div class="testplan-view">
      <TestPlanEmptyPage
        v-show="isEmpty"
        name="connections.svg"
        :btn-title="$t('testplan.butCreatePlanTitle')"
        :click-method="toCreatePlan"
      />

      <TestPlanDetail v-show="isShowDetail" ref="testplanDetailRef" />

      <TestPlanForm v-show="isCreatePlan" ref="testplanFormRef" :oper="oper" :handle-back="formHandleBack" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import TestPlanEmptyPage from '@/components/TestPlanEmptyPage.vue'
import TestPlanList from './TestPlanList.vue'
import TestPlanDetail from './TestPlanDetail.vue'
import TestPlanForm from './TestPlanForm.vue'
import useServices from '@/database/useServices'

@Component({
  components: {
    TestPlanList,
    TestPlanDetail,
    TestPlanForm,
    TestPlanEmptyPage,
  },
})
export default class TestPlan extends Vue {
  private isEmpty: boolean = true
  private isShowDetail: boolean = false
  private isCreatePlan: boolean = false
  private oper: 'edit' | 'create' | undefined = 'create'

  private currentTestplan: TestplanModelTree | null = null

  /**
   * 创建测试计划页面的新建按钮点击事件
   */
  private toCreatePlan() {
    this.isEmpty = false
    this.isCreatePlan = true
    this.isShowDetail = false
  }

  /**
   * 编辑测试计划
   * @param testplanModel
   */
  private toEditPlan(testplanModel: TestplanModel) {
    this.isEmpty = false
    this.isCreatePlan = true
    this.isShowDetail = false

    if (this.$refs.testplanFormRef) {
      const testplanForm = this.$refs.testplanFormRef as TestPlanForm
      testplanForm.loadData(testplanModel)
    }
  }
  /**
   * 创建/修改表单页面返回
   */
  private formHandleBack(isReload: boolean) {
    this.isCreatePlan = false
    if (this.$refs.testplanListRef) {
      const testplanList = this.$refs.testplanListRef as TestPlanList
      testplanList.refreshTree()
    }

    //如果选择了测试计划则展示详情，否则展示empty页面
    if (this.currentTestplan != null) {
      this.showDetail(this.currentTestplan)
      //TODO 重新让Tree默认选中的逻辑
    } else {
      this.isEmpty = true
    }
  }

  /**
   * 展示测试计划详情
   * @param testplanId  测试计划ID
   */
  private showDetail(testplan: TestplanModelTree) {
    this.currentTestplan = testplan
    this.isEmpty = false
    this.isShowDetail = true
    if (this.$refs.testplanDetailRef) {
      const testplanDetail = this.$refs.testplanDetailRef as TestPlanDetail
      testplanDetail.loadData(testplan)
    }
  }

  /**
   * 现实空白页面
   */
  private showEmpty(isClear: boolean) {
    this.isEmpty = true
    this.isShowDetail = false
    this.isCreatePlan = false
    if (isClear) {
      this.currentTestplan = null
    }
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/testplan.scss';
</style>
