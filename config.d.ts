export interface Config {
  apono: {
    /**
     * Certificate, used for signing apono tokens
     */
    certificate: {
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
    }
  };
}
