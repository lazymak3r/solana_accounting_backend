import { Injectable, NotFoundException } from '@nestjs/common'
import { Neo4jService } from '@nhogs/nestjs-neo4j'

@Injectable()
export class Neo4jDbService {
  constructor(private readonly neo4jService: Neo4jService) {}

  /**
   * Delete all graphs
   */
  async clearAllGraphs() {
    return await this.neo4jService.run({
      cypher: `MATCH (n)
        OPTIONAL MATCH (n)-[r]-()
        DELETE n,r`,
    })
  }

  /**
   * Delete all accounts
   */
  async clearAllAccountGraphs() {
    return await this.neo4jService.run({
      cypher: `MATCH (n)
          OPTIONAL MATCH (n)-[r]-(a: account)
          DELETE a,r`,
    })
  }

  /**
   * Get graphs by label
   */
  async getAllGraphsByLabel(labelName: string) {
    const res = await this.neo4jService.run({
      cypher: `
            MATCH (u:${labelName})
            RETURN u
        `,
    })

    if (!res.records[0]?.get('u')) {
      throw new NotFoundException(`Cannot find any ${labelName}`)
    }

    return res.records.map(row => row.get('u'))
  }
}
