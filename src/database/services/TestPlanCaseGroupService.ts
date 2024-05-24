import { Service } from 'typedi'
import _ from 'lodash'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository, MoreThan, LessThan } from 'typeorm'
import TestPlanCaseGroupEntity from '../models/TestPlanCaseGroupEntity'
const Store = require('electron-store')

@Service()
export default class TestPlanCaseGroupService {
  constructor(
    // @ts-ignore
    @InjectRepository(TestPlanCaseGroupEntity)
    private testPlanCaseGroupEntity: Repository<TestPlanCaseGroupEntity>,
  ) {}

  public static entityToModel(data: TestPlanCaseGroupEntity): TestPlanCaseGroupModel {
    return {
      name: data.id,
      label: data.name,
      plan_id: data.plan_id,
    } as TestPlanCaseGroupModel
  }

  public static modelToEntity(data: TestPlanCaseGroupModel): TestPlanCaseGroupEntity {
    return {
      id: data.name,
      name: data.label,
      plan_id: data.plan_id,
    } as TestPlanCaseGroupEntity
  }

  public async get(id: string): Promise<TestPlanCaseGroupModel | undefined> {
    const entity = await this.testPlanCaseGroupEntity.findOne(id)
    if (entity) {
      return TestPlanCaseGroupService.entityToModel(entity)
    }
    return undefined
  }

  public async getByPlanId(planId: string): Promise<TestPlanCaseGroupModel[]> {
    const entities = await this.testPlanCaseGroupEntity.find({ where: { plan_id: planId } })
    return entities.map(TestPlanCaseGroupService.entityToModel)
  }

  public async getAll() {
    const entities = await this.testPlanCaseGroupEntity.find()
    return entities.map(TestPlanCaseGroupService.entityToModel)
  }

  public async create(data: TestPlanCaseGroupModel): Promise<TestPlanCaseGroupModel | undefined> {
    const entity = TestPlanCaseGroupService.modelToEntity(data)
    const result = await this.testPlanCaseGroupEntity.save(entity)
    return TestPlanCaseGroupService.entityToModel(result)
  }

  public async delete(id: string): Promise<TestPlanCaseGroupModel | undefined> {
    const entity = await this.testPlanCaseGroupEntity.findOne(id)
    if (entity) {
      await this.testPlanCaseGroupEntity.remove(entity)
      return TestPlanCaseGroupService.entityToModel(entity)
    }
    return undefined
  }

  public async deleteByPlanId(planId: string): Promise<void> {
    await this.testPlanCaseGroupEntity.delete({ plan_id: planId })
  }

  public async updateName(id: string | undefined, name: string): Promise<void> {
    if (!id) return
    const query: TestPlanCaseGroupEntity | undefined = await this.testPlanCaseGroupEntity.findOne(id)
    if (!query) {
      return
    }
    query.name = name
    await this.testPlanCaseGroupEntity.save(query)
  }

  /**
   * 查询表是否存在
   * @returns 返回 boolean
   */
  public async tableExist(): Promise<boolean> {
    const hasTable = await this.testPlanCaseGroupEntity.query(`
      SELECT count(*) FROM sqlite_master WHERE type='table' AND name='TestPlanCaseGroupEntity'
    `)
    return hasTable[0]['count(*)'] > 0
  }

  public async craeteTable() {
    this.testPlanCaseGroupEntity.query(`
      CREATE TABLE IF NOT EXISTS "TestPlanCaseGroupEntity" (
          "id" varchar PRIMARY KEY NOT NULL,
          "name" varchar NOT NULL,
          "plan_id" varchar NOT NULL
      )
  `)
  }
}
