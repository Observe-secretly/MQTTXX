// see https://typeorm.io/#/entities/column-types-for-sqlite--cordova--react-native--expo
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity('TestPlanCaseEntity')
export default class TestPlanCaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string

  @Column({ type: 'varchar', name: 'group_id' })
  group_id!: string

  @Column({ type: 'varchar', name: 'plan_id' })
  plan_id!: string

  @Column({ type: 'varchar', name: 'name' })
  name!: string

  @Column({ type: 'varchar', name: 'send_payload' })
  send_payload!: string

  @Column({ type: 'varchar', name: 'expect_payload' })
  expect_payload!: string
}
