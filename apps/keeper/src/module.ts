import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { Neo4jConfig, Neo4jModule } from '@nhogs/nestjs-neo4j'
import { KeeperController } from './keeper.controller'
import { KeeperService } from './keeper.service'
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
  controllers: [KeeperController],
  providers: [KeeperService],
})
export class AppModule {}
