<template>
  <div
    class="empty-page right-content"
    :style="{
      marginLeft: leftValue,
    }"
  >
    <div class="empty-page__block">
      <div>
        <img :src="imageSrc" alt="new connection" />
      </div>
      <el-button class="primary-btn" icon="el-icon-plus" @click="clickMethod(false)">
        {{ btnTitle }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import gaCustomLinks from '@/utils/gaCustomLinks'
import { LeftValues } from '@/utils/styles'

@Component
export default class TestPlanEmptyPage extends Vue {
  @Prop({ required: true }) public btnTitle!: 'connections'
  @Prop({ required: true }) public name!: string
  @Prop() public clickMethod!: <T>() => T | void

  @Getter('currentLang') private getterLang!: Language
  @Getter('showConnectionList') private showConnectionList!: boolean

  get imageSrc(): string {
    return require(`../assets/images/${this.name}`)
  }

  get emqxCloudWebsite(): string {
    return gaCustomLinks(this.getterLang).empty.EMQXCloud
  }

  get emqxWebsite(): string {
    return gaCustomLinks(this.getterLang).empty.EMQX
  }

  get leftValue(): string {
    return this.showConnectionList ? LeftValues.Show : LeftValues.Hide
  }
}
</script>

<style lang="scss" scoped>
.empty-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;

  .empty-page__block {
    .primary-btn {
      background: linear-gradient(134deg, #37dc85 0%, #35ca8d 100%);
      color: var(--color-text-active);
      border: 1px solid #37dc85;
    }
    img {
      margin-bottom: 20px;
    }
    text-align: center;
    p {
      margin: 24px auto;
      max-width: 650px;
    }
  }
}
</style>
