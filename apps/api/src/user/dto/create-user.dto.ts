import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNumber, IsOptional, IsString, Length } from 'class-validator'

export class CreateUserDto {
  @ApiProperty({ example: 'John@solscan.io', description: 'Personal email' })
  @IsString({ message: 'must be a string' })
  @IsEmail({}, { message: 'invalid email' })
  readonly email: string

  @ApiProperty({ example: 'agIr3-asddf-2222dd', description: 'id' })
  @IsNumber()
  @IsOptional()
  readonly id?: string

  @ApiProperty({ example: '12345', description: 'name' })
  @IsString({ message: 'must be a string' })
  readonly name: string

  @ApiProperty({ example: '12345', description: 'second name' })
  @IsString({ message: 'must be a string' })
  readonly secondName: string

  readonly roles: [string]

  @ApiProperty({ example: 'Qwerty!23', description: 'password' })
  @IsString({ message: 'must be a string' })
  @Length(4, 16, { message: 'must be 4-16 length' })
  readonly password: string
}
