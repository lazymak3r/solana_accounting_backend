import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../user/auth/guards'
import { IUserProperties, User } from '../user'
import { AccountService } from './account.service'
import { CreateAccountDto, GetAccountTasksDto, IQueryAccountDto } from './dto'

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @ApiOperation({ summary: 'Sync account' })
  @ApiTags('account')
  @ApiBody({ type: CreateAccountDto })
  @UseGuards(JwtAuthGuard)
  @Post('/sync')
  syncByAddress(@Body() dto: CreateAccountDto, @User() user: IUserProperties) {
    return this.accountService.syncAccountByAddress(dto, user)
  }

  @ApiOperation({ summary: 'Create account' })
  @ApiTags('account')
  @ApiBody({ type: CreateAccountDto })
  @UseGuards(JwtAuthGuard)
  @ApiQuery({
    type: IQueryAccountDto,
  })
  @Post('/')
  create(@Body() dto: CreateAccountDto, @User() user: IUserProperties, @Query() params: IQueryAccountDto) {
    return this.accountService.createAccount(dto, user, params)
  }

  @ApiOperation({ summary: 'Get mine' })
  @ApiTags('account')
  @UseGuards(JwtAuthGuard)
  @ApiQuery({
    type: IQueryAccountDto,
  })
  @Get('/')
  getMine(@User() user: IUserProperties, @Query() params: IQueryAccountDto) {
    return this.accountService.getMine(user, params)
  }

  @ApiOperation({ summary: 'create account' })
  @ApiTags('account')
  @UseGuards(JwtAuthGuard)
  @Get('/validate/exist/:address')
  validateExist(@User() user: IUserProperties, @Param('address') address: string) {
    return this.accountService.isExist(address, user)
  }

  @ApiOperation({ summary: 'update account by id' })
  @ApiTags('account')
  @ApiBody({ type: CreateAccountDto })
  @UseGuards(JwtAuthGuard)
  @ApiQuery({
    type: IQueryAccountDto,
  })
  @Put()
  update(@Body() dto: CreateAccountDto, @User() user: IUserProperties, @Query() params: IQueryAccountDto) {
    return this.accountService.updateById(dto, user, params)
  }

  @ApiOperation({ summary: 'delete account by id' })
  @ApiTags('account')
  @ApiBody({ type: CreateAccountDto })
  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  delete(@User() user: IUserProperties, @Param('id') id: string) {
    return this.accountService.deleteMine(id, user)
  }

  @ApiOperation({ summary: 'Resync account signatures' })
  @ApiTags('account')
  @ApiBody({ type: CreateAccountDto })
  @UseGuards(JwtAuthGuard)
  @Post('/resync')
  reSyncByAddress(@Body() dto: CreateAccountDto, @User() user: IUserProperties) {
    return this.accountService.reSyncAccountByAddress(dto, user)
  }

  @ApiOperation({ summary: 'get account types' })
  @ApiTags('account')
  @ApiBody({ type: CreateAccountDto })
  @UseGuards(JwtAuthGuard)
  @Get('/types')
  getTypes() {
    return this.accountService.getTypes()
  }

  @ApiOperation({ summary: 'get account tasks' })
  @ApiTags('account')
  @UseGuards(JwtAuthGuard)
  @Get('/tasks')
  getTasks(@Query() dto: GetAccountTasksDto, @User() user: IUserProperties) {
    return this.accountService.getTasks(dto, user)
  }
}
