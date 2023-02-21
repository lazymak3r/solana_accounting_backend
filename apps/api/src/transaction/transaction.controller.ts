import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { TransactionService } from '../../../../libs/main/src/index'
import { FindTransactionsDto, SyncAccountTransactionsDto } from '../../src/transaction/dto'
import { JwtAuthGuard } from '../../src/user/auth/guards'
import { IUserProperties, User } from '../../src/user'

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) { }

  @ApiOperation({ summary: 'Get transactions' })
  @ApiTags('transactions')
  @UseGuards(JwtAuthGuard)
  @Get()
  findTransactions(@Query() data: FindTransactionsDto, @User() user: IUserProperties) {
    return this.transactionService.findTransactions(data, user)
  }

  @ApiOperation({ summary: 'Add transaction' })
  @ApiTags('transactions')
  @UseGuards(JwtAuthGuard)
  @Post('store')
  storeTransaction(@Query('signature') signature: string) {
    return this.transactionService.storeTransaction(signature)
  }

  @ApiOperation({ summary: 'Get transactions' })
  @ApiTags('transactions')
  @UseGuards(JwtAuthGuard)
  @Post('sync')
  syncAccountTransactions(@Query() data: SyncAccountTransactionsDto) {
    return this.transactionService.syncAccountTransactions(data)
  }
}
