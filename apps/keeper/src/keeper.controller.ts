import { Controller } from '@nestjs/common'
import { Ctx, KafkaContext, MessagePattern, Payload } from '@nestjs/microservices'
import { KeeperService } from './keeper.service'

@Controller()
export class KeeperController {
  constructor(private readonly keeperService: KeeperService) {}

  @MessagePattern('keeper.process.query')
  async processQuery(@Payload() data: any, @Ctx() context: KafkaContext) {
    this.keeperService.processQuery(data, context).then()
  }
}
