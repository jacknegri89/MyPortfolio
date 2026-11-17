/*
 * Primo script della pagina, nel <head>: segna subito che il JavaScript c'è (classe "js" su <html>).
 * Con questa classe il loader non usa più la riserva dei 2 secondi pensata per chi non ha JavaScript
 * (css/loader.css): resta su finché App non ha preparato la pagina, poi lo toglie IntroAnimation.
 * Senza questa distinzione, su una connessione lenta la riserva toglieva il loader, poi arrivava il
 * JavaScript, il loader ricompariva e l'apertura ripartiva da capo.
 */
document.documentElement.classList.add("js");
