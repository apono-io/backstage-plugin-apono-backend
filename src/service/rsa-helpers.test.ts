import { isValidBase64RSAPublicKey, isValidBase64RSAPrivateKey, doRSAKeyPairMatch } from './rsa-helpers';
import { mockConfig } from './test-helpers';

describe('RSA Key Validation', () => {
  // Valid key pairs for testing
  const invalidKey = 'invalid_base64_string';

  describe('isValidBase64RSAPublicKey', () => {
    it('should return true for a valid public key', () => {
      expect(isValidBase64RSAPublicKey(mockConfig.apono.publicKey)).toBe(true);
    });

    it('should return false for an invalid public key', () => {
      expect(isValidBase64RSAPublicKey(invalidKey)).toBe(false);
    });

    it('should return false for an empty string', () => {
      expect(isValidBase64RSAPublicKey('')).toBe(false);
    });
  });

  describe('isValidBase64RSAPrivateKey', () => {
    it('should return true for a valid private key', () => {
      expect(isValidBase64RSAPrivateKey(mockConfig.apono.privateKey)).toBe(true);
    });

    it('should return false for an invalid private key', () => {
      expect(isValidBase64RSAPrivateKey(invalidKey)).toBe(false);
    });

    it('should return false for an empty string', () => {
      expect(isValidBase64RSAPrivateKey('')).toBe(false);
    });
  });

  describe('doRSAKeyPairMatch', () => {
    it('should return true for a matching key pair', () => {
      expect(doRSAKeyPairMatch(mockConfig.apono.publicKey, mockConfig.apono.privateKey)).toBe(true);
    });

    it('should return false for mismatched keys', () => {
      const anotherValidPublicKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0m59l2u9iDnMbrXHfqkOrn2dVQ3vfBJqcDuFUK03d+1PZGbVlNCqnkpIJ8syFppW8ljnWweP7+LiWpRoz0I7fYb3d8TjhV86Y997Fl4DBrxgM6KTJOuE/uxnoDhZQ14LgOU2ckXjOzOdTsnGMKQBLCl0vpcXBtFLMaSbpv1olvBKLdtL...'; // different valid public key
      expect(doRSAKeyPairMatch(anotherValidPublicKey, mockConfig.apono.privateKey)).toBe(false);
    });

    it('should return false when either key is invalid', () => {
      expect(doRSAKeyPairMatch(invalidKey, mockConfig.apono.privateKey)).toBe(false);
      expect(doRSAKeyPairMatch(mockConfig.apono.publicKey, invalidKey)).toBe(false);
      expect(doRSAKeyPairMatch(invalidKey, invalidKey)).toBe(false);
    });
  });
});
