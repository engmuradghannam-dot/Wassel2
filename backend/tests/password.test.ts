import { hashPassword, comparePassword } from '../src/utils/password';

describe('password utils', () => {
  it('hashes a password and verifies it correctly', async () => {
    const hash = await hashPassword('S3cure!Pass');
    expect(hash).not.toBe('S3cure!Pass');
    await expect(comparePassword('S3cure!Pass', hash)).resolves.toBe(true);
    await expect(comparePassword('wrong-password', hash)).resolves.toBe(false);
  });
});
