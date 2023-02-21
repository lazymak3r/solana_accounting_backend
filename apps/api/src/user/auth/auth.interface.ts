import { IUserProperties } from '../entities'

export interface IAuthResponse {
  user: IUserProperties
  token: string
}

