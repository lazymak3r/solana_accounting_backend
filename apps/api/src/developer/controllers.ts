import { Controller, Post } from '@nestjs/common'
import { Neo4jDbService } from '../../../../libs/core'

@Controller('dev')
export class DevController {
  constructor(private readonly neo4jdbService: Neo4jDbService) { }

  @Post('/clear')
  async clearAllGraphs() {
    return await this.neo4jdbService.clearAllGraphs()
  }

  @Post('/clear/account')
  async clearAllAccountGraphs() {
    return await this.neo4jdbService.clearAllAccountGraphs()
  }
}
