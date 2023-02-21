import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { IUserProperties, User } from '../user'
import { JwtAuthGuard } from '../user/auth/guards'
import { CreateGroupDto } from './dto/create-group.dto'
import { IQueryGroupDto } from './dto/query-group.dto'
import { GroupService } from './group.service'

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) { }

  @ApiOperation({ summary: 'Get user groups' })
  @ApiTags('group')
  @UseGuards(JwtAuthGuard)
  @Get('')
  @ApiQuery({
    type: IQueryGroupDto,
  })
  getTag(@User() user: IUserProperties, @Query() params: IQueryGroupDto) {
    return this.groupService.getGroupsByUser(user, params)
  }

  @ApiOperation({ summary: 'Create group' })
  @ApiTags('group')
  @UseGuards(JwtAuthGuard)
  @Post('')
  @ApiBody({ type: CreateGroupDto })
  merge(@User() user: IUserProperties, @Body() dto: CreateGroupDto) {
    return this.groupService.mergeGroup(dto, user)
  }

  @ApiOperation({ summary: 'Update group' })
  @ApiTags('group')
  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  @ApiQuery({
    type: IQueryGroupDto,
  })
  @ApiBody({ type: CreateGroupDto })
  update(@User() user: IUserProperties, @Body() dto: CreateGroupDto, @Param() params: IQueryGroupDto) {
    return this.groupService.updateById(dto, user, params)
  }

  @ApiOperation({ summary: 'Delete group' })
  @ApiTags('group')
  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  delete(@User() user: IUserProperties, @Param('id') id: string) {
    return this.groupService.deleteById(id, user)
  }
}
