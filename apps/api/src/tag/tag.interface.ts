export interface ITagProperties {
  id: string
  name: string
}

export interface ITagCollection {
  [label: string]: ITagProperties[]
}
