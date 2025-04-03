import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { AuthService, HttpAuthService, LoggerService, RootConfigService, UserInfoService } from '@backstage/backend-plugin-api';
import { CatalogApi } from '@backstage/catalog-client';
import express from 'express';
import Router from 'express-promise-router';
import jwt, { Algorithm } from 'jsonwebtoken';
import { isValidBase64RSAPublicKey, isValidBase64RSAPrivateKey, doRSAKeyPairMatch } from './rsa-helpers';
import pkj from '../../package.json';

export type EmailExtractor = (req: express.Request) => Promise<string | undefined>;

export interface RouterOptions {
  logger: LoggerService;
  config: RootConfigService;
  userInfo: UserInfoService;
  httpAuth: HttpAuthService;
  auth: AuthService;
  catalog: CatalogApi;
  getEmail?: EmailExtractor;
}

interface AponoConfig {
  publicKey: string;
  privateKey: string;
  signingAlgorithm: Algorithm;
  expiresInS: number | string;
}

const DEFAULT_EXPIRES_IN = '24h';
const DEFAULT_ALGORITHM: Algorithm = 'RS256';

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

const getAponoConfig = (config: RootConfigService): AponoConfig => {
  const publicKey = config.getString('apono.publicKey');
  const privateKey = config.getString('apono.privateKey');
  const signingAlgorithm = config.getOptionalString('apono.signingAlgorithm') as Algorithm || DEFAULT_ALGORITHM;
  const expiresInS = config.getOptional<number | string>('apono.expiresInS') || DEFAULT_EXPIRES_IN;

  if (!isValidBase64RSAPublicKey(publicKey)) {
    throw new ConfigurationError('Invalid public key');
  }

  if (!isValidBase64RSAPrivateKey(privateKey)) {
    throw new ConfigurationError('Invalid private key');
  }

  if (!doRSAKeyPairMatch(publicKey, privateKey)) {
    throw new ConfigurationError('Public and private keys do not match');
  }

  return { publicKey, privateKey, signingAlgorithm, expiresInS };
};

const createAuthenticationHandler = (options: RouterOptions, aponoConfig: AponoConfig) => {
  const { logger, httpAuth, userInfo, auth, catalog, getEmail } = options;
  const { publicKey, privateKey, signingAlgorithm, expiresInS } = aponoConfig;

  return async (req: express.Request, res: express.Response) => {
    try {
      const credentials = await httpAuth.credentials(req);

      const [info, tokenRes] = await Promise.all([
        userInfo.getUserInfo(credentials),
        auth.getPluginRequestToken({
          onBehalfOf: credentials,
          targetPluginId: 'catalog',
        }),
      ]);

      let email: string | undefined;
      if (getEmail) {
        logger.debug('Extracting email from request');
        email = await getEmail(req);
      } else if (req.body?.email) {
        logger.debug('Extracting email from request body');
        email = req.body.email;
      }

      let user;
      if (!email) {
        logger.debug('Fetching user from catalog');
        user = await catalog.getEntityByRef(info.userEntityRef, {
          token: tokenRes.token,
        });
      } else {
        user = {
          spec: {
            profile: {
              email,
            }
          }
        };
      }

      const privateKeyDecoded = Buffer.from(privateKey, 'base64').toString('utf-8');

      const frontendPluginVersion = req.header('x-backstage-plugin-version');

      const aponoJwtToken = jwt.sign({
        issuer: 'backstage',
        // Backstage Plugin Version
        backend_plugin_version: pkj?.version || 'unknown',
        frontend_plugin_version: frontendPluginVersion || 'unknown',
        user,
        pky: publicKey
      }, privateKeyDecoded, {
        algorithm: signingAlgorithm,
        expiresIn: expiresInS,
      });

      res.json({ token: aponoJwtToken, profileEmail: email });
    } catch (error) {
      if (error instanceof Error) logger.error('Authentication error', error);
      res.status(500).json({ message: 'Failed to authenticate user', error: error });
    }
  };
};

export async function createRouter(options: RouterOptions): Promise<express.Router> {
  const { logger, config } = options;

  logger.info('Initializing apono backend');

  let aponoConfig: AponoConfig;
  try {
    aponoConfig = getAponoConfig(config);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      logger.error('Configuration error', error);
      throw error;
    }
    if (error instanceof Error) logger.error('Authentication error', error);
    throw new Error('Failed to initialize Apono backend');
  }

  const router = Router();
  router.use(express.json());

  router.post('/authenticate', createAuthenticationHandler(options, aponoConfig));

  const errorHandler = MiddlewareFactory.create({ logger, config }).error();
  router.use(errorHandler);

  return router;
}
