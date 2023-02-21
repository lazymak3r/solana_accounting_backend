import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../user/auth/guards'
import { IUserProperties, User } from '../user'
import { CreateAddressBookDto } from './dto'
import { AddressBookService } from './address-book.service'
import { IQueryAddressBookDto } from './dto/query-address-book.dto'

@Controller('address-book')
export class AddressBookController {
  constructor(private readonly addressBookService: AddressBookService) {}

  @ApiOperation({ summary: 'Add address book to Account Node' })
  @ApiTags('address-book')
  @ApiBody({ type: CreateAddressBookDto })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiQuery({
    type: IQueryAddressBookDto,
  })
  @Post('/')
  createAddressBook(@Body() body: CreateAddressBookDto, @User() user: IUserProperties, @Query() params: IQueryAddressBookDto) {
    return this.addressBookService.createAddressBook(body, params, user)
  }

  @ApiOperation({ summary: 'Get current user address books' })
  @ApiTags('address-book')
  @UseGuards(JwtAuthGuard)
  @ApiQuery({
    type: IQueryAddressBookDto,
  })
  @Get('/')
  getMine(@User() user: IUserProperties, @Query() params: IQueryAddressBookDto) {
    return this.addressBookService.getMine(user, params)
  }

  // @ApiOperation({ summary: 'Get current user address book by id' })
  // @ApiTags('address-book')
  // @UseGuards(JwtAuthGuard)
  // @Get('/:id')
  // getMineById(@Param('id') id: string, @User() user: IUserProperties) {
  //   return this.addressBookService.getMineById(id, user)
  // }

  @ApiOperation({ summary: 'Update address book' })
  @ApiTags('address-book')
  @UseGuards(JwtAuthGuard)
  @Put('/')
  updateById(@Body() body: CreateAddressBookDto, @Query() params: IQueryAddressBookDto, @User() user: IUserProperties) {
    return this.addressBookService.updateById(body, params, user)
  }

  @ApiOperation({ summary: 'Delete address book' })
  @ApiTags('address-book')
  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  deleteById(@Param('id') id: string, @User() user: IUserProperties) {
    return this.addressBookService.deleteById(id, user)
  }
}

