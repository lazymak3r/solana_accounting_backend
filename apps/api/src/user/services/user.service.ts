import { Injectable, NotFoundException } from '@nestjs/common'
import { Neo4jService } from '@nhogs/nestjs-neo4j'
import { IUserProperties, UserEntity } from '../entities'

@Injectable()
export class UserService {
  constructor(
    private readonly neo4jService: Neo4jService,
  ) {}

  /**
   * Find user by email
   */
  async getUserByEmail(email: string): Promise<IUserProperties> {
    const session = this.neo4jService.getSession()
    try {
      const currentUser = await session.run(`MATCH (a: user {email: "${email}"}) RETURN a`)

      if (!currentUser.records[0]) {
        throw new NotFoundException(`User with email ${email} not found`)
      }

      return new UserEntity(currentUser.records[0].get('a')).toJson()
    } finally {
      session.close().then()
    }
  }

  /**
   * Find user by {publicKey}
   */
  async getUserByPublicKey(publicKey: string): Promise<IUserProperties> {
    const session = this.neo4jService.getSession()
    try {
      const currentUser = await session.run(`MATCH (a: user {publicKey: "${publicKey}"}) RETURN a`)

      if (!currentUser.records[0]) {
        throw new NotFoundException(`User with current publicKey ${publicKey} not found`)
      }

      return new UserEntity(currentUser.records[0].get('a')).toJson()
    } finally {
      session.close().then()
    }
  }
}
