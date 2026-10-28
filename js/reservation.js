/* Gîte sur la Baume : panneau de réservation (comme sur le site de T'Nature), branché sur le Smoobu de Carole.
 *
 * Le visiteur choisit le domaine entier, La Cavalière ou Le Tilleul ; le panneau ouvre le moteur de réservation
 * Smoobu de ce logement (dates libres, prix, demande). La demande arrive dans Smoobu, Carole envoie la facture
 * et le client paie par virement : aucun paiement sur le site.
 * Rien n'est chargé depuis Smoobu tant que le panneau n'est pas ouvert.
 */
(function () {
  'use strict';
  var MOTEUR = 'https://booking.smoobu.com/9A1758882?apartmentId=';
  // Identifiants des logements dans Smoobu. Le loft (3333992) n'est jamais proposé sur le site.
  var LOGEMENTS = {
    'le-domaine': { id: '3333987', nom: 'Le domaine entier' },
    'la-cavaliere': { id: '3333977', nom: 'La Cavalière' },
    'le-tilleul': { id: '3333982', nom: 'Le Tilleul' }
  };
  var REDIMENSION = 'https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.9/iframeResizer.min.js';

  var panneau = document.getElementById('reserver');
  if (!panneau) return;
  var moteur = panneau.querySelector('[data-resa-moteur]');
  var cartes = Array.prototype.slice.call(panneau.querySelectorAll('[data-gite]'));
  var dernierFocus = null;
  var outil = null;

  function chargerRedimension(fait) {
    if (window.iFrameResize) return fait();
    if (outil) return outil.push(fait);
    outil = [fait];
    var s = document.createElement('script');
    s.src = REDIMENSION;
    s.onload = function () { outil.forEach(function (f) { f(); }); };
    s.onerror = function () { outil = []; };
    document.head.appendChild(s);
  }

  function choisir(slug) {
    var l = LOGEMENTS[slug];
    if (!l) return;
    cartes.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-gite') === slug ? 'true' : 'false'); });
    var cadre = document.createElement('iframe');
    cadre.className = 'resa-moteur__cadre';
    cadre.src = MOTEUR + l.id;
    cadre.title = 'Réservation : ' + l.nom;
    cadre.setAttribute('scrolling', 'no');
    moteur.innerHTML = '';
    moteur.appendChild(cadre);
    moteur.setAttribute('data-gite-choisi', slug);
    chargerRedimension(function () { try { window.iFrameResize({ checkOrigin: false, heightCalculationMethod: 'bodyScroll' }, cadre); } catch (e) {} });
  }

  function ouvrir(slug) {
    dernierFocus = document.activeElement;
    panneau.hidden = false;
    document.body.classList.add('resa-ouvert');
    requestAnimationFrame(function () { panneau.classList.add('est-ouvert'); });
    if (LOGEMENTS[slug]) choisir(slug);
    else if (!moteur.querySelector('iframe')) cartes[0] && cartes[0].focus();
    panneau.querySelector('.resa-panneau__fermer').focus({ preventScroll: true });
  }

  function fermer() {
    panneau.classList.remove('est-ouvert');
    document.body.classList.remove('resa-ouvert');
    setTimeout(function () { panneau.hidden = true; }, 250);
    if (dernierFocus && dernierFocus.focus) dernierFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-reserver]');
    if (b) { e.preventDefault(); ouvrir(b.getAttribute('data-reserver')); return; }
    if (e.target.closest && e.target.closest('[data-resa-fermer]')) fermer();
  });
  cartes.forEach(function (c) { c.addEventListener('click', function () { choisir(c.getAttribute('data-gite')); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panneau.hidden) fermer(); });
})();
