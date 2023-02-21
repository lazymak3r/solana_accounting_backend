import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category label', example: 'account' })
  @IsString()
  readonly label: string

  @ApiProperty({ description: 'Category color. Any css color', example: 'account' })
  @IsString()
  readonly color: string
}
