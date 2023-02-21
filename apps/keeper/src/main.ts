import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './module'

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule)
  const cfg = appContext.get(ConfigService)

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'keeper',
          brokers: [cfg.get<string>('KAFKA_BROKERCONNECT')],
        },
        consumer: {
          groupId: 'keeper-consumer',
        },
      },
    },
  )
  await app.listen()
}

bootstrap().then()
