import { Body, Controller, Delete, Get, Post, Put, Query, UseGuards } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { IUserProperties, User } from '../user'
import { JwtAuthGuard } from '../user/auth/guards'
import { CreateCategoryDto } from './dto/create-category.dto'
import { IQueryCategoryDto } from './dto/query-category.dto'
import { CategoryService } from './category.service'

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  @ApiOperation({ summary: 'Update category' })
  @ApiTags('category')
  @UseGuards(JwtAuthGuard)
  @Put('')
  @ApiQuery({
    type: IQueryCategoryDto,
  })
  @ApiBody({ type: CreateCategoryDto })
  update(@User() user: IUserProperties, @Body() dto: CreateCategoryDto, @Query() params: IQueryCategoryDto) {
    return this.categoryService.updateById(dto, user, params)
  }

  @ApiOperation({ summary: 'Create category' })
  @ApiTags('category')
  @UseGuards(JwtAuthGuard)
  @Post('')
  @ApiQuery({
    type: IQueryCategoryDto,
  })
  @ApiBody({ type: CreateCategoryDto })
  create(@User() user: IUserProperties, @Query() params: IQueryCategoryDto, @Body() dto: CreateCategoryDto) {
    return this.categoryService.createCategory(dto, params, user)
  }

  @ApiOperation({ summary: 'Delete categories' })
  @ApiTags('category')
  @UseGuards(JwtAuthGuard)
  @ApiQuery({
    type: IQueryCategoryDto,
  })
  @Delete('')
  delete(@User() user: IUserProperties, @Query() params: IQueryCategoryDto) {
    return this.categoryService.deleteById(user, params)
  }

  @ApiOperation({ summary: 'Get categories by user' })
  @ApiTags('category')
  @UseGuards(JwtAuthGuard)
  @Get('')
  getCategoriesByUser(@User() user: IUserProperties) {
    return this.categoryService.getCategoriesByUser(user)
  }
}
