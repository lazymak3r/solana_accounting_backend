import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'
import { IsUint8ArrayRule } from '@lib/core'

export class SignInDto {
  @ApiProperty({ example: '6y2vwRHMM4Yj9LWwdsdWeAMHJ7zrYsoAcXmxtCjbbJtB', description: 'Public key' })
  @IsString({ message: 'must be a string' })
  readonly publicKey: string

  @ApiProperty({ example: '6y2vwRHMM4Yj9LWwdsdWeAMHJ7zrYsoAcXmxtCjbbJtB', description: 'Base64 signature and message' })
  @IsString()
  readonly signature: string

  @ApiProperty({ example: 'Please confirm your auth', description: 'message' })
  @IsString({ message: 'must be a string' })
  readonly message: string
}
