# Apono backend plugin for Backstage

Welcome to the apono backend plugin! This plugin is a part of the apono project.

## Getting started

### Enabling backend

#### New backend

```sh
yarn --cwd packages/backend add @apono-io/backstage-plugin-apono-backend
```

Add to `packages/backend/src/index.ts`:

```ts
backend.add(import('@apono-io/backstage-plugin-apono-backend'));
```

Now go to the configuration step.

#### Old backend

```bash
yarn --cwd packages/backend add @apono-io/backstage-plugin-apono-backend
```

Create a new file named `packages/backend/src/plugins/apono.ts`, and add the following to it:

```ts
import { createRouter } from '@apono-io/backstage-plugin-apono-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin({
  logger,
  config,
}: PluginEnvironment): Promise<Router> {
  return await createRouter({ logger, config });
}
```

And finally, wire this into the overall backend router. Edit `packages/backend/src/index.ts`:

```ts
import apono from './plugins/apono';
// ...
async function main() {
  // ...
  const aponoEnv = useHotMemoize(module, () => createEnv('apono'));
  apiRouter.use('/apono', await apono(aponoEnv));
}
```

## Configuration

The plugin requires configuration in the Backstage `app-config.yaml` to connect to the Apono API.

```yaml
apono:
  publicKey: ${APONO_PUBLIC_KEY} # Base64 encoded RSA public key with minimum 2048 bits length
  privateKey: ${APONO_PRIVATE_KEY} # Base64 encoded RSA private key with minimum 2048 bits length
```

## Contributing

Everyone is welcome to contribute to this repository. Feel free to raise [issues](https://github.com/apono-io/backstage-plugin-apono-backend/issues) or to submit [Pull Requests.](https://github.com/apono-io/backstage-plugin-apono-backend/pulls)
