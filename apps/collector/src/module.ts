import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MainModule } from 'main/main'
import { Web3Service } from '../../../libs/core'
import { KAFKA_KEEPER_SERVICE_NAME } from './constants'
import { CollectorController } from './collector.controller'
import { CollectorService } from './collector.service'

@Module({
  imports: [
    MainModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClientsModule.registerAsync([
      {
        name: KAFKA_KEEPER_SERVICE_NAME,
        inject: [ConfigService],
        useFactory: async (cfg: ConfigService) => {
          const broker = cfg.get<string>('KAFKA_BROKERCONNECT')
          if (!broker) {
            throw new Error('Please provide `KAFKA_BROKERCONNECT` for `collector` service.')
          }
          let sasl
          const username = cfg.get<string>('KAFKA_SASL_USERNAME')
          const password = cfg.get<string>('KAFKA_SASL_PASSWORD')
          if (username && password) {
            sasl = {
              mechanism: 'plain',
              username,
              password,
            }
          }
          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: KAFKA_KEEPER_SERVICE_NAME,
                brokers: [broker],
                ssl: broker.startsWith('https'),
                sasl,
              },
              consumer: {
                groupId: `${KAFKA_KEEPER_SERVICE_NAME}-consumer`,
              },
            },
          }
        },
      },
    ]),
  ],
  controllers: [CollectorController, Web3Service],
  providers: [CollectorService, Web3Service],
  exports: [],
})
export class AppModule {}
