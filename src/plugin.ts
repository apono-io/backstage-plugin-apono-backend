import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './service/router';
import { CatalogClient } from '@backstage/catalog-client';

/**
 * aponoBePlugin backend plugin
 *
 * @public
 */
export const aponoBePlugin = createBackendPlugin({
  pluginId: 'apono',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        httpAuth: coreServices.httpAuth,
        userInfo: coreServices.userInfo,
        discovery: coreServices.discovery,
        auth: coreServices.auth,
      },
      async init({
        httpRouter,
        logger,
        config,
        httpAuth,
        userInfo,
        discovery,
        auth
      }) {
        const catalog = new CatalogClient({ discoveryApi: discovery });
        httpRouter.use(
          await createRouter({
            logger,
            config,
            httpAuth,
            userInfo,
            catalog,
            auth
          }),
        );
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
