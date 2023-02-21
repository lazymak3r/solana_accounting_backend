import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { IUserProperties, User } from '../user'
import { JwtAuthGuard } from '../user/auth/guards'
import { CreateTagDto } from './dto/create-tag.dto'
import { IQueryTagDto } from './dto/query-tag.dto'
import { TagService } from './tag.service'

@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) { }

  @ApiOperation({ summary: 'Get user tags' })
  @ApiTags('tag')
  @UseGuards(JwtAuthGuard)
  @Get('')
  @ApiQuery({
    type: IQueryTagDto,
  })
  getTag(@User() user: IUserProperties, @Query() params: IQueryTagDto) {
    return this.tagService.getTagsByUser(user, params)
  }

  @ApiOperation({ summary: 'Get user tags collection' })
  @ApiTags('tag')
  @UseGuards(JwtAuthGuard)
  @Get('/collection/')
  getTagCollection(@User() user: IUserProperties) {
    return this.tagService.getTagCollectionByUser(user)
  }

  @ApiOperation({ summary: 'Create tag' })
  @ApiTags('tag')
  @UseGuards(JwtAuthGuard)
  @Post('')
  @ApiBody({ type: CreateTagDto })
  merge(@Body() dto: CreateTagDto) {
    return this.tagService.mergeTag(dto)
  }
}
