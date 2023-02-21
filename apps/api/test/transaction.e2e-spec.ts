import { Test, TestingModule } from '@nestjs/testing'
import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { Neo4jService } from '@nhogs/nestjs-neo4j'
import { AppModule } from '../src/module'

async function cleanDb(neo4jService: Neo4jService) {
  await neo4jService.run(
    { cypher: 'MATCH (n) DETACH DELETE n' },
    {
      write: true,
    },
  )
}

describe('TransactionController (e2e)', () => {
  let app: INestApplication
  let token = null
  let neo4jService = null
  const publicKey = 'AtDbHfn4cc5K1ZFaLUAVzL5kkgNgokbf8HGZw1LM9Lfm'
  const invalidSignature = '123123123'
  const validSignature = 'Ee4uVnjZovHCa9CGiLnhrF2o4VnG2UJWCfkzGi7z3hfjPL8WtKdXoQ5MvTHE6Cm8XcnaGUAzDeHFquV8odGKKvx'

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    neo4jService = app.get(Neo4jService)
    await app.init()

    const data = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        publicKey,
        message: 'Sign this message for authenticating with your wallet.\nSecurity Nonce: afc275da-6fbe-4a3b-a6d0-f1c332355856',
        signature: 'RpiM7gxOwjPD8WJdIg26UtQ+KNOuJb/GtUteT3tQdO/FeJtrHqEmOBj8IRea24qVTpU+65O0xaFNsg5qCHfuBw==',
      })
      .expect(HttpStatus.CREATED)
    token = data.body.token
  }, 20000)

  afterAll(async () => {
    await cleanDb(neo4jService)
    return await app.close()
  })

  it('/transaction/store (POST) [success]', () => {
    return request(app.getHttpServer())
      .post('/transaction/store')
      .auth(token, { type: 'bearer' })
      .query({ signature: validSignature })
      .expect(HttpStatus.CREATED)
  }, 20000)

  it('/transaction/store (POST) [fail]', () => {
    return request(app.getHttpServer())
      .post('/transaction/store')
      .auth(token, { type: 'bearer' })
      .query({ signature: invalidSignature })
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
  }, 20000)

  it('/transaction (GET) [success]', () => {
    return request(app.getHttpServer())
      .get('/transaction')
      .auth(token, { type: 'bearer' })
      .query({
        startDate: '2022-06-22',
        endDate: '2022-06-22',
      })
      .expect(HttpStatus.OK)
  })

  it('/transaction/sync (POST) [success]', () => {
    return request(app.getHttpServer())
      .post('/transaction/sync')
      .auth(token, { type: 'bearer' })
      .query({ account: '8YghoouZpkbjdnE2ebs18ka9HkFkrmmZdSZo77DNmxCq', limit: 1 })
      .expect(HttpStatus.CREATED)
  }, 20000)
})
