import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsPassword(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string) => {
    registerDecorator({
      propertyName: propertyName,
      name: 'IsPassword',
      target: object.constructor,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string) {
          return /^[\d!#$%&*@A-Z^a-z]*$/.test(value);
        },
        defaultMessage() {
          return `$property is invalid`;
        },
      },
    });
  };
}
