require("dotenv").config();
// Fix for ECONNREFUSED _mongodb._tcp DNS issue
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const Member = require("./models/Member");

const app = express();
app.use(express.json());

// --- 🛠 CONFIGURATION POUR TES TESTS ---
// Mettre à false pour la production (pour sauvegarder les tirages)
const MODE_TEST = false; 
// --------------------------------------

// Connexion à la base de données
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connexion à MongoDB réussie !"))
  .catch(err => {
    console.error("❌ Échec de connexion :", err);
    process.exit(1); // Arrêter le serveur si la connexion échoue
  });

// Servir les fichiers statiques du dossier 'public'
app.use(express.static(path.join(__dirname, "public")));

// 🔹 ROUTE : Réinitialiser la base de données
app.get("/reset-database", async (req, res) => {
  try {
    await Member.updateMany({}, { 
      drawn: false, 
      givesTo: null, 
      receivedFrom: null 
    });
    res.send("<h1>✅ Base de données réinitialisée ! Toutes les enveloppes sont libres.</h1>");
  } catch (err) {
    res.status(500).send("Erreur : " + err.message);
  }
});

// Route principale pour charger le site
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route pour effectuer le tirage au sort
app.post("/choose/:number", async (req, res) => {
  try {
    const number = parseInt(req.params.number, 10);

    // Validation du numéro
    if (isNaN(number)) {
      return res.status(400).json({ message: "Numéro invalide. Veuillez fournir un numéro valide." });
    }

    const member = await Member.findOne({ number: number });

    if (!member) {
      return res.status(404).json({ message: "Numéro d'enveloppe introuvable" });
    }

    // Bloquer si déjà tiré (uniquement si MODE_TEST est false)
    if (!MODE_TEST && member.drawn) {
      return res.status(400).json({ message: "Cette enveloppe a déjà été choisie ! ❌" });
    }

    // Trouver quelqu'un qui n'a pas encore reçu de cadeau
    const available = await Member.find({
      _id: { $ne: member._id }, // Ne pas se tirer soi-même
      receivedFrom: null
    });

    if (available.length === 0) {
      return res.status(400).json({ message: "Plus de personnes disponibles pour le tirage." });
    }

    // Sélection aléatoire
    const chosen = available[Math.floor(Math.random() * available.length)];

    // Sauvegarde en base de données uniquement si on n'est pas en test
    if (!MODE_TEST) {
      member.drawn = true;
      member.givesTo = chosen.name;
      chosen.receivedFrom = member.name;
      await member.save();
      await chosen.save();
    }

    // Réponse envoyée au client (le site)
    res.json({
      message: "Tirage réussi !",
      name: chosen.name,
      photo: chosen.photo || "default.jpg" // Ajouter une valeur par défaut si la photo est absente
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors du tirage." });
  }
});

// --- 🚀 GESTION DU PORT POUR RENDER / LOCAL ---
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
  });
}

// Export de l'application Express pour le Serverless (Vercel)
module.exports = app;