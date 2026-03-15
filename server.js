require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const Member = require("./models/Member");

const app = express();
app.use(express.json());

// --- 🛠 CONFIGURATION POUR TES TESTS ---
// Mettre à false pour la production (pour sauvegarder les tirages)
const MODE_TEST = false;
// ----------------------------------------

// Connexion à MongoDB au démarrage du serveur
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connexion à MongoDB réussie !"))
  .catch((err) => {
    console.error("❌ Échec de connexion à MongoDB :", err.message);
    process.exit(1);
  });

// Servir les fichiers statiques du dossier 'public'
app.use(express.static(path.join(__dirname, "public")));

// Route principale
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

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
    console.error(err);
    res.status(500).send("Erreur : " + err.message);
  }
});

// 🎯 ROUTE : Tirage au sort
app.post("/choose/:number", async (req, res) => {
  try {
    const number = parseInt(req.params.number, 10);

    if (isNaN(number)) {
      return res.status(400).json({ message: "Numéro invalide." });
    }

    const member = await Member.findOne({ number });

    if (!member) {
      return res.status(404).json({ message: "Numéro d'enveloppe introuvable." });
    }

    if (!MODE_TEST && member.drawn) {
      return res.status(400).json({ message: "Cette enveloppe a déjà été choisie ! ❌" });
    }

    const available = await Member.find({
      _id: { $ne: member._id },
      receivedFrom: null
    });

    if (available.length === 0) {
      return res.status(400).json({ message: "Plus de personnes disponibles pour le tirage." });
    }

    const chosen = available[Math.floor(Math.random() * available.length)];

    if (!MODE_TEST) {
      member.drawn = true;
      member.givesTo = chosen.name;
      chosen.receivedFrom = member.name;
      await member.save();
      await chosen.save();
    }

    res.json({
      message: "Tirage réussi !",
      name: chosen.name,
      photo: chosen.photo || "default.jpg"
    });

  } catch (err) {
    console.error("Erreur lors du tirage :", err);
    res.status(500).json({ message: "Erreur serveur lors du tirage." });
  }
});

// Route attrape-tout : renvoyer index.html pour toutes les autres URLs (évite les "Not Found" au rafraîchissement)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🚀 Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});

module.exports = app;