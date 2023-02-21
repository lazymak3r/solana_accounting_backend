export interface ICategoryProperties {
  id: string
  label: string
  color?: string
  order?: number
  children?: ICategoryProperties[]
}
