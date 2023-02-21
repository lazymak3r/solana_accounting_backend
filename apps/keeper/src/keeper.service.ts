import { Injectable, Logger } from '@nestjs/common'
import { KafkaContext } from '@nestjs/microservices'
import { Neo4jService } from '@nhogs/nestjs-neo4j'

const QUERY_SEPARATOR = ';'

@Injectable()
export class KeeperService {
  private readonly logger = new Logger(this.constructor.name)

  constructor(
    private readonly neo4jService: Neo4jService,
  ) {}

  /**
   * Save any cypher data
   */
  async processQuery(payload: string, context: KafkaContext) {
    const queries = payload.split(QUERY_SEPARATOR)
    const { key, headers } = context.getArgs()[0]

    const taskId = +key + 1
    const totalTasks = headers.length

    const session = this.neo4jService.getSession({ write: true })
    try {
      this.logger.debug(`Task start: [${taskId}/${totalTasks}]`)
      for (const query of queries) {
        await session.run(query)
      }

      this.logger.debug(`Task finished: [${taskId}/${totalTasks}]`)
    } catch (e) {
      this.logger.debug(`Task error: [${taskId}/${totalTasks}]`)
      this.logger.error(e)
    } finally {
      session.close().then()
      this.logger.debug('Done')
    }
  }
}
