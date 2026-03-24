require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const Member = require("./models/Member");

const app = express();
app.use(express.json());

// ✅ MODE_TEST : automatique selon l'environnement
// En production sur Render, NODE_ENV=production => MODE_TEST=false
const MODE_TEST = process.env.NODE_ENV !== "production";
console.log(`🔧 Mode : ${MODE_TEST ? "TEST (données locales)" : "PRODUCTION (MongoDB)"}`);

// Liste des participants en dur (fallback si MongoDB indisponible ou en mode test)
const participantsTest = [
  { number: 1,  name: "Moïse KINKOBO",           photo: "https://i.imgur.com/UfUBSal.jpeg" },
  { number: 2,  name: "Yannick kapongo",           photo: "https://i.imgur.com/qSNcpOv.jpeg" },
  { number: 3,  name: "Pascal kadiat",             photo: "https://i.imgur.com/0oYNYiv.jpeg" },
  { number: 4,  name: "MARCO MUMEKA",              photo: "https://i.imgur.com/U7G5Dq5.jpeg" },
  { number: 5,  name: "GELMAEL MANGIE",            photo: "https://i.imgur.com/v5ofo8n.jpeg" },
  { number: 6,  name: "Guido mutoni",              photo: "https://i.imgur.com/DVcN5hb.jpeg" },
  { number: 7,  name: "Père Déo-gratias MUTONI",   photo: "https://i.imgur.com/hIqCIO2.jpeg" },
  { number: 8,  name: "Marc Akilimali",            photo: "https://i.imgur.com/XnA6CfJ.jpeg" },
  { number: 9,  name: "Manuella Sony",             photo: "https://i.imgur.com/mOi5nA5.jpeg" },
  { number: 10, name: "Larissa kyembe",            photo: "https://i.imgur.com/h4ZQLy6.jpeg" },
  { number: 11, name: "Noëlla Feza",               photo: "https://i.imgur.com/5hExmqH.jpeg" },
  { number: 12, name: "Franck LWEMBE",             photo: "https://i.imgur.com/HWJgJG5.jpeg" },
  { number: 13, name: "André MUTONI",              photo: "https://i.imgur.com/RXlZJ4M.jpeg" },
  { number: 14, name: "Bénédicte Kabunda",         photo: "https://i.imgur.com/1QGbyXX.jpeg" },
  { number: 15, name: "Ludovic Ngobela",           photo: "https://i.imgur.com/DCmCsoe.jpeg" },
  { number: 16, name: "Aline leya",                photo: "https://i.imgur.com/1IWjiNQ.jpeg" },
  { number: 17, name: "Elianne yohari",            photo: "https://i.imgur.com/Ci7JthD.jpeg" },
  { number: 18, name: "Vivianne faila",            photo: "https://i.imgur.com/Gifw9IW.jpeg" },
  { number: 19, name: "Orani kadiat",              photo: "https://i.imgur.com/d4oPhpl.jpeg" },
  { number: 20, name: "Mariam Mutoni",             photo: "https://i.imgur.com/TxFz4RP.jpeg" }
];

// ✅ Connexion MongoDB avec retry automatique
let dbConnected = false;

async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.warn("⚠️  MONGO_URI non défini. Le serveur démarre sans MongoDB.");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout rapide (5s)
    });
    dbConnected = true;
    console.log("✅ Connexion à MongoDB réussie !");
  } catch (err) {
    console.error("❌ Échec de connexion à MongoDB :", err.message);
    if (!MODE_TEST) {
      console.error("Mode production : arrêt du serveur car la DB est requise.");
      process.exit(1);
    }
    console.warn("Mode test : le serveur continue malgré l'échec MongoDB.");
  }
}

connectDB();

// ✅ Fichiers statiques AVANT les routes API
app.use(express.static(path.join(__dirname, "public")));

// -------------------------------------------------------
//  ROUTES API
// -------------------------------------------------------

