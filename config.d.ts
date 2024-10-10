import { Algorithm } from "jsonwebtoken";

export interface Config {
  apono: {
    /**
     * Public key
     * @visibility backend
     */
    publicKey: string;

    /**
     * Private key
     * @visibility secret
     */
    privateKey: string;

    /**
     * Private key
     * @visibility secret
     */
    signingAlgorithm?: Algorithm;

    /**
     * Private key
     * @visibility backend
     */
    expiresInS?: number;
  };
}
