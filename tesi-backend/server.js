import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Carica le variabili d'ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware globali
app.use(cors()); // Sblocca le chiamate dal frontend
app.use(express.json()); // Permette al backend di leggere i JSON in arrivo

// Rotta di test
app.get('/api/status', (req, res) => {
    res.json({ message: "Backend Node.js operativo e in ascolto!" });
});

// Avvio del server
app.listen(PORT, () => {
    console.log(`🚀 Server in esecuzione sulla porta ${PORT}!`);
});