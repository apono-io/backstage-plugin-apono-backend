import {
  BackendFeature,
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter, EmailExtractor } from './service/router';
import { CatalogClient } from '@backstage/catalog-client';

export interface PluginOptions {
  getEmail?: EmailExtractor;
}

/**
 * aponoBePlugin backend plugin
 *
 * @public
 */
export const aponoPlugin = (options: PluginOptions = {}): BackendFeature => {
  return createBackendPlugin({
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
              auth,
              getEmail: options.getEmail,
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
}

export const aponoBePlugin = aponoPlugin();
