import { isUint8Array } from 'util/types'
import { Injectable } from '@nestjs/common'
import { ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from 'class-validator'

@ValidatorConstraint({ name: 'isUint8Array', async: false })
@Injectable()
export class IsUint8ArrayValidator implements ValidatorConstraintInterface {
  constructor() {}

  validate(value: any) {
    // TODO uint 8 array validator
    return isUint8Array(new Uint8Array(value.data)) && value.type === 'Buffer'
  }

  defaultMessage() {
    return 'Value not uint8array'
  }
}

export function IsUint8ArrayRule(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isUint8ArrayRule',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsUint8ArrayValidator,
    })
  }
}
