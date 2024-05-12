<template>
  <div
    class="testplan-form right-content card-form"
    :style="{
      marginLeft: leftValue,
    }"
  >
    <div
      class="right-topbar topbar"
      :style="{
        left: leftValue,
      }"
    >
      <div class="header">
        <a href="javascript:;" @click="handleBack(false)">
          <i class="el-icon-arrow-left"></i>{{ $t('common.back') }}
        </a>
      </div>
      <div class="body">
        <h2>{{ oper === 'create' ? $t('common.new') : $t('common.edit') }}</h2>
      </div>
      <div class="tail">
        <a href="javascript:;" @click="handleSave('connect')">
          {{ $t('common.save') }}
        </a>
      </div>
    </div>

    <el-form ref="form" label-position="right" label-width="160px" :model="record" :rules="rules">
      <!-- 基础信息 -->
      <div class="client-create__body">
        <div class="info-header">
          <h3>{{ $t('testplan.general') }}</h3>
        </div>
        <el-card shadow="never" class="info-body item-card">
          <el-row :gutter="10">
            <!-- 第一行 -->
            <el-col :span="22">
              <el-form-item label-width="93px" :label="$t('testplan.name')" prop="name">
                <el-input size="mini" v-model="record.name"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2">
              <el-tooltip
                placement="top"
                :effect="theme !== 'light' ? 'light' : 'dark'"
                :open-delay="500"
                :offset="80"
                :content="$t('testplan.nameTip')"
              >
                <a href="javascript:;" class="icon-oper">
                  <i class="el-icon-warning-outline"></i>
                </a>
              </el-tooltip>
            </el-col>
            <!-- 第二行 -->
            <el-col :span="22">
              <el-form-item label-width="93px" :label="$t('testplan.select_connect')" prop="select_connect">
                <el-select size="small" v-model="record.select_connect">
                  <el-option
                    v-for="item in connections"
                    :key="item.id"
                    :value="item.name + '@' + item.host + ':' + item.port + '(' + item.id + ')'"
                  >
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="2">
              <el-button type="danger" size="mini">{{ $t('testplan.test_connect') }}</el-button>
            </el-col>
            <!-- 第三行 -->
            <el-col :span="22">
              <el-form-item label-width="93px" :label="$t('testplan.protocol_version')" prop="protocol_version">
                <el-input size="mini" v-model="record.protocol_version"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2">
              <el-tooltip
                placement="top"
                :effect="theme !== 'light' ? 'light' : 'dark'"
                :open-delay="500"
                :offset="80"
                :content="$t('testplan.protocol_v_tip')"
              >
                <a href="javascript:;" class="icon-oper">
                  <i class="el-icon-warning-outline"></i>
                </a>
              </el-tooltip>
            </el-col>
            <!-- 第四行 -->
            <el-col :span="22">
              <el-form-item label-width="93px" :label="$t('testplan.create_persion')" prop="create_persion">
                <el-input size="mini" v-model="record.create_persion"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2"> </el-col>
            <!-- 第五行 -->
            <el-col :span="22">
              <el-form-item label-width="93px" :label="$t('testplan.payload_type')" prop="payload_type">
                <el-select size="small" v-model="record.payload_type">
                  <el-option
                    v-for="(format, index) in ['Plaintext', 'JSON', 'Base64', 'Hex', 'CBOR']"
                    :key="index"
                    :value="format"
                  >
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="2"> </el-col>
          </el-row>
        </el-card>
      </div>

      <!-- 高级信息 -->
      <div class="client-create__body">
        <div class="info-header">
          <h3>{{ $t('testplan.advanced') }}</h3>
        </div>
        <el-card shadow="never" class="info-body item-card">
          <el-row :gutter="10">
            <!-- 第一行 -->
            <el-col :span="22">
              <el-form-item label-width="93px" :label="$t('testplan.resp_timeout')" prop="name">
                <el-input-number
                  size="mini"
                  type="number"
                  :min="0"
                  :max="65535"
                  controls-position="right"
                  v-model="record.resp_timeout"
                >
                </el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="2">
              <el-tooltip
                placement="top"
                :effect="theme !== 'light' ? 'light' : 'dark'"
                :open-delay="500"
                :offset="80"
                :content="$t('testplan.resp_timeout_tip')"
              >
                <a href="javascript:;" class="icon-oper">
                  <i class="el-icon-warning-outline"></i>
                </a>
              </el-tooltip>
            </el-col>
            <!-- 第二行 -->
            <el-col :span="22">
              <el-form-item label-width="93px" :label="$t('testplan.retry_num')" prop="name">
                <el-input-number
                  size="mini"
                  type="number"
                  :min="0"
                  :max="65535"
                  controls-position="right"
                  v-model="record.retry_num"
                >
                </el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="2">
              <el-tooltip
                placement="top"
                :effect="theme !== 'light' ? 'light' : 'dark'"
                :open-delay="500"
                :offset="80"
                :content="$t('testplan.retry_num_tip')"
              >
                <a href="javascript:;" class="icon-oper">
                  <i class="el-icon-warning-outline"></i>
                </a>
              </el-tooltip>
            </el-col>
          </el-row>
        </el-card>
      </div>
    </el-form>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import _ from 'lodash'
