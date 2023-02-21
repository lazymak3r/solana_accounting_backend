import { Node } from 'neo4j-driver'
import { ICategoryProperties } from '../category.interface'

export class Category {
  id: string
  label: string
  color: string
  order?: number
  children?: Category[] = []

  constructor(private readonly node: any) {
    this.children = []

    if (this.node.properties) {
      this.id = this.node.properties.id
      this.label = this.node.properties.label
      this.color = this.node.properties.color
      this.order = this.node.properties.order
      this.node.properties.children = []
    } else {
      this.id = this.node.id
      this.label = this.node.label
      this.color = this.node.color
      this.order = this.node.order
      if (this.node?.has_category?.length) {
        this.children = node.has_category.map(_node => new Category(_node).toJson())
      }
    }
  }

  getId(): string {
    return (<Record<string, any>> this.node.properties).id
  }

  toJson(): ICategoryProperties {
    if (this.node.properties) {
      return this.node.properties as ICategoryProperties
    } else {
      const properties = { ...this, node: undefined }
      return properties as ICategoryProperties
    }
  }
}
