import { Injectable } from '@nestjs/common'
import { ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from 'class-validator'
import { PublicKey } from '@solana/web3.js'

@ValidatorConstraint({ name: 'isPublicKey', async: false })
@Injectable()
export class IsPublicKeyValidator implements ValidatorConstraintInterface {
  constructor() {}

  validate(value: any) {
    try {
      PublicKey.isOnCurve(value)
      return true
    } catch (error) {
      return false
    }
  }

  defaultMessage() {
    return 'Address is not valid'
  }
}

export function IsPublicKeyRule(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isPublicKeyRule',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsPublicKeyValidator,
    })
  }
}
