<template>
  <div class="testplan">
    <transition name="slide">
      <div class="left-list">
        <TestPlanList ref="testplanListRef" :show-detail="showDetail" />
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

      <TestPlanForm v-show="isCreatePlan" :oper="oper" :handle-back="formHandleBack" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import TestPlanEmptyPage from '@/components/TestPlanEmptyPage.vue'
import TestPlanList from './TestPlanList.vue'
import TestPlanDetail from './TestPlanDetail.vue'
import TestPlanForm from './TestPlanForm.vue'

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

  /**
   * 创建测试计划页面的新建按钮点击事件
   */
  private toCreatePlan() {
    this.isEmpty = false
    this.isCreatePlan = true
  }

  /**
   * 创建/修改表单页面返回
   */
  private formHandleBack(isReload: boolean) {
    this.isEmpty = true
    this.isCreatePlan = false
    if (this.$refs.testplanListRef) {
      const testplanList = this.$refs.testplanListRef as TestPlanList
      testplanList.refreshTree()
    }
  }

  /**
   * 展示测试计划详情
   * @param testplanId  测试计划ID
   */
  private showDetail(testplan: TestplanModelTree) {
    this.isEmpty = false
    this.isShowDetail = true
    if (this.$refs.testplanDetailRef) {
      const testplanDetail = this.$refs.testplanDetailRef as TestPlanDetail
      testplanDetail.loadData(testplan)
    }
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/testplan.scss';
</style>
