export interface IAccountProperties {
  id: string
  address: string
  type: AccountTypeEnum
  me: boolean
  displayName?: string
}

export enum AccountTypeEnum {
  'Account' = 'Account',
  'DeFi Account' = 'DeFi Account',
  'Validator Account' = 'Validator Account',
  'Token account' = 'Token account',
}

export interface IAccountTypeProperties {
  type: AccountTypeEnum
}
