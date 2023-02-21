import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'
// import { TagTypeEnum } from '../tag.interface'

export class CreateTagDto {
  @ApiProperty({ description: 'Tag label', example: 'account' })
  @IsString()
  readonly label: string
}

