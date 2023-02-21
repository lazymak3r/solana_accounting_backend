import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Neo4jService } from '@nhogs/nestjs-neo4j'
import { IUserProperties } from '../user'
import { CreateCategoryDto } from './dto/create-category.dto'
import { Category } from './entities'
import { IQueryCategoryDto } from './dto/query-category.dto'

@Injectable()
export class CategoryService {
  constructor(
    private readonly neo4jService: Neo4jService,
  ) { }

  /**
   * Create root category if not exist
   */
  async initCategories(user: IUserProperties) {
    const session = this.neo4jService.getSession({ write: true })
    try {
      const existCategories = await session.run(`
      WITH [{label: 'Cost Units', order: "1"}, {label: 'Custom', order: "2"}, { label: 'Custom', order: "3"}] AS nodes
      UNWIND nodes AS node
      WITH node, properties(node) as props
      MATCH (u: user { publicKey: "${user.publicKey}" })
      MERGE (u)-[:HAS_CATEGORY]->(c:category {order: props.order})
      ON CREATE
      SET c.id = randomUUID()
      SET c += props
      RETURN c
      ORDER by c.order`)

      if (existCategories.records.length) {
        return existCategories.records.map(category => new Category(category.get('c')).toJson())
      } else {
        return []
      }
    } finally {
      await session.close()
    }
  }

  /**
   * Create category
   */
  async createCategory(dto: CreateCategoryDto, params: IQueryCategoryDto, user: IUserProperties) {
    const session = this.neo4jService.getSession({ write: true })
    try {
      const existGroup = await session.run(`
        MATCH (n: user { publicKey: "${user.publicKey}" })-[:HAS_CATEGORY*0..5]->(c1:category { id: "${params.parentId}" })
        RETURN n,c1`)

      if (!existGroup.records.length) {
        throw new NotFoundException('Category not found or not own this user')
      }

      const newCategory = await session.run(`
      MATCH (parent: category { id: "${params.parentId}" })
      MERGE (parent)-[:HAS_CATEGORY]->(c:category {id: randomUUID()})
      ON CREATE
      SET c += $category
      RETURN c`, { category: dto })

      if (!newCategory.records.length) {
        return new ConflictException('Something went wrong, try again')
      }
      return new Category(newCategory.records[0].get('c')).toJson()
    } finally {
      await session.close()
    }
  }

  /**
   * Get user categories
   */
  async getCategoriesByUser(user: IUserProperties) {
    const session = this.neo4jService.getSession()
    try {
      const existCategories = await session.run(`
      MATCH (u: user { publicKey: "${user.publicKey}" })-[:HAS_CATEGORY]->(c1:category)
      RETURN c1`)

      if (!existCategories.records.length) {
        return await this.initCategories(user)
      }

      const data = await session.run(`
      MATCH (u: user { publicKey: "${user.publicKey}" })-[:HAS_CATEGORY]->(c1:category)
      MATCH p=(c1)-[:HAS_CATEGORY*0..5]->(m)
      WITH COLLECT(p) AS ps
      CALL apoc.convert.toTree(ps) yield value
      RETURN value
      ORDER BY value.order
      `)

      return data.records.map(category => new Category(category.get('value')).toJson())
    } finally {
      await session.close()
    }
  }

  /**
   * Delete category by id
   */
  async deleteById(user: IUserProperties, params: IQueryCategoryDto) {
    const session = this.neo4jService.getSession({ write: true })
    try {
      const existGroup = await session.run(`
      MATCH (n: user { publicKey: "${user.publicKey}" })-[:HAS_CATEGORY*0..5]->(c1:category { id: "${params.id}" })
      RETURN n,c1`)

      if (!existGroup.records.length) {
        throw new NotFoundException('Category not found or not own this user')
      }

      await session.run(`
      MATCH (u: user { publicKey: "${user.publicKey}" })-[r:HAS_CATEGORY*0..5]->(c1:category { id: "${params.id}" })
      OPTIONAL MATCH (c1)-[:HAS_CATEGORY*0..5]->(c2)
      DETACH DELETE c1,c2
      RETURN c1,c2`)

      return 200
    } finally {
      await session.close()
    }
  }

  /**
   * Update category by id
   */
  async updateById(dto: CreateCategoryDto, user: IUserProperties, params: IQueryCategoryDto) {
    const session = this.neo4jService.getSession({ write: true })
    console.log({
      dto, user, params,
    })
    try {
      const existGroup = await session.run(`
        MATCH (n: user { publicKey: "${user.publicKey}" })-[:HAS_CATEGORY*0..5]->(c1:category { id: "${params.id}" })
        RETURN n,c1`)

      if (!existGroup.records.length) {
        throw new NotFoundException('Category not found or not own this user')
      }

      const categories = await session.run(`
      MATCH (u: user { publicKey: "${user.publicKey}" })-[:HAS_CATEGORY*0..5]->(c:category { id: "${params.id}" })
      SET c+= $category
      RETURN c`, { category: dto })

      if (!categories.records.length) {
        throw new ConflictException('Something went wrong, we cant update this category')
      }
      return new Category(categories.records[0].get('c')).toJson()
    } finally {
      await session.close()
    }
  }
}
