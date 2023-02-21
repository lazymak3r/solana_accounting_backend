import { Module } from '@nestjs/common'
import { Neo4jConfig, Neo4jModule } from '@nhogs/nestjs-neo4j'
import { ConfigService } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { REDIS_SERVICE_NAME } from '../../../apps/collector/src/constants'
import { Web3Service } from '../../core'
import { TransactionService } from '../../main/src/index'
import { MainService } from './main.service'

@Module({
  imports: [
    Neo4jModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Neo4jConfig => ({
        scheme: configService.get('NEO4J_SCHEME'),
        host: configService.get('NEO4J_HOST'),
        port: configService.get('NEO4J_PORT'),
        username: configService.get('NEO4J_USERNAME'),
        password: configService.get('NEO4J_PASSWORD'),
        disableLosslessIntegers: true,
      }),
      global: true,
    }),
    ClientsModule.register([
      {
        name: REDIS_SERVICE_NAME,
        transport: Transport.REDIS,
        options: {
          host: 'localhost',
          port: 6379,
        },
      },
    ]),
  ],
  providers: [MainService, TransactionService, Web3Service],
  exports: [MainService, TransactionService],
})
export class MainModule {
}
