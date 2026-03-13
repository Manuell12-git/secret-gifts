const numbersDiv = document.getElementById('numbers');
const giftDiv = document.getElementById('gift');
const giftMessage = document.getElementById('giftMessage');
const giftPhoto = document.getElementById('giftPhoto');

const totalParticipants = 20;

// Créer 20 boutons numérotés
for (let i = 1; i <= totalParticipants; i++) {
  const btn = document.createElement('button');
  btn.innerText = i;
  
  btn.onclick = async () => {
    try {
      const res = await fetch('/choose/' + i, { method: 'POST' });
      const data = await res.json();

      console.log("Données reçues :", data);

      if (res.ok) {
        // 1. Mise à jour du texte
        giftMessage.innerText = "Vous avez tiré : " + (data.name || "un ami");

        // 2. Mise à jour et affichage de la photo
        if (data.photo) {
          giftPhoto.src = data.photo;
          giftPhoto.alt = "Photo de " + data.name;
          giftPhoto.style.display = "block"; // <-- FORCE L'AFFICHAGE
        } else {
          giftPhoto.style.display = "none"; // Cache si pas de photo
        }

        // 3. Affichage du bloc cadeau
        giftDiv.classList.remove('hidden');
        
        // 4. Désactiver le bouton cliqué
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";

      } else {
        alert(data.message || "Ce numéro est déjà pris !");
      }
    } catch (err) {
      console.error("Erreur réseau :", err);
      alert("Erreur de connexion au serveur.");
    }
  };
  numbersDiv.appendChild(btn);
}