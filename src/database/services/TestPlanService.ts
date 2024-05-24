import { Service } from 'typedi'
import _ from 'lodash'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository, MoreThan, LessThan } from 'typeorm'
import TestPlanEntity from '../models/TestPlanEntity'
const Store = require('electron-store')
const electronStore = new Store()

@Service()
export default class TestPlanService {
  constructor(
    // @ts-ignore
    @InjectRepository(TestPlanEntity)
    private testPlanRepository: Repository<TestPlanEntity>,
  ) {}

  public static entityToModel(data: TestPlanEntity): TestplanModel {
    return {
      id: data.id,
      name: data.name,
      connection_id: data.connectionId,
      protocol_version: data.protocolVersion,
      payload_type: data.payloadType,
      create_persion: data.createPersion,
      resp_timeout: data.respTimeout,
      retry_num: data.retryNum,
      send_topic: data.sendTopic,
      receive_topic: data.receiveTopic,
    } as TestplanModel
  }

  public static modelToEntity(data: TestplanModel): TestPlanEntity {
    return {
      id: data.id,
      name: data.name,
      connectionId: data.connection_id,
      protocolVersion: data.protocol_version,
      payloadType: data.payload_type,
      createPersion: data.create_persion,
      respTimeout: data.resp_timeout,
      retryNum: data.retry_num,
      sendTopic: data.send_topic,
      receiveTopic: data.receive_topic,
    } as TestPlanEntity
  }

  public async get(id: string): Promise<TestplanModel | undefined> {
    const entity = await this.testPlanRepository.findOne(id)
    if (entity) {
      return TestPlanService.entityToModel(entity)
    }
    return undefined
  }

  public async getAll() {
    const entities = await this.testPlanRepository.find()
    return entities.map(TestPlanService.entityToModel)
  }

  public async create(data: TestplanModel): Promise<TestplanModel | undefined> {
    const entity = TestPlanService.modelToEntity(data)
    const result = await this.testPlanRepository.save(entity)
    return TestPlanService.entityToModel(result)
  }

  public async delete(id: string): Promise<TestplanModel | undefined> {
    const entity = await this.testPlanRepository.findOne(id)
    if (entity) {
      await this.testPlanRepository.remove(entity)
      return TestPlanService.entityToModel(entity)
    }
    return undefined
  }

  public async update(id: string | undefined, testplan: TestplanModel): Promise<void> {
    if (!id) return
    const query: TestPlanEntity | undefined = await this.testPlanRepository.findOne(id)
    if (!query) {
      return
    }

    query.name = testplan.name
    query.connectionId = testplan.connection_id
    query.protocolVersion = testplan.protocol_version
    query.payloadType = testplan.payload_type
    query.createPersion = testplan.create_persion
    query.respTimeout = testplan.resp_timeout
    query.retryNum = testplan.retry_num
    query.sendTopic = testplan.send_topic
    query.receiveTopic = testplan.receive_topic

    await this.testPlanRepository.save(query)
  }

  /**
   * 查询表是否存在
   * @returns 返回 boolean
   */
  public async tableExist(): Promise<boolean> {
    const hasTable = await this.testPlanRepository.query(`
      SELECT count(*) FROM sqlite_master WHERE type='table' AND name='TestPlanEntity'
    `)

    return hasTable[0]['count(*)'] > 0
  }

  public async craeteTable() {
    this.testPlanRepository.query(`
      CREATE TABLE IF NOT EXISTS "TestPlanEntity" (
          "id" varchar PRIMARY KEY NOT NULL,
          "name" varchar NOT NULL,
          "connection_id" varchar NOT NULL,
          "protocol_version" varchar NOT NULL,
          "payload_type" varchar CHECK(payload_type IN ('Plaintext' , 'Hex' , 'Base64' , 'JSON' , 'CBOR')) NOT NULL DEFAULT ('Plaintext'),
          "create_persion" varchar NOT NULL,
          "resp_timeout" integer NOT NULL,
          "retry_num" integer NOT NULL,
          "send_topic" varchar,
          "receive_topic" varchar
      )
  `)
  }
}
