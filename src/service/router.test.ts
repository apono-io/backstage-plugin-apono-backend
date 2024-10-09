import { mockServices } from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createRouter } from './router';
import { BackstageCredentials, BackstageUserInfo } from '@backstage/backend-plugin-api';
import { InMemoryCatalogClient } from '@backstage/catalog-client/testUtils';

jest.mock('jsonwebtoken');

describe('createRouter', () => {
  let app: express.Express;

  const mockConfig = {
    apono: {
      certificate: {
        publicKey: 'mock-public-key',
        privateKey: 'mock-private-key',
      },
    },
  };

  const mockedServices = {
    logger: mockServices.logger.mock(),
    config: mockServices.rootConfig({ data: mockConfig }),
    httpAuth: mockServices.httpAuth.mock(),
    userInfo: mockServices.userInfo.mock(),
    catalog: new InMemoryCatalogClient({
      entities: [
        { apiVersion: 'backstage.io/v1alpha1', kind: 'User', metadata: { name: 'mockUser' } }
      ]
    }),
    auth: mockServices.auth.mock(),
  }

  beforeAll(async () => {
    const router = await createRouter(mockedServices);
    app = express().use(router);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /authenticate', () => {
    it('returns a valid token for correct credentials', async () => {
      const mockCredentials = { principal: { user: 'mockUser' } } as BackstageCredentials;
      const mockUserInfo = { userEntityRef: 'user:default/mockUser' } as BackstageUserInfo;
      const mockTokenResponse = { token: 'mockAuthToken' };

      // Mock services behavior
      mockedServices.httpAuth.credentials.mockResolvedValue(mockCredentials);
      mockedServices.userInfo.getUserInfo.mockResolvedValue(mockUserInfo);
      mockedServices.auth.getPluginRequestToken.mockResolvedValue(mockTokenResponse);
      mockedServices.catalog = new InMemoryCatalogClient({
        entities: [
          { apiVersion: 'backstage.io/v1alpha1', kind: 'User', metadata: { name: 'mockUser' } }
        ]
      });

      const mockAponoJwtToken = 'mockJwtToken';
      jest.spyOn(jwt, 'sign').mockImplementation(() => mockAponoJwtToken);

      const response = await request(app)
        .post('/authenticate')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.token).toBe(mockAponoJwtToken);
    });

    it('returns 401 when user is not found', async () => {
      const mockCredentials = { principal: { user: 'mockUser' } } as BackstageCredentials;
      const mockUserInfo = { userEntityRef: 'user:default/unExistingUser' } as BackstageUserInfo;
      const mockTokenResponse = { token: 'mockAuthToken' };

      // Mock services behavior
      mockedServices.httpAuth.credentials.mockResolvedValue(mockCredentials);
      mockedServices.userInfo.getUserInfo.mockResolvedValue(mockUserInfo);
      mockedServices.auth.getPluginRequestToken.mockResolvedValue(mockTokenResponse);

      const response = await request(app)
        .post('/authenticate')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('User not found');
    });

    it('handles errors in token generation', async () => {
      const mockCredentials = { principal: { user: 'mockUser' } } as BackstageCredentials;
      const mockUserInfo = { userEntityRef: 'user:default/mockUser' } as BackstageUserInfo;
      const mockTokenResponse = { token: 'mockAuthToken' };

      // Mock services behavior
      mockedServices.httpAuth.credentials.mockResolvedValue(mockCredentials);
      mockedServices.userInfo.getUserInfo.mockResolvedValue(mockUserInfo);
      mockedServices.auth.getPluginRequestToken.mockResolvedValue(mockTokenResponse);
      mockedServices.catalog = new InMemoryCatalogClient({
        entities: [
          { apiVersion: 'backstage.io/v1alpha1', kind: 'User', metadata: { name: 'mockUser' } }
        ]
      });

      // Simulate JWT sign error
      jest.spyOn(jwt, 'sign').mockImplementation(() => {
        throw new Error('Token generation error');
      });

      const response = await request(app)
        .post('/authenticate')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.error).toEqual({ "message": "Token generation error", "name": "Error"});
    });
  });
});
