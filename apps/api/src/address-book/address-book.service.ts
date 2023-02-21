import { randomUUID } from 'crypto'
import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import { Neo4jService } from '@nhogs/nestjs-neo4j'
import { Web3Service } from '../../../../libs/core'
import { IUserProperties } from '../user'
import { Tag } from '../tag/entities'
import { CreateAddressBookDto } from './dto'
import { AddressBook } from './entities/address-book.entity'
import { IAddressBookResponse } from './address-book-response.interface'
import { IQueryAddressBookDto } from './dto/query-address-book.dto'

@Injectable({ scope: Scope.REQUEST })
export class AddressBookService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly web3Service: Web3Service,
    @Inject(REQUEST) private request: Request,
  ) { }

  /**
   * Create address book node
   * Create relation between Account, User and AddressBook
   */
  async createAddressBook(addressBookDto: CreateAddressBookDto, params: IQueryAddressBookDto, user: IUserProperties) {
    const session = this.neo4jService.getSession({ write: true })
    try {
      let req = `MATCH (a:user { publicKey: "${user.publicKey}" }) \n`
      if (params.publicKey) {
        const currentAccountNode = await session.run(`MATCH (b:account { address: "${params.publicKey}" }) RETURN b`)
        if (!currentAccountNode.records.length) {
          throw new NotFoundException('Account not found')
        }
        req += `MATCH (b:account { address: "${params.publicKey}" })\n`
      }
      const id = randomUUID()

      req += `MERGE (n:addressBook {
        id: $id,
        companyName: $companyName,
        address: $address,
        type: $type,
        primaryContact: $primaryContact,
        displayContact: $displayContact,
        phone: $phone,
        email: $email,
        country: $country,
        city: $city,
        zip: $zip,
        department: $department,
        discord: $discord,
        messenger: $messenger,
        website: $website,
        fiatCurrency: $fiatCurrency,
        taxRate: $taxRate,
        remark: $remark,
        me: $me
      })
      CREATE (a)-[:Owner]->(n)\n`

      if (params.publicKey) {
        req += 'CREATE (n)-[:Has]->(b)\n'
      }

      if (params.tags) {
        req += `
          FOREACH ( label IN $tags |
            MERGE (t:tag {label: label})
            ON CREATE SET t.id = randomUUID()

            MERGE (n)-[:HAS_TAG { ownerId: "${user.id}" }]->(t)
          )
          `
      }

      req += 'RETURN n'

      await session.run(req, { ...addressBookDto, id, tags: params.tags })
      return await this.getMine(user, { ...params, id })
    } finally {
      session.close().then()
    }
  }

  /**
   * Find all address-books by user
   */
  async getMine(user: IUserProperties, params: IQueryAddressBookDto = {}): Promise<IAddressBookResponse | IAddressBookResponse[]> {
    const session = this.neo4jService.getSession()
    try {
      let req = ''
      const where = []
      const skip = params.offset || 0
      const limit = params.limit || 10
      const order = params.order
      const id = params.id

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

      if (id) {
        req += `MATCH (a:addressBook { id: "${id}" })`
      } else {
        req += 'MATCH (a:addressBook)'
      }
      req += `<-[]-(n: user { publicKey: $publicKey })
              ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
              OPTIONAL MATCH (a)-[:HAS_TAG { ownerId: $userId }]->(t:tag)
              WITH collect(a) AS addressBooks
              UNWIND addressBooks AS a
              RETURN DISTINCT a, [(a:addressBook)-[:HAS_TAG]->(t) | t] AS tagList\n`

      if (order === 'asc') {
        req += 'ORDER BY a.displayContact, a.companyName'
      } else if (order === 'desc') {
        req += 'ORDER BY a.displayContact DESC, a.companyName DESC'
      }

      const result = await session.run(req, data)

      if (!result.records.length) {
        return []
      }

      if (id) {
        const answer: IAddressBookResponse = { ...new AddressBook(result.records[0].get('a')).toJson(), tags: [] }
        if (result.records[0].get('tagList')) {
          answer.tags = result.records[0].get('tagList').map((tag: any) => new Tag(tag).toJson())
        }
        return answer
      }

      return result.records.map((record) => {
        const answer: IAddressBookResponse = { ...new AddressBook(record.get('a')).toJson(), tags: [] }
        if (record.get('tagList')) {
          answer.tags = record.get('tagList').map((tag: any) => new Tag(tag).toJson())
        }
        return answer
      })
    } finally {
      session.close().then()
    }
  }

  /**
   * Update address-book data
   */
  async updateById(addressBookDto: CreateAddressBookDto, params: IQueryAddressBookDto, user: IUserProperties) {
    const session = this.neo4jService.getSession({ write: true })
    try {
      const id = params.id
      const tagList = params.tags || []

      const result = await session.run(`
      MATCH(n: user { publicKey: "${user.publicKey}" }) - [] -> (a:addressBook { id: $id }) return a`, { id })

      if (!result.records.length) {
        throw new NotFoundException('Address book not found')
      }

      let req = ''

      req += `
      MATCH(n: user { publicKey: "${user.publicKey}" }) - [] -> (a:addressBook { id: $id })
      `

      req += `
      OPTIONAL MATCH (a)-[r:HAS_TAG { ownerId: $userId }]->(oldTag: tag)
      DELETE r
      `

      if (tagList.length) {
        req += `FOREACH ( label IN $tagList |
            MERGE (t:tag {label: label}) ON CREATE SET t.id = randomUUID()
            MERGE (a)-[:HAS_TAG { ownerId: $userId }]->(t)
        )\n`
      }

      req += `
      SET a += $addressBookDto
      RETURN a`

      await session.run(req, { addressBookDto, id, userId: user.id, tagList })

      return await this.getMine(user, params)
    } finally {
      session.close().then()
    }
  }

  /**
   * Update address-book data
   */
  async deleteById(id: string, user: IUserProperties) {
    const session = this.neo4jService.getSession({ write: true })
    try {
      const result = await session.run(`
      MATCH(n: user { publicKey: "${user.publicKey}" }) - [] -> (a:addressBook { id: "${id}" }) return a`)

      if (!result.records.length) {
        throw new NotFoundException('Address book not found')
      }

      await session.run(`
      MATCH(n: user { publicKey: "${user.publicKey}" }) - [] -> (a:addressBook { id: "${id}" })
        DETACH DELETE a
        `)

      return 'Address book successfully deleted'
    } finally {
      session.close().then()
    }
  }
}
