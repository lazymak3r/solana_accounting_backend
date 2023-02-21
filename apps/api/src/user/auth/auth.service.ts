import { randomUUID } from 'crypto'
import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Neo4jService } from '@nhogs/nestjs-neo4j'
import { PublicKey } from '@solana/web3.js'
import * as nacl from 'tweetnacl'
import { utils } from '../../../../../libs/core'
import { IUserProperties } from '../entities'
import { UserService } from '../services'
import { SignInDto } from './dto'
import { IAuthResponse } from './auth.interface'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly neo4jService: Neo4jService,
    // private readonly configService: ConfigService,
  ) { }

  /**
   * Create user if not exist and approve his signature
   */
  async signIn(payload: SignInDto): Promise<IAuthResponse> {
    const session = this.neo4jService.getSession({ write: true })
    try {
      const result = await session.run(`MATCH (n:user {publicKey :"${payload.publicKey}"}) RETURN n`)
      if (!result.records.length) {
        const id = randomUUID()
        await session.run(`
          CREATE (n: user {
            id: $id,
            publicKey: $publicKey
          })
          RETURN n
        `, {
          ...payload,
          id,
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      await session.close()
    }
    const user = await this.validateUser(payload)
    const token = this.generateToken(user)
    return { user, token }
  }

  generateToken(payload: IUserProperties) {
    return this.jwtService.sign(payload)
  }

  private async validateUser({ message, signature, publicKey }: SignInDto) {
    const user = await this.userService.getUserByPublicKey(publicKey)
    const messageBytes = utils.stringToUint8Array(message)

    if (nacl.sign.detached.verify(
      messageBytes,
      Buffer.from(signature, 'base64'),
      new PublicKey(publicKey).toBytes(),
    )) {
      return user
    }
  }
}
