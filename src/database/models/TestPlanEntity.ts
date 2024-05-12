// see https://typeorm.io/#/entities/column-types-for-sqlite--cordova--react-native--expo
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity('TestPlanEntity')
export default class TestPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string

  @Column({ type: 'varchar', name: 'name' })
  name!: string

  @Column({ type: 'varchar', name: 'connection_id' })
  connectionId!: string

  @Column({ type: 'varchar', name: 'protocol_version' })
  protocolVersion!: string

  @Column({
    type: 'varchar',
    name: 'payload_type',
    enum: ['Plaintext', 'Hex', 'Base64', 'JSON', 'CBOR'],
    default: 'Plaintext',
    nullable: true,
  })
  payloadType?: PayloadType

  @Column({ type: 'varchar', name: 'create_persion' })
  createPersion!: string

  @Column({ type: 'integer', name: 'resp_timeout' })
  respTimeout!: number

  @Column({ type: 'integer', name: 'retry_num' })
  retryNum!: number
}
