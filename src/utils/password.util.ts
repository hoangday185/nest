import argon2 from 'argon2';

export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await argon2.hash(password);
  } catch (error) {
    console.log(error);
    throw new Error('Can not hash password');
  }
};

export const verifyPassword = async (
  hashPassword: string,
  password: string,
): Promise<boolean> => {
  try {
    return await argon2.verify(hashPassword, password);
  } catch (error) {
    console.log(error);
    return false;
  }
};
