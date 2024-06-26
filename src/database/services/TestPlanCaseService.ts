import { Service } from 'typedi'
import _ from 'lodash'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository, MoreThan, LessThan } from 'typeorm'
import TestPlanCaseEntity from '../models/TestPlanCaseEntity'
const Store = require('electron-store')

@Service()
export default class TestPlanCaseService {
  constructor(
    // @ts-ignore
    @InjectRepository(TestPlanCaseEntity)
    private testPlanCaseEntity: Repository<TestPlanCaseEntity>,
  ) {}

  public static entityToModel(data: TestPlanCaseEntity): TestPlanCaseModel {
    return {
      id: data.id,
      group_id: data.group_id,
      planId: data.plan_id,
      name: data.name,
      sendPayload: data.send_payload,
      expectPayload: data.expect_payload,
    } as TestPlanCaseModel
  }

  public static modelToEntity(data: TestPlanCaseModel): TestPlanCaseEntity {
    return {
      id: data.id,
      group_id: data.group_id,
      plan_id: data.planId,
      name: data.name,
      send_payload: data.sendPayload,
      expect_payload: data.expectPayload,
    } as TestPlanCaseEntity
  }

  public async get(id: string): Promise<TestPlanCaseModel | undefined> {
    const entity = await this.testPlanCaseEntity.findOne(id)
    if (entity) {
      return TestPlanCaseService.entityToModel(entity)
    }
    return undefined
  }

  public async getByGroupId(groupId: string): Promise<TestPlanCaseModel[]> {
    const entities = await this.testPlanCaseEntity.find({ where: { group_id: groupId } })
    return entities.map(TestPlanCaseService.entityToModel)
  }

  public async getAll() {
    const entities = await this.testPlanCaseEntity.find()
    return entities.map(TestPlanCaseService.entityToModel)
  }

  public async create(data: TestPlanCaseModel): Promise<TestPlanCaseModel | undefined> {
    const entity = TestPlanCaseService.modelToEntity(data)
    const result = await this.testPlanCaseEntity.save(entity)
    return TestPlanCaseService.entityToModel(result)
  }

  public async delete(id: string): Promise<TestPlanCaseModel | undefined> {
    const entity = await this.testPlanCaseEntity.findOne(id)
    if (entity) {
      await this.testPlanCaseEntity.remove(entity)
      return TestPlanCaseService.entityToModel(entity)
    }
    return undefined
  }

  public async deleteByGroupId(groupId: string): Promise<void> {
    await this.testPlanCaseEntity.delete({ group_id: groupId })
  }

  public async deleteByPlanId(planId: string): Promise<void> {
    await this.testPlanCaseEntity.delete({ plan_id: planId })
  }

  public async update(id: string | undefined, testCase: TestPlanCaseModel): Promise<void> {
    if (!id) return
    const query: TestPlanCaseEntity | undefined = await this.testPlanCaseEntity.findOne(id)
    if (!query) {
      return
    }

    query.group_id = testCase.group_id
    query.name = testCase.name
    query.send_payload = testCase.sendPayload
    query.expect_payload = testCase.expectPayload

    await this.testPlanCaseEntity.save(query)
  }

  /**
   * 查询表是否存在
   * @returns 返回 boolean
   */
  public async tableExist(): Promise<boolean> {
    const hasTable = await this.testPlanCaseEntity.query(`
      SELECT count(*) FROM sqlite_master WHERE type='table' AND name='TestPlanCaseEntity'
    `)
    return hasTable[0]['count(*)'] > 0
  }

  public async craeteTable() {
    this.testPlanCaseEntity.query(`
      CREATE TABLE IF NOT EXISTS "TestPlanCaseEntity" (
          "id" varchar PRIMARY KEY NOT NULL,
          "group_id" varchar NOT NULL,
          "plan_id" varchar NOT NULL,
          "name" varchar,
          "send_payload" varchar,
          "expect_payload" varchar
      )
  `)
  }
}
