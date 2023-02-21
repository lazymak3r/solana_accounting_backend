import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { IUserProperties, User } from '../user'
import { JwtAuthGuard } from '../user/auth/guards'
import { TaskService } from './task.service'

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) { }

  @ApiOperation({ summary: 'Get current sync progress' })
  @ApiTags('task')
  @UseGuards(JwtAuthGuard)
  @Get('progress')
  getTask(@User() user: IUserProperties) {
    return this.taskService.getProgress(user)
  }
}
