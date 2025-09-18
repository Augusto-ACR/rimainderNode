import joi from 'joi';

export const createUser = joi.object({
  username: joi.string().required(),
  password: joi.string().required(),
});


