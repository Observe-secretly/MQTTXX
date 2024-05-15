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
      label: data.id,
      name: data.name,
      plan_id: data.plan_id,
    } as TestPlanCaseGroupModel
  }

  public static modelToEntity(data: TestPlanCaseGroupModel): TestPlanCaseGroupEntity {
    return {
      id: data.label,
      name: data.name,
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
}
