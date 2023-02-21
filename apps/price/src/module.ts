import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { HttpModule } from '@nestjs/axios'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PriceController } from './price.controller'
import { PriceService } from './price.service'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [PriceController, ConfigService],
  providers: [PriceService],
})
export class AppModule {}
