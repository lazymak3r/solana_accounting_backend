import { Injectable } from '@nestjs/common'
import { Neo4jService } from '@nhogs/nestjs-neo4j'
import { IUserProperties } from '../user'
import { Task } from './entity/task.entity'

@Injectable()
export class TaskService {
  constructor(
    private readonly neo4jService: Neo4jService,
  ) { }

  /**
   *  Fetch tasks and return progress
   */
  async getProgress(user: IUserProperties) {
    const session = this.neo4jService.getSession()
    try {
      const req = `MATCH (u: user { id: "${user.id}" })-[:HAS_ACCOUNT]->(a: account)-[:HAS_TASK]->(t) RETURN t`
      const data = await session.run(req)
      if (!data.records.length) {
        return 0
      }
      return data.records.reduce((pv, cv) => {
        const task = new Task(cv.get('t')).toJson()
        return pv + task.amount - task.progress
      }, 0)
    } finally {
      await session.close()
    }
  }
}
