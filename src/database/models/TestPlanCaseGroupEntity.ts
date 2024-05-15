// see https://typeorm.io/#/entities/column-types-for-sqlite--cordova--react-native--expo
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity('TestPlanCaseGroupEntity')
export default class TestPlanCaseGroupEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string

  @Column({ type: 'varchar', name: 'name' })
  name!: string

  @Column({ type: 'varchar', name: 'plan_id' })
  plan_id!: string
}
