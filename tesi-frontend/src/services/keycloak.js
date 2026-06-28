import Keycloak from 'keycloak-js';

// Configuro e istanzio la connessione al mio server Keycloak locale una sola volta.
// Esportando questa istanza, posso riutilizzarla in qualsiasi file (pagine o componenti)
// senza doverla ricreare e senza doverla passare come prop.
const keycloakConfig = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'tesi-realm',
  clientId: 'tesi-frontend-client'
});

export default keycloakConfig;