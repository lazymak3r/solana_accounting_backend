import { randomUUID } from 'crypto'
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common'
import { ClientKafka } from '@nestjs/microservices'
import { Neo4jService } from '@nhogs/nestjs-neo4j'
import { Producer } from 'kafkajs'
import { TaskEntity } from '../../../api/src/account/entities/task.entity'
import { ProcessSignatureDto, Web3Service } from '../../../../libs/core'
import { clearStringify } from '../../../../libs/core/utils'
import { KAFKA_COLLECTOR_SERVICE_NAME } from '../constants'
import { IUserProperties } from '../user'
import { AddressBook } from '../address-book/entities/address-book.entity'
import { Tag } from '../tag/entities'
import { Group } from '../group/entities'
import { Account } from './entities/account.entity'
import { AccountTypeEnum } from './account.interface'
import { CreateAccountDto, GetAccountTasksDto, IQueryAccountDto } from './dto'
import { IAccountResponse } from './account-response.interface'

@Injectable()
export class AccountService implements OnModuleInit {
  private collectorProducer: Producer

  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly web3Service: Web3Service,
    @Inject(KAFKA_COLLECTOR_SERVICE_NAME) private collectorClient: ClientKafka,
  ) { }

  async onModuleInit() {
    this.collectorProducer = await this.collectorClient.connect()
  }

  /**
   * Sync signatures by account, Account must be saved on db
   */
  private async syncSignatures(account: CreateAccountDto, user: IUserProperties, reSync?: boolean) {
    const session = this.neo4jService.getSession({ write: true })
    const signatures = await this.web3Service.getSignaturesForAddress(account.address)
    const allSignatures = signatures?.map(signature => signature.signature) || []
    const result = await session.run(`
      MATCH (u:user {id: "${user.id}"})-[:HAS_ACCOUNT]->(a:account {address: "${account.address}"})
      MATCH (a)-[:HAS_TASK]->(t:task)
      RETURN t.syncedSignatures as signatures, t.amount as amount, t.progress as progress;
    `)

    let syncedSignatures = []
    try {
      if (
        result.records.length
          && result?.records?.[0]?.get('amount') && result?.records?.[0]?.get('progress')
          && result?.records?.[0]?.get('amount') !== result?.records?.[0]?.get('progress')
      ) {
        return {
          message: 'The task is already in the process of synchronization',
        }
      }

      syncedSignatures = result?.records?.[0]?.get('signatures') || []
    } catch (e) {
      console.log(e)
    }

    const foundedTask = await session.run(`
      MATCH (u:user {id: "${user.id}"})-[:HAS_ACCOUNT]->(a:account {address: "${account.address}"})
      MATCH (a)-[:HAS_TASK]->(t:task)
      SET t.amount = ${signatures.length}
      SET t.progress = ${syncedSignatures.length}
      SET t.syncedSignatures = ${clearStringify(allSignatures)}
      RETURN t
    `)

    let taskId = randomUUID()
    if (foundedTask.records.length) {
      const existingTask = new TaskEntity(foundedTask.records[0].get('t')).toJson()
      taskId = existingTask.id
    }

    const messages = signatures
      .filter(signature => !syncedSignatures.includes(signature.signature))
      .map((signature, index) => {
        const payload: ProcessSignatureDto = { signature, account, taskId, userId: user.id }
        return {
          key: String(index),
          value: JSON.stringify(payload),
          headers: {
            length: String(signatures.length),
          },
        }
      })

    try {
      if (!reSync) {
        await session.run(`
        MATCH (u:user {id: "${user.id}"})-[:HAS_ACCOUNT]->(a:account {address: "${account.address}"})
        CREATE (t: task {
          id: "${taskId}",
          amount: ${signatures.length},
          progress: 0,
          transferCount: 0,
          syncedSignatures: ${clearStringify(allSignatures)},
          createdAt: ${new Date().getTime()}
        })
        CREATE (a)-[:HAS_TASK]->(t)
        return t
        `)
      }

      return await this.collectorProducer.send({
        topic: 'collector.process.signature',
        messages,
      })
    } finally {
      session.close().then()
    }
  }

  /**
   * Update account data
   */
  async updateById(account: CreateAccountDto, user: IUserProperties, params: IQueryAccountDto = {}) {
    const session = this.neo4jService.getSession({ write: true })
    try {
      const id = params.id

      const result = await session.run(`
      MATCH (n: user { publicKey: "${user.publicKey}" })-[]->(a:account { id: "${id}"}) return a`)

      if (!result.records.length) {
        throw new NotFoundException('Account not found')
      }

      const tagList = params.tags || []

      let req = ''

      req += `MATCH (n: user { publicKey: "${user.publicKey}" })-[]->(a:account { id: "${id}"})
              OPTIONAL MATCH (a)-[tagRel:HAS_TAG { ownerId: $userId }]->(oldTag: tag)
              OPTIONAL MATCH (a)-[groupRel:HAS_GROUP]->(oldGroup:group)
              OPTIONAL MATCH (b: addressBook)-[addressBookRel:HAS_ADDRESS_BOOK]->(a2:account { id: "${id}"})\n`

      if (params.addressBookId) {
        req += `
        MATCH (b2: addressBook { id: "${params.addressBookId}"})
        `
      }
      if (params.selectedGroupId) {
        req += `
        MATCH (g: group { id: "${params.selectedGroupId}"})
        `
      }

      req += `
      SET a += $account
      DELETE tagRel, addressBookRel, groupRel
      `

      if (params.addressBookId) {
        req += 'MERGE (b2)-[:HAS_ADDRESS_BOOK]->(a)\n'
      }
      if (params.selectedGroupId) {
        req += 'MERGE (a)-[:HAS_GROUP]->(g)\n'
      }
      if (tagList.length) {
        req += `FOREACH ( label IN $tagList |
            MERGE (t:tag {label: label}) ON CREATE SET t.id = randomUUID()
            MERGE (a)-[:HAS_TAG { ownerId: $userId }]->(t)
        )\n`
      }

      req += 'RETURN a'

      await session.run(req, { account, userId: user.id, tagList })

      return await this.getMine(user, params)
    } finally {
      session.close().then()
    }
  }

  /**
   * Find user related accounts
   */
  async getMine(user: IUserProperties, params: IQueryAccountDto) {
    const session = this.neo4jService.getSession()
    try {
      const id = params.id

      let req = ''
      const where = []
      const skip = params.offset || 0
      const limit = params.limit || 10

      const data: any = {
        publicKey: user.publicKey,
        userId: user.id,
        skip,
        limit,
      }

      if (params.tags && params.tags.length) {
        where.push(' ANY (tag in $tags WHERE (a)-[:HAS_TAG]->({label: tag})) ')
        data.tags = params.tags
      }

      if (params.groups && params.groups.length) {
        where.push(' ANY (groupId in $groups WHERE (a)-[:HAS_GROUP]->({id: groupId})) ')
        data.groups = params.groups
      }

      req += `
      MATCH (n: user { publicKey: "${user.publicKey}" })-[:HAS_ACCOUNT]->`
      if (id) {
        req += `(a:account {id: "${id}"})`
      } else {
        req += '(a:account)'
      }

      req += `
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ${params.me ? 'WHERE a.me = true' : ''}
      ${params.withAddressBook ? 'OPTIONAL MATCH (a)<-[:HAS_ADDRESS_BOOK]-(b: addressBook)' : ''}
      ${params.withGroup ? 'OPTIONAL MATCH (a)-[:HAS_GROUP]->(g: group)' : ''}
      OPTIONAL MATCH (a)-[:HAS_TAG { ownerId: "${user.id}" }]->(t:tag)
      WITH ${params.withGroup ? 'g,' : ''} ${params.withAddressBook ? 'b,' : ''} collect(a) AS account
      UNWIND account AS a
      RETURN DISTINCT a, ${params.withGroup ? 'g,' : ''} ${params.withAddressBook ? 'b,' : ''} [(a:account)-[:HAS_TAG]->(t) | t] AS tagList
      `
      const result = await session.run(req, data)

      if (id) {
        const answer: IAccountResponse = { ...new Account(result.records[0].get('a')).toJson(), tags: [] }
        if (params.withAddressBook && result.records[0].get('b')) {
          answer.addressBook = new AddressBook(result.records[0].get('b')).toJson()
        }
        if (params.withGroup && result.records[0].get('g')) {
          answer.group = new Group(result.records[0].get('g')).toJson()
        }
        if (result.records[0].get('tagList')) {
          answer.tags = result.records[0].get('tagList').map((tag: any) => new Tag(tag).toJson())
        }
        return answer
      }
      return result.records.map((record) => {
        const answer: IAccountResponse = { ...new Account(record.get('a')).toJson(), tags: [] }
        if (params.withAddressBook && record.get('b')) {
          answer.addressBook = new AddressBook(record.get('b')).toJson()
        }
        if (params.withGroup && record.get('g')) {
          answer.group = new Group(record.get('g')).toJson()
        }
        if (record.get('tagList')) {
          answer.tags = record.get('tagList').map((tag: any) => new Tag(tag).toJson())
        }
        return answer
      })
    } finally {
      session.close()
    }
  }

  /**
   * Save account data as graph. Optional relate to address book
   */
  async createAccount(account: CreateAccountDto, user: IUserProperties, params: IQueryAccountDto = {}) {
    const session = this.neo4jService.getSession({ write: true })
    try {
      const id = randomUUID()
      const alreadyCreated = await session.run(`MATCH (n: user { publicKey: "${user.publicKey}" })-[]->(a: account {
        address: "${account.address}"
      })
      RETURN a`)

      if (alreadyCreated.records.length) {
        throw new ConflictException('Account already exist')
      }
      let req = ''

      req += `MATCH (n: user { publicKey: "${user.publicKey}" })`

      if (params.addressBookId) {
        req += `MATCH (b: addressBook { id: "${params.addressBookId}" })`
      }

      if (params.selectedGroupId) {
        req += `MATCH (g: group { id: "${params.selectedGroupId}" })`
      }

      req += `
      MERGE (a: account {
        address: "${account.address}",
        id: "${id}",
        type: "${account.type}",
        me: ${account.me},
        displayName: "${account.displayName || ''}"
      })
      MERGE (n)-[:HAS_ACCOUNT]->(a)
      `

      if (params.tags) {
        req += `
          FOREACH ( label IN $tags |
            MERGE (t:tag {label: label})
            ON CREATE SET t.id = randomUUID()

            MERGE (a)-[:HAS_TAG { ownerId: "${user.id}" }]->(t)
          )
          `
      }

      if (params.addressBookId) {
        req += 'MERGE (b)-[:HAS_ADDRESS_BOOK]->(a)'
      }

      if (params.selectedGroupId) {
        req += 'MERGE (a)-[:HAS_GROUP]->(g)'
      }

      req += 'RETURN a'
      await session.run(req, { account, tags: params.tags })

      // if (account.me) {
      //   await this.reSyncAccountByAddress(account, user)
      // }

      return await this.getMine(user, { ...params, id })
    } finally {
      session.close()
    }
  }

  /**
   * 1 Merge account by address
   * 2 Find account signatures
   * 3 Create tasks to workers
   */
  async syncAccountByAddress(account: CreateAccountDto, user: IUserProperties) {
    const onChainAccount = await this.web3Service.getAccountInfo(account.address)

    if (!onChainAccount) {
      throw new BadRequestException('Account not found')
    }

    const session = this.neo4jService.getSession({ write: true })
    try {
      const result = await session.run(`
      MATCH (u:user {id: "${user.id}"})-[:HAS_ACCOUNT]->(a:account {address: "${account.address}"})
      RETURN a
      `)
      if (result.records.length) {
        return this.reSyncAccountByAddress(account, user)
      }
    } finally {
      session.close()
    }

    await this.createAccount(account, user)

    return await this.syncSignatures(account, user)
  }

  /**
   * Repeat sync process for account
   */
  async reSyncAccountByAddress(account: CreateAccountDto, user: IUserProperties) {
    const session = this.neo4jService.getSession({ write: true })
    try {
      await this.web3Service.getAccountInfo(account.address)
      const result = await session.run(`MATCH (a: account { address: "${account.address}" }) RETURN a`)

      if (!result.records.length) {
        throw new NotFoundException('Account not found')
      }
      return await this.syncSignatures(account, user, true)
    } finally {
      session.close()
    }
  }

  /**
   * Validator. Account already exist
   */
  async isExist(address: string, user: IUserProperties): Promise<boolean> {
    const session = this.neo4jService.getSession()
    try {
      const alreadyCreated = await session.run(`MATCH (n: user { publicKey: "${user.publicKey}" })-[]->(a: account {
      address: "${address}"
    })
    RETURN a`)
      return !!alreadyCreated.records.length
    } finally {
      session.close()
    }
  }

  /**
   * Delete account with relation
   */
  async deleteMine(id: string, user: IUserProperties) {
    const session = this.neo4jService.getSession({ write: true })
    try {
      const result = await session.run(`
      MATCH (n: user { publicKey: "${user.publicKey}" })-[]->(a:account { id: "${id}"}) return a`)

      if (!result.records.length) {
        throw new NotFoundException('Account not found')
      }

      await session.run(`
        MATCH (n: user { publicKey: "${user.publicKey}" })-[]->(a:account { id: "${id}"})
        DETACH DELETE a
      `)

      return 'Account successfully deleted'
    } finally {
      session.close().then()
    }
  }

  /**
   * Account Types
   */
  async getTypes() {
    return Object.values(AccountTypeEnum)
  }

  /**
   * Get Account Tasks
   */
  async getTasks(dto: GetAccountTasksDto, user: IUserProperties) {
    const { accounts } = dto
    const session = this.neo4jService.getSession()
    try {
      const query = `
        MATCH (user: user { publicKey: "${user.publicKey}" })-[]->(account:account)
        WHERE account.address IN ${clearStringify(accounts)}
        MATCH (account)-[:HAS_TASK]->(task:task)
        RETURN task
      `
      const data = await session.run(query)

      return data.records.map((rec) => {
        const task = new TaskEntity(rec.get('task')).toJson()
        delete task.syncedSignatures
        return task
      })
    } finally {
      session.close().then()
    }
  }
}
