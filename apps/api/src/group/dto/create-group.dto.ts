import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'
// import { GroupTypeEnum } from '../group.interface'

export class CreateGroupDto {
  @ApiProperty({ description: 'Group label', example: 'account' })
  @IsString()
  readonly label: string
}

