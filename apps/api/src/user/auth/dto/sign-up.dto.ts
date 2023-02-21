import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class SignUpDto {
  @ApiProperty({ example: '6y2vwRHMM4Yj9LWwdsdWeAMHJ7zrYsoAcXmxtCjbbJtB', description: 'Public key' })
  @IsString({ message: 'must be a string' })
  readonly publicKey: string
}
