import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ClientKafka, KafkaContext } from '@nestjs/microservices'
import { Producer } from '@nestjs/microservices/external/kafka.interface'
import { ProcessSignatureDto, Web3Service } from '@lib/core'
import { TransactionService } from 'main/main'
import { Neo4jService } from '@nhogs/nestjs-neo4j'
import { KAFKA_KEEPER_SERVICE_NAME } from './constants'

@Injectable()
export class CollectorService implements OnModuleInit {
  private readonly logger = new Logger(this.constructor.name)

  private keeperProducer: Producer

  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly solanaService: Web3Service,
    private readonly transactionService: TransactionService,
    @Inject(KAFKA_KEEPER_SERVICE_NAME) private readonly keeperService: ClientKafka,
  ) {
  }

  async onModuleInit() {
    this.keeperProducer = await this.keeperService.connect()
  }

  /**
   * Fetch transaction, transactions status
   * save transaction with status and relation to account
   */
  async processSignature(data: ProcessSignatureDto, context: KafkaContext) {
    const { signature } = data.signature
    const { address } = data.account
    const { taskId, userId } = data
    const [msg] = context.getArgs()

    const currentTaskLength = msg.headers.length
    const currentTaskKey = msg.key

    console.log(`Task start: [${+currentTaskKey + 1}/${currentTaskLength}]`)

    try {
      const queries: string[] = []
      const session = this.neo4jService.getSession()
      const result = await session.run(`
      MATCH (user: user {id: "${userId}"})-[:HAS_ACCOUNT]->(account: account {address: "${address}"})
      MATCH (account)-[:HAS_TASK]->(task:task)
      MATCH (transaction: transaction {signature: "${signature}"})-[:HAS_TASK]->(task)
      RETURN transaction
      `)

      if (result.records.length) {
        this.logger.error('Transaction already exist')
      } else {
        let addTransactionQuery = ''
        const transactionQuery = await this.transactionService.getStoreTransactionQuery(signature)
        if (!transactionQuery) {
          this.logger.log('Invalid transaction type [should be Transfer]')
        } else {
          addTransactionQuery = `MATCH (task: task {id: "${taskId}"})`
          addTransactionQuery += transactionQuery
          addTransactionQuery += `
        MERGE (t)-[:HAS_TASK]->(task)
        RETURN t
      `
          queries.push(addTransactionQuery)

          const incrementTaskCount = `
          MATCH (user: user {id: "${userId}"})-[:HAS_ACCOUNT]->(account: account {address: "${address}"})
          MATCH (account)-[:HAS_TASK]->(task:task {id: "${taskId}"})
          SET task.transferCount = task.transferCount + 1
          RETURN task
          `

          queries.push(incrementTaskCount)
        }
      }

      const incrementTask = `
      MATCH (task { id: "${taskId}" })
      SET task.progress = task.progress + 1
      RETURN task
      `

      queries.push(incrementTask)

      const now = new Date().getTime()
      const endOfTask = `
      MATCH (task: task {id: "${taskId}"})<-[:HAS_TASK]-(account: account)
      CALL apoc.do.when(task.amount=task.progress,
        'MATCH (user: user {id: "${userId}"})
        SET account.taskUpdatedAt = "${now}"
        SET user.lastSyncTimestamp = "${now}"',
        '',
        {account:account}
      )
      YIELD value
      RETURN account,task
      `

      queries.push(endOfTask)

      await this.keeperProducer.send({
        topic: 'keeper.process.query',
        messages: [{
          key: currentTaskKey,
          value: queries.join(';'),
          headers: { length: currentTaskLength },
        }],
      })

      this.logger.log(`Task finished: [${+currentTaskKey + 1}/${currentTaskLength}]`)
    } catch (e) {
      this.logger.log(`Task error: [${+currentTaskKey + 1}/${currentTaskLength}]`)
      this.logger.error(e)

      const queries: string[] = []
      const incrementTask = `
      MATCH (task { id: "${taskId}" })
      SET task.progress = task.progress + 1
      RETURN task
      `

      queries.push(incrementTask)

      const now = new Date().getTime()
      const endOfTask = `
      MATCH (task: task {id: "${taskId}"})<-[:HAS_TASK]-(account: account)
      CALL apoc.do.when(task.amount=task.progress,
        'MATCH (user: user {id: "${userId}"})
        SET account.taskUpdatedAt = "${now}"
        SET user.lastSyncTimestamp = "${now}"',
        '',
        {account:account}
      )
      YIELD value
      RETURN account,task
      `

      queries.push(endOfTask)

      await this.keeperProducer.send({
        topic: 'keeper.process.query',
        messages: [{
          key: currentTaskKey,
          value: queries.join(';'),
          headers: { length: currentTaskLength },
        }],
      })
    }
  }
}
