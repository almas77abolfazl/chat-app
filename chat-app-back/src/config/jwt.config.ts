export default () => ({
  jwtSecret: process.env.JWT_SECRET || '1n8c6@zaldjk#5%!2asd$',
  jwtExpiresIn: '60m',
});