// 🖼 ROUTE : Liste des participants (pour précharger les images)
app.get("/participants", async (req, res) => {
  if (MODE_TEST || !dbConnected) {
    return res.json(participantsTest.map(p => ({ number: p.number, name: p.name, photo: p.photo })));
  }
  try {
    const members = await Member.find({}, { number: 1, name: 1, photo: 1, _id: 0 });
    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// 🔒 ROUTE : Réinitialiser la base de données (protégée par mot de passe admin)
app.post("/reset-database", async (req, res) => {
  const { adminKey } = req.body;
  const expectedKey = process.env.ADMIN_KEY || "secret2026";

  if (adminKey !== expectedKey) {
    return res.status(403).json({ message: "Accès refusé. Clé admin incorrecte." });
  }

  if (MODE_TEST || !dbConnected) {
    // En mode test, on ne fait rien côté DB (le localStorage est effacé côté client)
    return res.json({ message: "✅ Réinitialisation en mode test effectuée." });
  }

  try {
    await Member.updateMany({}, { drawn: false, givesTo: null, receivedFrom: null });
    res.json({ message: "✅ Base de données réinitialisée !" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la réinitialisation : " + err.message });
  }
});

// 🎯 ROUTE : Tirage au sort
app.post("/choose/:number", async (req, res) => {
  // Vérifier la disponibilité de la DB en production
  if (!dbConnected && !MODE_TEST) {
    return res.status(503).json({ message: "Base de données non disponible. Réessaie plus tard." });
  }

  const number = parseInt(req.params.number, 10);
  if (isNaN(number) || number < 1 || number > 20) {
    return res.status(400).json({ message: "Numéro invalide." });
  }

  try {
    if (MODE_TEST || !dbConnected) {
      // ── Mode TEST : données locales ──────────────────────
      const member = participantsTest.find(p => p.number === number);
      if (!member) {
        return res.status(404).json({ message: "Numéro d'enveloppe introuvable." });
      }

      const available = participantsTest.filter(p => p.number !== number);
      if (available.length === 0) {
        return res.status(400).json({ message: "Plus de participants disponibles." });
      }

      const chosen = available[Math.floor(Math.random() * available.length)];
      return res.json({
        message: "Tirage réussi !",
        name: chosen.name,
        photo: chosen.photo || "/images/default.svg"
      });

    } else {
      // ── Mode PRODUCTION : MongoDB ────────────────────────
      // findOneAndUpdate atomique pour éviter les doublons (race condition)
      const member = await Member.findOneAndUpdate(
        { number, drawn: false }, // Condition : pas encore tiré
        { drawn: true },           // Marquer comme tiré
        { new: true }              // Retourner le document mis à jour
      );

      if (!member) {
        // Soit le numéro n'existe pas, soit déjà tiré
        const exists = await Member.findOne({ number });
        if (!exists) return res.status(404).json({ message: "Numéro introuvable." });
        return res.status(400).json({ message: "Cette enveloppe a déjà été choisie ! ❌" });
      }

      const available = await Member.find({
        _id: { $ne: member._id },
        receivedFrom: null
      });

      if (available.length === 0) {
        // Annuler le tirage si plus personne de disponible
        await Member.findByIdAndUpdate(member._id, { drawn: false });
        return res.status(400).json({ message: "Plus de personnes disponibles pour le tirage." });
      }

      const chosen = available[Math.floor(Math.random() * available.length)];
      member.givesTo = chosen.name;
      chosen.receivedFrom = member.name;
      await member.save();
      await chosen.save();

      return res.json({
        message: "Tirage réussi !",
        name: chosen.name,
        photo: chosen.photo || "/images/default.svg"
      });
    }

  } catch (err) {
    console.error("Erreur lors du tirage :", err);
    res.status(500).json({ message: "Erreur serveur lors du tirage." });
  }
});

// -------------------------------------------------------
//  CATCH-ALL : Renvoyer index.html pour le rafraîchissement
//  ⚠️  DOIT être APRÈS toutes les routes API
// -------------------------------------------------------
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🚀 Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});

module.exports = app;