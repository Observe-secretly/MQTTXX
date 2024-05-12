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
}
