import { createPublicKey, createPrivateKey, KeyObject } from 'crypto';

type KeyType = 'PUBLIC' | 'PRIVATE';

const KEY_HEADERS: Record<KeyType, string> = {
  PUBLIC: '-----BEGIN PUBLIC KEY-----',
  PRIVATE: '-----BEGIN PRIVATE KEY-----'
};

const KEY_FOOTERS: Record<KeyType, string> = {
  PUBLIC: '-----END PUBLIC KEY-----',
  PRIVATE: '-----END PRIVATE KEY-----'
};

const ensurePemFormat = (key: string, type: KeyType): string => {
  const lines = key.split('\n').map(line => line.trim()).filter(Boolean);
  const header = KEY_HEADERS[type];
  const footer = KEY_FOOTERS[type];

  if (lines[0] === header && lines[lines.length - 1] === footer) {
    return key;
  }

  return `${header}\n${lines.join('\n')}\n${footer}`;
};

const decodeBase64 = (base64: string): string => {
  try {
    return Buffer.from(base64, 'base64').toString('ascii');
  } catch {
    throw new Error('Invalid base64 string');
  }
};

const createKeyObject = (key: string, type: KeyType): KeyObject => {
  const pemKey = ensurePemFormat(decodeBase64(key), type);
  return type === 'PUBLIC'
    ? createPublicKey({ key: pemKey, format: 'pem' })
    : createPrivateKey({ key: pemKey, format: 'pem' });
};

const validateKeyDetails = (keyObject: KeyObject): boolean => {
  const { modulusLength, publicExponent } = keyObject.asymmetricKeyDetails ?? {};
  return (modulusLength ?? 0) >= 2048 && publicExponent === 65537n;
};

const isValidBase64RSAKey = (base64Key: string, type: KeyType): boolean => {
  try {
    const keyObject = createKeyObject(base64Key, type);
    return validateKeyDetails(keyObject);
  } catch (error) {
    return false;
  }
};

export const isValidBase64RSAPublicKey = (base64Key: string): boolean =>
  isValidBase64RSAKey(base64Key, 'PUBLIC');

export const isValidBase64RSAPrivateKey = (base64Key: string): boolean =>
  isValidBase64RSAKey(base64Key, 'PRIVATE');

export const doRSAKeyPairMatch = (base64PublicKey: string, base64PrivateKey: string): boolean => {
  try {
    const publicKey = createKeyObject(base64PublicKey, 'PUBLIC');
    const privateKey = createKeyObject(base64PrivateKey, 'PRIVATE');
    const derivedPublicKey = createPublicKey(privateKey);

    const exportedPublicKey = publicKey.export({ format: 'pem', type: 'spki' });
    const exportedDerivedPublicKey = derivedPublicKey.export({ format: 'pem', type: 'spki' });

    return exportedPublicKey === exportedDerivedPublicKey;
  } catch (error) {
    return false;
  }
};
