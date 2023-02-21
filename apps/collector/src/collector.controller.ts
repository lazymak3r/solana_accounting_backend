import { Controller } from '@nestjs/common'
import { Ctx, KafkaContext, MessagePattern, Payload } from '@nestjs/microservices'
import { ProcessSignatureDto } from '@lib/core'
import { CollectorService } from './collector.service'

@Controller()
export class CollectorController {
  constructor(
    private readonly collectorService: CollectorService,
  ) {}

  @MessagePattern('collector.process.signature')
  async processSignature(@Payload() data: ProcessSignatureDto, @Ctx() context: KafkaContext) {
    return await this.collectorService.processSignature(data, context)
  }
}
