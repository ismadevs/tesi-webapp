// ==========================================
// ERRORI APPLICATIVI TIPIZZATI
// ==========================================
// Il livello di servizio non conosce HTTP: non e' suo compito decidere se una
// situazione vale 400, 404 o 409. Lancia invece errori tipizzati, e il
// controller li traduce nel codice di stato corrispondente.
//
// Il vantaggio pratico e' che la stessa logica di servizio potra' essere
// riusata dal controller di orchestrazione, che non risponde a richieste HTTP
// ma invoca la CLI di SLICES.

// 400 - i dati inviati non rispettano le regole del dominio.
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    // Il campo permette al frontend di evidenziare l'input sbagliato
    // invece di mostrare un messaggio generico in cima al form.
    this.field = field;
  }
}

// 404 - la risorsa richiesta non esiste.
export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// 409 - la richiesta e' formalmente valida ma incompatibile con lo stato
// corrente: nome gia' in uso, oppure modifica di un esperimento gia'
// materializzato su SLICES.
export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
  }
}