import { randomUUID } from 'crypto'
import { Injectable } from '@nestjs/common'
import { Neo4jService } from '@nhogs/nestjs-neo4j'
import { IUserProperties } from '../user'
import { CreateTagDto } from './dto/create-tag.dto'
import { Tag } from './entities'
import { IQueryTagDto } from './dto/query-tag.dto'
import { ITagCollection } from './tag.interface'

@Injectable()
export class TagService {
  constructor(
    private readonly neo4jService: Neo4jService,
  ) { }

  /**
     * Create tag if not exist, return tag
     */
  async mergeTag(dto: CreateTagDto) {
    const session = this.neo4jService.getSession({ write: true })
    try {
      const existTag = await session.run(`
        MATCH (t: tag { label: "${dto.label}" })
        RETURN t`)

      if (existTag.records.length) {
        return new Tag(existTag.records[0].get('t')).toJson()
      }

      const newTag = await session.run(`
        CREATE (t: tag { label: "${dto.label}", id: "${randomUUID()}"  })
        RETURN t`)

      return new Tag(newTag.records[0].get('t')).toJson()
    } finally {
      await session.close()
    }
  }

  /**
   *  Fetch all tags related to user related with entity
   */
  async getTagCollectionByUser(user: IUserProperties) {
    const session = this.neo4jService.getSession()
    try {
      const labels = await session.run(`
        MATCH (n)-[r:HAS_TAG { ownerId: "${user.id}" }]->(t:tag)
        WITH DISTINCT labels(n) AS list
        RETURN list`)
      const labelsList: string[] = labels.records.map(l => l.get('list')[0])
      const answer: ITagCollection = {}

      // TODO make logic on cypher. Code bellow doent work by one session (cant terminate promise all by one session)

      // const data = await Promise.all(labelsList.map(async label => await session.run(`
      // MATCH (a:${label})-[r:HAS_TAG { ownerId: "${user.id}" }]->(t:tag)
      // RETURN t
      // `)))

      // const answer: ITagCollection = data.reduce((pv, cv, index) => {
      //   const tags = cv.records?.length ? cv.records.map(record => new Tag(record.get('t')).toJson()) : []
      //   return {
      //     ...cv,
      //     [labelsList[index]]: tags,
      //   }
      // }, {})

      for (let i = 0; i < labelsList.length; i++) {
        const label = labelsList[i]
        const data = await session.run(`
          MATCH (a:${label})-[r:HAS_TAG { ownerId: "${user.id}" }]->(t:tag)
          RETURN t
          `)
        const tags = data.records?.length ? data.records.map(record => new Tag(record.get('t')).toJson()) : []
        answer[label] = tags
      }

      return answer
    } finally {
      await session.close()
    }
  }

  /**
     *  Fetch all tags related to user
     */
  async getTagsByUser(user: IUserProperties, params: IQueryTagDto) {
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

      const existTag = await session.run(`
        MATCH (n: ${params.entity})-[r:HAS_TAG { ownerId: "${user.id}" }]->(t:tag)
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        RETURN t`, data)

      if (existTag.records.length) {
        return existTag.records.map(record => new Tag(record.get('t')).toJson())
      }
      return []
    } finally {
      await session.close()
    }
  }
}
