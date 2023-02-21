import { Controller } from '@nestjs/common'
import { Ctx, MessagePattern, Payload, RedisContext } from '@nestjs/microservices'
import { PriceService } from './price.service'

@Controller()
export class PriceController {
  constructor(private readonly priceService: PriceService) {}

  @MessagePattern('price.process.get_price')
  async getPrice(@Payload() data: { date: string }, @Ctx() context: RedisContext) {
    return this.priceService.getPrice(data, context)
  }
}
