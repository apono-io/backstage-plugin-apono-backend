import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { AuthService, HttpAuthService, LoggerService, RootConfigService, UserInfoService } from '@backstage/backend-plugin-api';
import { CatalogApi } from '@backstage/catalog-client';
import express from 'express';
import Router from 'express-promise-router';
import jwt from 'jsonwebtoken';

export interface RouterOptions {
  logger: LoggerService;
  config: RootConfigService;
  userInfo: UserInfoService;
  httpAuth: HttpAuthService;
  auth: AuthService;
  catalog: CatalogApi;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config, httpAuth, catalog, auth, userInfo } = options;

  logger.info('Initializing apono backend')

  const router = Router();
  router.use(express.json());

  router.post('/authenticate', async (req, res) => {
    const credentials = await httpAuth.credentials(req);

    const [info, tokenRes] = await Promise.all([
      userInfo.getUserInfo(credentials),
      auth.getPluginRequestToken({
        onBehalfOf: credentials,
        targetPluginId: 'catalog',
      }),
    ]);

    const user = await catalog.getEntityByRef(info.userEntityRef, {
      token: tokenRes.token,
    });

    if (!user) {
      logger.error(`User not found: ${JSON.stringify(credentials)}`);
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const { publicKey, privateKey } = config.get<{
        publicKey: string;
        privateKey: string;
    }>('apono.certificate');

    const pky = Buffer.from(publicKey).toString('base64');

    const aponoJwtToken = await jwt.sign({ user, pky }, privateKey, { algorithm: 'RS256' });

    res.json({
      token: aponoJwtToken,
    });
  });

  const middleware = MiddlewareFactory.create({ logger, config });

  router.use(middleware.error());
  return router;
}
