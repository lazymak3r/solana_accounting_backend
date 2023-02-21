import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ClientKafka, ClientsModule, Transport } from '@nestjs/microservices'
import { JwtModule } from '@nestjs/jwt'
import { MainModule } from '../../../libs/main/src/main.module'
import { Neo4jDbService, Web3Service } from '../../../libs/core'
import { KAFKA_COLLECTOR_SERVICE_NAME } from './constants'
import { TransactionController } from './transaction/transaction.controller'
import { UserService } from './user'
import { DevController } from './developer'
import { AccountController } from './account/account.controller'
import { AuthController } from './user/auth/auth.controller'
import { AuthService } from './user/auth/auth.service'
import { AddressBookController } from './address-book/address-book.controller'
import { AddressBookService } from './address-book/address-book.service'
import { AccountService } from './account/account.service'
import { TagController } from './tag/tag.controller'
import { TagService } from './tag/tag.service'
import { GroupService } from './group/group.service'
import { GroupController } from './group/group.controller'
import { TaskController } from './task/task.controller'
import { TaskService } from './task/task.service'
import { CategoryService } from './category/category.service'
import { CategoryController } from './category/category.controller'
import { ProfileController } from './profile/profile.controller'
import { ProfileService } from './profile/profile.service'

@Module({
  imports: [
    MainModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '365d'),
        },
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: KAFKA_COLLECTOR_SERVICE_NAME,
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
                clientId: KAFKA_COLLECTOR_SERVICE_NAME,
                brokers: [broker],
                ssl: broker.startsWith('https'),
                sasl,
              },
              consumer: {
                groupId: `${KAFKA_COLLECTOR_SERVICE_NAME}-consumer`,
              },
              // send: {
              //   timeout: 5000,
              //   acks: -1,
              // },
            },
          }
        },
      },
    ]),
  ],
  controllers: [
    AccountController, AddressBookController, AuthController,
    DevController, TransactionController, TagController, GroupController,
    TaskController, CategoryController, ProfileController,
  ],
  providers: [
    Web3Service, Neo4jDbService, UserService, AccountService,
    ClientKafka, AuthService, AddressBookService,
    TagService, GroupService, TaskService, CategoryService,
    ProfileService,
  ],
  exports: [
    Web3Service, Neo4jDbService,
    UserService, AccountService, ClientKafka, AuthService,
    AddressBookService, TagService, GroupService, TaskService, CategoryService,
    ProfileService,
  ],
})
export class AppModule { }
