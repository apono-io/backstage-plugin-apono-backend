import { mockServices } from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createRouter } from './router';
import { BackstageCredentials, BackstageUserInfo } from '@backstage/backend-plugin-api';
import { InMemoryCatalogClient } from '@backstage/catalog-client/testUtils';

// jest.mock('jsonwebtoken');

describe('createRouter', () => {
  let app: express.Express;

  const mockConfig = {
    apono: {
      publicKey: 'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF5UnRmbUZCdGhSQlpteVFoVDl4UgpDem5zLzJmWEJkZVI2WUlIUksxWDNPKzV3SDBkRkROaVVrR1NHQmJMTi9GT29kUFNPME5YNzdtOVc3ays0ck9nCkpmelo4bUVDSDVUZlZEODBmL0ptTmNHaVk5Zi9lWmZRWGhSZ0lFVU5sVU9HYUFONWhxSVp1YTBnMU1SSjNjNUoKVnA2SmNONWIvb2RFcG8rdVBxMVZOcFFNVkh3VWhmc1BEcm1kKzh4S3hmVDFHNDVWbjhseDd6THhzbHFhQzVkYQpwM2xmdTlZcSt5SlBxOVI4QUN4OGZlMzNkRThEeitOVS9SampJZkxVVklrclBJRVoyUVZqdk1mck1GL2JIempWCmcrZTlZNDN5WUdVbWJiTU1jdk1CUFZJWjMzUzVmQ0xoeFFvejJUWWZ0eGtGT1pkdk5NWTZnTFVNbnc0MXhJQjEKUXdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t',
      privateKey: 'LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcEFJQkFBS0NBUUVBeVJ0Zm1GQnRoUkJabXlRaFQ5eFJDem5zLzJmWEJkZVI2WUlIUksxWDNPKzV3SDBkCkZETmlVa0dTR0JiTE4vRk9vZFBTTzBOWDc3bTlXN2srNHJPZ0pmelo4bUVDSDVUZlZEODBmL0ptTmNHaVk5Zi8KZVpmUVhoUmdJRVVObFVPR2FBTjVocUladWEwZzFNUkozYzVKVnA2SmNONWIvb2RFcG8rdVBxMVZOcFFNVkh3VQpoZnNQRHJtZCs4eEt4ZlQxRzQ1Vm44bHg3ekx4c2xxYUM1ZGFwM2xmdTlZcSt5SlBxOVI4QUN4OGZlMzNkRThECnorTlUvUmpqSWZMVVZJa3JQSUVaMlFWanZNZnJNRi9iSHpqVmcrZTlZNDN5WUdVbWJiTU1jdk1CUFZJWjMzUzUKZkNMaHhRb3oyVFlmdHhrRk9aZHZOTVk2Z0xVTW53NDF4SUIxUXdJREFRQUJBb0lCQUhTTi85NklKcUZyTTNPKwpBZXlHRlJaN2tRY0p5TTVpL1BjbjNFeUtacFR1LzJvM1dRWWZMY25jcE81L0wzS1IwVy9yRXpvenNxQ0d0dCtWClFvUWpkUnJ2SytYVklXVHFaSEV3WEo0Vy8vUUI4THNMTWM3b0ZPU2h6SUNIWlBMd2V0S0h5UVFscU9FN0hQOFQKY0hnMEdiOHhEUmswVm43ektPK2I4SEgxQmFFbUxoWU1MdVlmSkovdzA4cFdxRkcvaVZBOEYyZ2xsbUdvVnMrQwpmU253ZkJ5NkNkeTlLSS9wc0prSStzVFhvdW50aUhTTkpmMkFiODJTRTErM0hSZnc1dFFCZXNvYS9DSW5vMmRMCkM4K1REQ1pSMkM3NmtWZmZMWFM4OTdBazY0NEQ4bXloaS9QdTdGY3p5MnJlNGo3Y002cnlydTFYK1BRM3hPeCsKU3JLNWpRa0NnWUVBL3pxU0dIa0lmT2w2NlNHMVY0c05CLzZPdHdFY1VJTU5RTXU3bHlpNlIweC9rVG80U2I5MgpLaG5UMDlEQ2haa2NOVmQxWC83NXovazlidjdUYUxoWExHSkFHc0JzTFhzM3BqdWRyTzNPcVQwNXlOSG1KaHo3CllDd3JsR1pRcTk0Y2I4YWV0QjN2NjN3cGVyNXFSTzJ0S1ZmaUY0VDJzTU5Db0FIeHIwelR4L1VDZ1lFQXliYnYKK0UwWTQ0QnlGaEVGOE9ieEdVZjJYa0pqTU5XNDVLRmFoZVkrRytac0pQWEFSWEtTMlVBQ0lLbE82WXVNQkxPdwoybmNXVkxKdFZwZFFpUFNCOXltNmJGRjZSL2V1eWxoV1BhMVNQQjU0TlZWY3hJUXFqV2ZsZGNwdVh3ZlM4VnFICmxCMXFtUVNITEZNbGJ1eUJpWmYvdVhSM2lLSW5CSTRuZTZTbDNWY0NnWUVBZ3ZFeXVQbUhnRVpzOTZTQ20rcE0KQWpqNFVTMXhzR0M3OE8xVlRjVG9aT0g3WksvQTV4MGlhNUVhbTBZME5rU0tNMWV1Y1ZTb0o2b1FlWnlsSzhtLwpkNWJrbXBUMEt4VlhSS0s3VDFnbU9hK2VzTWYzVXNCMXV5Nk9JVEdvMjdRMVZLZExEczk1SXBCdDIzcExuUmR2ClNwRzYvaVFLU0QrMU05QXJoYXRkeiswQ2dZQlRFeXVydUp6cWZXai9HNDIxMUhjeGNValBNMHBFdjVEQllJNjIKbk1leGwrbXNJeVpIczlNMDlENnNFdTYwRXN2YzErQ2JhUFppZFlYQVp0czlQRzRXVERKQ0VDQnJhVitzYUV0RQpaWkI3d0JURDZsOGxkRVZPTFo3OEx4M2J0NDR4NXBYMTgxT0dwNjNBSEpKTEo4NkZ5M3IvZHk4UHI3Q2dHS2U4CkxXZytTd0tCZ1FEeHNiRXFiVFBDcjliby84U3hxekpEenVpOU80c2JSREtFUjArK0NjUHVRZkJ6RUVJY25GZVUKL2ZUOS9FTmlhckhKdUUraUNCYmx3RmNXbUlNa21GZmxXcE5FWHNTQWNrdE9ETERDOVVOV2dhNmR0ZEh0NkpaUQppSDZJZU9LYnBwZVRVUmdua2RGaE4vZHNtcXhYb3daU3RvRnJkZDJYM3I0Vjk4cDhFcjQ2Ymc9PQotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQ',
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

      // const mockAponoJwtToken = 'mockJwtToken';
      // jest.spyOn(jwt, 'sign').mockImplementation(() => mockAponoJwtToken);

      const response = await request(app)
        .post('/authenticate')
        .send({});

      console.log(response.body);

      expect(response.status).toBe(200);
      // expect(response.body.token).toBe(mockAponoJwtToken);
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
