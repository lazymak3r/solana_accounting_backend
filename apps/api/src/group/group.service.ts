import { randomUUID } from 'crypto'
import { Injectable, NotFoundException } from '@nestjs/common'
import { Neo4jService } from '@nhogs/nestjs-neo4j'
import { IUserProperties } from '../user'
import { CreateGroupDto } from './dto/create-group.dto'
import { Group } from './entities'
import { IQueryGroupDto } from './dto/query-group.dto'

@Injectable()
export class GroupService {
  constructor(
    private readonly neo4jService: Neo4jService,
  ) { }

  /**
     * Create group if not exist, return group
     */
  async mergeGroup(dto: CreateGroupDto, user: IUserProperties) {
    const session = this.neo4jService.getSession({ write: true })
    try {
      const existGroup = await session.run(`
        MATCH (u:user { publicKey: "${user.publicKey}" })-[:HAS_GROUP]->(t: group { label: "${dto.label}" })
        RETURN t`)

      if (existGroup.records.length) {
        const group = new Group(existGroup.records[0].get('t')).toJson()
        return await this.getGroupsByUser(user, { id: group.id })
      }
      const id = randomUUID()

      await session.run(`
        MATCH (u:user { publicKey: "${user.publicKey}" })
        MERGE (u)-[:HAS_GROUP]->(t: group { label: "${dto.label}", id: "${id}"  })
        RETURN t`)

      return await this.getGroupsByUser(user, { id })
    } finally {
      await session.close()
    }
  }

  /**
     *  Fetch all groups related to user
     */
  async getGroupsByUser(user: IUserProperties, params: IQueryGroupDto) {
    const session = this.neo4jService.getSession()
    try {
      const where = []
      const skip = params.offset || 0
      const limit = params.limit || 10

      const data: any = {
        userId: user.id,
        skip,
        limit,
      }

      let req = `
      MATCH (u: user { publicKey: "${user.publicKey}" })-[r:HAS_GROUP]->`

      if (params.id) {
        req += `(t:group { id: "${params.id}" })`
      } else {
        req += '(t:group)'
      }

      req += `
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      RETURN t`

      const existGroup = await session.run(req, data)

      if (existGroup.records.length) {
        if (params.id) {
          return new Group(existGroup.records[0].get('t')).toJson()
        } else {
          return existGroup.records.map(record => new Group(record.get('t')).toJson())
        }
      }
      return []
    } finally {
      await session.close()
    }
  }

  /**
   * Delete group by id
   */
  async deleteById(id: string, user: IUserProperties) {
    const session = this.neo4jService.getSession({ write: true })
    try {
      const existGroup = await session.run(`
        MATCH (u: user { publicKey: "${user.publicKey}" })-[r:HAS_GROUP]->(t:group { id: "${id}" })
        RETURN t`)

      if (!existGroup.records.length) {
        throw new NotFoundException('Group not found or not own this user')
      }

      await session.run(`
      MATCH (u: user { publicKey: "${user.publicKey}" })-[r:HAS_GROUP]->(t:group { id: "${id}" })
      DETACH DELETE t
      RETURN t`)

      return 'Group deleted'
    } finally {
      await session.close()
    }
  }

  /**
   * Update group by id
   */
  async updateById(dto: CreateGroupDto, user: IUserProperties, params: IQueryGroupDto) {
    const session = this.neo4jService.getSession({ write: true })
    try {
      const existGroup = await session.run(`
        MATCH (u: user { publicKey: "${user.publicKey}" })-[r:HAS_GROUP]->(t:group { id: "${params.id}" })
        RETURN t`)

      if (!existGroup.records.length) {
        throw new NotFoundException('Group not found or not own this user')
      }

      await session.run(`
      MATCH (u: user { publicKey: "${user.publicKey}" })-[r:HAS_GROUP]->(t:group { id: "${params.id}" })
      SET t+=$group
      RETURN t`, { group: dto })

      return await this.getGroupsByUser(user, params)
    } finally {
      await session.close()
    }
  }
}
