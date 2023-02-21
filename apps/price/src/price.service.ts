import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { RedisContext } from '@nestjs/microservices'
import { Cron } from '@nestjs/schedule'
import { HttpService } from '@nestjs/axios'
import { Observable } from 'rxjs'
import { AxiosResponse } from 'axios'
import { ConfigService } from '@nestjs/config'
import { IValidatorPriceModel } from '@app/price/src/models/validator.model'
import { Redis } from 'ioredis'

@Injectable()
export class PriceService implements OnModuleInit {
  private redis: Redis = new Redis()
  private readonly logger = new Logger(this.constructor.name)

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.handleFetchPrices()
  }

  async getPrice(data: { date: string }, _context: RedisContext): Promise<string> {
    const key = data.date
    return this.redis.get(key)
  }

  handleFetchPrices() {
    const from = new Date('03/16/2020').toISOString()
    const to = new Date().toISOString()
    this.fetchPrices({ from, to }).subscribe({
      next: ({ data }) => {
        data.forEach((price) => {
          this.redis.set(price.datetime_from_exchange, JSON.stringify(price))
        })
      },
      error: (error) => {
        this.logger.error(error)
      },
    })
  }

  fetchPrices(options: { from: string; to: string }): Observable<AxiosResponse<IValidatorPriceModel[]>> {
    const params = new URLSearchParams(options)
    return this.httpService.get(`${this.configService.get('VALIDATORS_APP_URL')}?${params}`, {
      headers: {
        Token: this.configService.get('VALIDATORS_APP_TOKEN'),
      },
    }) as Observable<AxiosResponse<IValidatorPriceModel[]>>
  }

  @Cron('0 10 * * *')
  async fetchPricesCron() {
    this.logger.verbose('Cron was worked!')
    this.handleFetchPrices()
  }
}