import { Getter } from 'vuex-class'
import useServices from '@/database/useServices'
import { LeftValues } from '@/utils/styles'
import { getDefaultRecord } from '@/utils/testplanUtils'
import { v4 as uuidv4 } from 'uuid'

@Component
export default class TestPlanForm extends Vue {
  @Getter('currentTheme') private theme!: Theme

  @Prop({ required: true }) public oper!: 'edit' | 'create' | undefined
  @Prop() public handleBack!: <T>(isReload: boolean) => T | void

  get leftValue(): string {
    return LeftValues.Show
  }

  private defaultRecord: TestplanModel = getDefaultRecord()
  private record: TestplanModel = _.cloneDeep(this.defaultRecord)
  private connections: ConnectionModel[] = []

  get rules() {
    return {
      name: [{ required: true, message: this.$t('common.inputRequired') }],
      payload_type: [{ required: true, message: this.$t('common.inputRequired') }],
      resp_timeout: [{ required: true, message: this.$t('common.inputRequired') }],
      retry_num: [{ required: true, message: this.$t('common.inputRequired') }],
      select_connect: [{ required: true, message: this.$t('common.inputRequired') }],
    }
  }

  private async handleSave(type: string) {
    const { testPlanService } = useServices()
    const data = { ...this.record }
    let res: TestplanModel | undefined = undefined
    if (this.oper === 'create') {
      data.id = uuidv4()
      try {
        res = await testPlanService.create(data)
        this.$log.info(`Created testPlan for the : ${res?.name}, ID: ${res?.id}`)
        this.handleBack(true)
        this.$notify({
          title: this.$tc('common.createSuccess'),
          message: '',
          type: 'success',
          duration: 3000,
          offset: 30,
        })
      } catch (error) {
        this.$notify({
          title: this.$tc('common.createfailed'),
          message: `${error.toString()}`,
          type: 'error',
          duration: 3000,
          offset: 30,
        })
      }
    }
  }

  private async loadConnections() {
    const { connectionService } = useServices()
    const connections: ConnectionModel[] = (await connectionService.getAll()) ?? []
    if (connections != null && connections.length > 0) {
      this.connections = connections
    }
  }

  private mounted() {
    this.loadConnections()
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/mixins.scss';

.testplan-form {
  padding: 0 16px;
  .topbar {
    -webkit-app-region: drag;
    .tail {
      a {
        padding: 0 12px;
      }
      .connect-btn {
        border-right: 1px solid var(--color-border-default);
      }
    }
  }
  .el-form {
    padding-top: 80px;
    padding-bottom: 40px;
    // normal icon operation style
    .icon-oper {
      color: var(--color-text-default);
      line-height: 43px;
      transition: 0.2s color ease;
      &:hover {
        color: var(--color-main-green);
      }
    }
    .unit {
      color: var(--color-text-default);
      line-height: 43px;
      font-size: 12px;
    }
    // icon style without fake class such as `:hover` style
    .icon-oper-pure {
      color: var(--color-text-default);
      line-height: 43px;
      transition: 0.2s color ease;
    }
    // icon active
    .icon-oper-active {
      color: var(--color-main-green);
    }
    .el-form-item__error {
      top: 80%;
    }
    .host-item {
      .el-col-6 {
        padding-left: 0px !important;
      }
      .el-col-18 {
        padding-right: 0px !important;
      }
    }
    .last-will-payload {
      height: 235px;
      border: 1px solid var(--color-border-default);
      padding: 10px 1px 1px 1px;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
    }
    .content-type-item {
      margin-top: 8px;
    }
    .key-value-editor {
      padding-left: 12px;
    }
    @include editor-lang-type;
  }
  .info-header {
    a.collapse-btn {
      color: var(--color-text-light);
      font-size: 1rem;
      position: relative;
      top: 1px;
    }
    @include collapse-btn-transform(0deg, 180deg);
  }
  .item-secure {
    .el-form-item__content {
      display: flex;
      align-items: center;
      .tooltip-secure {
        margin-left: 10px;
      }
    }
  }
}
</style>
