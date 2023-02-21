import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  Connection, Finality,
  GetVersionedTransactionConfig,
  PublicKey, SignatureStatusConfig,
  SignaturesForAddressOptions,
  TransactionSignature,
} from '@solana/web3.js'
import { chunk } from '../utils'

enum BlockchainDefaults {
  blockRange = 10000,
  signaturesLimit = 3,
  signatureStatusLimit = 256,
}

@Injectable()
export class Web3Service {
  public readonly client: Connection

  constructor(
    private readonly config: ConfigService,
  ) {
    this.client = new Connection(this.config.get('SOLANA_POOL_URL'))
  }

  /**
   * Fetch block info
   */
  async getBlock(number: number) {
    return await this.client.getBlock(number)
  }

  /**
   * Fetch block height
   */
  async getBlockHeight() {
    return await this.client.getBlockHeight()
  }

  /**
   * Fetch account and his context
   */
  async getAccountWithContext(address: string) {
    return await this.client.getAccountInfoAndContext(
      new PublicKey(address),
    )
  }

  /**
   * Fetch transaction by signature
   */
  async getTransaction(signature: string) {
    const transaction = await this.client.getTransaction(signature)
    if (!transaction) {
      console.error('Transaction not found!')
    }
    return transaction
  }

  /**
   * Fetch account by address
   */
  async getAccountInfo(address: string) {
    const account = await this.client.getAccountInfo(new PublicKey(address))

    if (!account) {
      console.error('Account not found on blockchain')
    }

    return account
  }

  /**
   * Fetch account by address
   */
  async getSignaturesForAddress(address: string, opts?: SignaturesForAddressOptions) {
    const signatures = await this.client.getSignaturesForAddress(
      new PublicKey(address),
      opts,
    )
    if (!signatures) {
      console.error('Signatures not found')
    }

    return signatures
  }

  /**
   * 1 step finding all confirmed signatures
   * 2 step finding transactions by signature
   */
  async findTransactions(signature: string) {
    const signatures = await this.client.getSignaturesForAddress(
      new PublicKey(signature),
    )

    return await Promise.all(
      signatures.map(
        async s => await this.client.getTransaction(s.signature),
      ),
    )
  }

  // /**
  //  * Store multiple blocks as graph
  //  */
  // async storeBlocks() {
  //   const currentHeight = await this.client.getBlockHeight()
  //   const offset = 0

  //   const arrayLength
  //     = Math.floor((currentHeight - offset) / BlockchainDefaults.blockRange) + 2
  //   const range = [...Array(arrayLength).keys()].map(
  //     x => x * BlockchainDefaults.blockRange + offset,
  //   )

  //   for (let i = 1; i < range.length; i++) {
  //     const blocks = await this.client.getBlocks(range[i], range[i - 1])

  //     for (let i = 0; i < blocks.length; i++) {
  //       const blockNumber = blocks[i]
  //       const currentBlock = await this.client.getBlock(blockNumber)
  //       if (currentBlock) {
  //         await this.storeBlock(currentBlock, blockNumber)
  //       }
  //     }
  //   }

  //   return { message: 'blocksStored' }
  // }

  /**
   * Fetch signature statuses chunked
   */
  async getSignatureStatuses(signatures: string[]) {
    const signaturesChunks = chunk(
      signatures,
      BlockchainDefaults.signatureStatusLimit,
    )
    const signaturesStatuses = await Promise.all(
      signaturesChunks.map(chunkSignatures =>
        this.client.getSignatureStatuses(chunkSignatures, {
          searchTransactionHistory: true,
        }),
      ),
    )

    return signaturesStatuses.map(s => s.value).flat()
  }

  /**
   * Fetch signature status
   */
  async getSignatureStatus(signature: string, config: SignatureStatusConfig) {
    return this.client.getSignatureStatus(signature, config)
  }

  /**
   * Fetch parsed transaction
   */
  async getParsedTransaction(signature: TransactionSignature,
    commitmentOrConfig?: GetVersionedTransactionConfig | Finality) {
    return this.client.getParsedTransaction(signature, commitmentOrConfig)
  }
}
