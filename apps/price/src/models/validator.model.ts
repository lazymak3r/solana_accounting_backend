export interface IValidatorPriceModel {
  id: number
  exchange: string
  currency: string
  epoch_mainnet: number
  epoch_testnet: number
  volume: string
  datetime_from_exchange: string
  created_at: string
  updated_at: string
  average_price: string
}
