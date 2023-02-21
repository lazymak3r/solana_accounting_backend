import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { ProfileService } from './profile.service'
import { CreateProfileDto } from './dto/create-profile.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { ProfileQueryDto } from './dto/query-profile.dto'

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @ApiOperation({ summary: 'Create profile' })
  @ApiTags('profile')
  @ApiBody({ type: CreateProfileDto })
  @Post('/')
  create(@Body() createProfileDto: CreateProfileDto) {
    return this.profileService.create(createProfileDto)
  }

  @ApiOperation({ summary: 'Get profile' })
  @Get('/')
  @ApiTags('profile')
  @ApiQuery({
    type: ProfileQueryDto,
  })
  findOne(@Query() params: ProfileQueryDto) {
    return this.profileService.findOne(+params.id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.update(+id, updateProfileDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.profileService.remove(+id)
  }
}
