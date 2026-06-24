import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';

// Esporta il middleware di autenticazione che verrà utilizzato
// nelle rotte protette dell'applicazione.
export const checkJwt = expressjwt({

  // Definisce il metodo utilizzato per ottenere la chiave pubblica
  // necessaria a verificare la firma digitale del token JWT.
  secret: jwksRsa.expressJwtSecret({

    // Memorizza le chiavi pubbliche in cache per evitare
    // richieste ripetute al server Keycloak.
    cache: true,

    // Abilita un limite al numero di richieste effettuate
    // verso l'endpoint delle chiavi pubbliche.
    rateLimit: true,

    // Numero massimo di richieste consentite ogni minuto
    // verso il servizio JWKS.
    jwksRequestsPerMinute: 5,

    // Endpoint pubblico di Keycloak che espone le chiavi
    // utilizzate per firmare i token JWT.
    jwksUri: 'http://localhost:8080/realms/tesi-realm/protocol/openid-connect/certs'
  }),

  // Verifica che il campo "iss" (issuer) contenuto nel token
  // corrisponda esattamente al realm che deve aver emesso il token.
  issuer: 'http://localhost:8080/realms/tesi-realm',

  // Specifica che il token deve essere firmato utilizzando
  // l'algoritmo crittografico RS256.
  algorithms: ['RS256']
});