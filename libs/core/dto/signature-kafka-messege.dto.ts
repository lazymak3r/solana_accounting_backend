import { CreateAccountDto } from '@app/api/src/account/dto'
import { ConfirmedSignatureInfo } from '@solana/web3.js'

export class ProcessSignatureDto {
  readonly signature: ConfirmedSignatureInfo
  readonly account: CreateAccountDto
  readonly taskId: string
  readonly userId: string
}

