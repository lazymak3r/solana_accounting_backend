import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export enum ProfileFormTypes {
  fullName = 'fullName',
  country = 'country',
  timeZone = 'timeZone',
  timeFormat = 'timeFormat',
}

export class CreateProfileDto {
  @ApiProperty({
    type: String,
  })
  @IsOptional()
  @IsString()
  [ProfileFormTypes.fullName]: string

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  @IsString()
  [ProfileFormTypes.country]: string

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  @IsString()
  [ProfileFormTypes.timeZone]: string

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  @IsString()
  [ProfileFormTypes.timeFormat]: string
}
