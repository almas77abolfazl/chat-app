import { randomBytes } from 'crypto';

export default () => {
  let jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'JWT_SECRET must be set. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      );
    }
    // ephemeral development secret: tokens are invalidated on every restart
    jwtSecret = randomBytes(32).toString('hex');
  }

  return {
    jwtSecret,
    jwtExpiresIn: '60m',
  };
};
