import { randomUUID } from 'crypto'
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { Neo4jService } from '@nhogs/nestjs-neo4j'
import { SolanaParser } from '@debridge-finance/solana-transaction-parser'
import { unix } from 'moment'
import { Redis } from 'ioredis'
import {
  TransactionAccount,
  TransactionProperties,
  TransactionReturnType,
} from '../../../../apps/api/src/transaction/transaction.interface'
import { FindTransactionsDto, SyncAccountTransactionsDto } from '../../../../apps/api/src/transaction/dto'
import { IUserProperties } from '../../../../apps/api/src/user'
import { Transaction, TransactionAccountEntity } from '../../../../apps/api/src/transaction/entities'
import { clearStringify } from '../../../core/utils'
import { Web3Service } from '../../../core'

// export enum RelationType {
//   Received = 'Received',
//   Send = 'Send',
//   SendFee = 'SendFee',
// }

@Injectable()
export class TransactionService {
  private redis: Redis = new Redis()

  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly web3Service: Web3Service,
  ) {
  }
  // /**
  //  * Fetch all transactions by address from db
  //  */
  // async findAllTransactions(address?: string, relationType?: RelationType) {
  //   const transactions = await this.neo4jService.run({
  //     cypher: `MATCH (a:account ${address ? `{address: "${address}"}` : ''})-[${relationType ? `r:${relationType}` : ''}]-(u:transaction)
  //     RETURN u`,
  //   })
  //   return transactions.records.map(rec => new Transaction(rec.get('u')).toJson())
  // }

  /**
   * Find transactions
   * TODO: add concrete return type
   */
  async findTransactions(data: FindTransactionsDto, user: IUserProperties) {
    const { startDate, endDate, accounts } = data
    let query = ''

    if (Array.isArray(accounts)) {
      try {
        query += `
        MATCH (user:user {id: "${user.id}"})-[:HAS_ACCOUNT]->(account:account)
        WHERE account.address IN ${clearStringify(accounts)}
        MATCH (task:task)--(account)
        MATCH (task)--(transaction:transaction)
        `
      } catch (e) {
        query += `
        MATCH (user:user {id: "${user.id}"})-[:HAS_ACCOUNT]->(account:account)
        MATCH (task:task)--(account)
        MATCH (task)--(transaction:transaction)
        `
      }
    } else {
      query += `
        MATCH (user:user {id: "${user.id}"})-[:HAS_ACCOUNT]->(account:account)
        MATCH (task:task)--(account)
        MATCH (task)--(transaction:transaction)
        `
    }

    if (startDate || endDate) {
      query += `
      WHERE ${startDate ? '$startDate <=' : ''} transaction.blockTime ${endDate ? ' <= $endDate' : ''}
      `
    }

    query += `
      MATCH (acc:transaction_account)-[:HAS_TRANSACTION]->(transaction)
      WITH transaction, collect(acc) AS accounts
      RETURN DISTINCT {transaction: transaction, accounts: accounts}
    `

    const session = this.neo4jService.getSession()
    try {
      const result = await session.run(query, { startDate: `${startDate} 00:00:00`, endDate: `${endDate} 23:59:59` })
      return result.records.map((rec) => {
        const keyName = rec.keys[0]
        const { transaction, accounts } = rec.get(keyName)

        const parsedTransaction = new Transaction(transaction).toJson()
        const parsedAccounts = accounts.map(acc => new TransactionAccountEntity(acc).toJson())

        return {
          ...parsedTransaction,
          accounts: parsedAccounts,
        } as TransactionReturnType
      })
    } catch (e) {
      throw new InternalServerErrorException()
    } finally {
      session.close().then()
    }
  }

  /**
   * Get store single transaction query by {@link signature}
   * TODO: add concrete return type
   */
  async getStoreTransactionQuery(signature: string) {
    try {
      const parsedBySolana = await this.web3Service.getParsedTransaction(signature, { commitment: 'finalized', maxSupportedTransactionVersion: 0 })
      const parser = new SolanaParser([])
      const parsedByDeBridge = await parser.parseTransaction(this.web3Service.client, signature)
      // Todo delete this part
      const transferIndex = parsedByDeBridge.findIndex(instr => ['transfer'].includes(instr.name))
      if (transferIndex === -1) {
        return null
      }
      // Todo delete this part
      // Todo uncomment this part
      // const transferIndex = parsedByDeBridge.findIndex(instr => ['transfer', 'transferChecked'].includes(instr.name))
      // if (transferIndex === -1) {
      //   return null
      // }
      // Todo uncomment this part

      let query = ''
      const transaction: Partial<TransactionProperties> = {
        signature,
        id: randomUUID(),
        fee: parsedBySolana?.meta?.fee,
        status: parsedBySolana?.meta?.err === null ? 'successful' : 'failed',
        parsedType: parsedByDeBridge?.[transferIndex]?.name || '',
        args: `${clearStringify(parsedByDeBridge?.[transferIndex]?.args as object)}`,
        programId: parsedByDeBridge?.[transferIndex]?.programId,
        err: parsedBySolana?.meta?.err ? `${parsedBySolana?.meta?.err}` : null,
        blockTime: unix(parsedBySolana?.blockTime).format('YYYY-MM-DD HH:mm:ss'),
        slot: parsedBySolana?.slot,
      }

      const date = new Date(new Date(transaction.blockTime).setUTCHours(0, 0, 0)).toISOString()
      const resultString = await this.redis.get(date)
      const result = JSON.parse(resultString)
      transaction.solPrice = Number(result.average_price)

      query += `CREATE (t: transaction ${clearStringify(transaction)})`

      const accounts = parsedByDeBridge?.[transferIndex]?.accounts || []
      const preBalances = parsedBySolana?.meta?.preBalances
      const postBalances = parsedBySolana?.meta?.postBalances
      const accountKeys = parsedBySolana?.transaction?.message?.accountKeys
      const sender = accounts.find(a => a.name === 'sender')
      const receiver = accounts.find(a => a.name === 'receiver')

      // Todo delete this part
      if (!sender || !receiver) {
        return null
      }
      // Todo delete this part

      if (Array.isArray(accounts)) {
        // Todo delete this part
        const filteredAccounts = accounts.filter(a => ['sender', 'receiver'].includes(a.name))
        // Todo delete this part

        // Todo change filteredAccounts to accounts
        filteredAccounts.forEach((acc, index) => {
          const addressIndex = accountKeys?.findIndex(account => account.pubkey.toString() === acc.pubkey.toString())

          const variable = `account${index}`
          const account: Partial<TransactionAccount> = {
            ...acc,
            id: randomUUID(),
          }
          if (![-1, undefined].includes(addressIndex)) {
            account.postBalance = postBalances?.[addressIndex].toString()
            account.preBalance = preBalances?.[addressIndex].toString()
          }

          query += `
            CREATE (${variable}: transaction_account ${clearStringify(account)})
            CREATE (${variable})-[:HAS_TRANSACTION]->(t)
          `
        })
      }

      return query
    } catch (e) {
      throw new InternalServerErrorException(e)
    }
  }

  /**
   * Store single transaction by {@link signature}
   * TODO: add concrete return type
   */
  async storeTransaction(signature: string) {
    const session = this.neo4jService.getSession({ write: true })
    try {
      let query = await this.getStoreTransactionQuery(signature)
      if (query) {
        query += 'RETURN t'
        const result = await this.neo4jService.run({ cypher: query }, { write: true })
        return result.records.map((rec) => {
          return new Transaction(rec.get('t')).toJson()
        })
      }
      return null
    } catch (e) {
      throw new InternalServerErrorException(e)
    } finally {
      session.close().then()
    }
  }

  /**
   * Get store multiple transactions query
   */
  async getSyncAccountTransactionsQuery(data: SyncAccountTransactionsDto) {
    try {
      const { account, limit } = data
      const confirmedSignatures = await this.web3Service.getSignaturesForAddress(account, { limit })
      const queries = []
      for (const { signature } of confirmedSignatures) {
        const query = await this.getStoreTransactionQuery(signature)
        queries.push(query)
      }
      return queries
    } catch (e) {
      throw new InternalServerErrorException()
    }
  }

  /**
   * Store multiple transactions
   */
  async syncAccountTransactions(data: SyncAccountTransactionsDto) {
    const { account, limit } = data
    const confirmedSignatures = await this.web3Service.getSignaturesForAddress(account, { limit: +limit })
    const result = []
    for (const { signature } of confirmedSignatures) {
      const transaction = await this.storeTransaction(signature)
      transaction && result.push(transaction)
    }
    return result
  }

  /**
   * store signatures as graph
   */
  //  async createSignaturesByAddress(address: string) {
  //   const signatures = await this.client.getSignaturesForAddress(
  //     new PublicKey(address),
  //   )

  //   if (signatures?.length) {
  //     const signaturesRequest = getMergeArrayRequest(
  //       signatures,
  //       'Signatures',
  //     )
  //     console.log({ signaturesRequest })

  //     const request = `
  //           MATCH (a:Account { address: "${address}"})
  //           ${signaturesRequest.string}
  //           ${getRelationsRequestByAlias(
  //       signaturesRequest.params,
  //       'a',
  //       'SIGNED',
  //     )}
  //           `
  //     await this.neo4jService.run({ cypher: request })
  //   }

  //   return signatures
  // }
}
