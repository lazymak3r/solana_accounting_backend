import { IsOptional, IsString } from 'class-validator'

export class ProfileQueryDto {
  @IsString()
  @IsOptional()
  readonly id?: string
}

