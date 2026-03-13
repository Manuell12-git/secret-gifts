require("dotenv").config();
// Fix for ECONNREFUSED _mongodb._tcp DNS issue
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require("mongoose");
const Member = require("./models/Member");

const members = [
    { "number": 1, "name": "Moïse KINKOBO", "photo": "https://i.imgur.com/UfUBSal.jpeg" },
    { "number": 2, "name": "Yannick kapongo", "photo": "https://i.imgur.com/qSNcpOv.jpeg" },
    { "number": 3, "name": "Pascal kadiat", "photo": "https://i.imgur.com/0oYNYiv.jpeg" },
    { "number": 4, "name": "MARCO MUMEKA", "photo": "https://i.imgur.com/U7G5Dq5.jpeg" },
    { "number": 5, "name": "GELMAEL MANGIE", "photo": "https://i.imgur.com/v5ofo8n.jpeg" },
    { "number": 6, "name": "Guido mutoni", "photo": "https://i.imgur.com/DVcN5hb.jpeg" },
    { "number": 7, "name": "Père Déo-gratias MUTONI", "photo": "https://i.imgur.com/hIqCIO2.jpeg" },
    { "number": 8, "name": "Marc Akilimali", "photo": "https://i.imgur.com/XnA6CfJ.jpeg" },
    { "number": 9, "name": "Manuella Sony", "photo": "https://i.imgur.com/mOi5nA5.jpeg" },
    { "number": 10, "name": "Larissa kyembe", "photo": "https://i.imgur.com/h4ZQLy6.jpeg" },
    { "number": 11, "name": "Noëlla Feza", "photo": "https://i.imgur.com/5hExmqH.jpeg" },
    { "number": 12, "name": "Franck LWEMBE", "photo": "https://i.imgur.com/HWJgJG5.jpeg" },
    { "number": 13, "name": "André MUTONI", "photo": "https://i.imgur.com/RXlZJ4M.jpeg" },
    { "number": 14, "name": "Bénédicte Kabunda", "photo": "https://i.imgur.com/1QGbyXX.jpeg" },
    { "number": 15, "name": "Ludovic Ngobela", "photo": "https://i.imgur.com/DCmCsoe.jpeg" },
    { "number": 16, "name": "Aline leya", "photo": "https://i.imgur.com/1IWjiNQ.jpeg" },
    { "number": 17, "name": "Elianne yohari", "photo": "https://i.imgur.com/Ci7JthD.jpeg" },
    { "number": 18, "name": "Vivianne faila", "photo": "https://i.imgur.com/Gifw9IW.jpeg" },
    { "number": 19, "name": "Orani kadiat", "photo": "https://i.imgur.com/d4oPhpl.jpeg" },
    { "number": 20, "name": "Mariam Mutoni", "photo": "https://i.imgur.com/TxFz4RP.jpeg" }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connexion MongoDB (seed)");

    await Member.deleteMany({});
    console.log("🧹 Base nettoyée");

    await Member.insertMany(members);
    console.log("🎉 Les 20 participants ont été ajoutés avec succès !");

    process.exit();
  } catch (err) {
    console.error("❌ Erreur lors du seed :", err);
    process.exit(1);
  }
}

seedDatabase();