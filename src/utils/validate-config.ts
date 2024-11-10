import { ClassConstructor, plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';

function validateConfig<T extends object>(
  config: Record<string, unknown>,
  envVariablesClass: ClassConstructor<T>,
) {
  //chuyển đổi thành object thành class để validate
  const validatedConfig = plainToClass(envVariablesClass, config, {
    enableImplicitConversion: true,
  });
  //chạy hàm validate
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  //check lỗi
  if (errors.length > 0) {
    const errorsMsg = errors
      .map(
        (error) =>
          `\nError in ${error.property}:\n` +
          Object.entries(error.constraints)
            .map(([key, value]) => `+ ${key}: ${value}`)
            .join('\n'),
      )
      .join('\n');

    console.error(`\n${errorsMsg.toString()}`);
    throw new Error(errorsMsg);
  }
  //nếu pass validate thì sẽ trả về object ban đầu
  return validateConfig;
}

export default validateConfig;
