/*
 * Dati dinamici del footer: scrive l'anno corrente nel copyright,
 * così non va aggiornato a mano ogni gennaio.
 */
class ContactDetails {
  start() {
    document.getElementById("year").textContent = new Date().getFullYear();
  }
}
