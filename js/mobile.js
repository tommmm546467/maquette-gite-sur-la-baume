/* Gîte sur la Baume : scripts de la version mobile (29/10/2026), repris du Domaine des Chabriers.
   Chargé après main.js. Quand l'écran fait 767 px ou moins, les blocs empilés deviennent des carrousels qu'on fait
   glisser (un point par carte) et la bande sous le héros de l'accueil défile sur une ligne ; au-delà, tout est défait :
   sur ordinateur, la page reste exactement celle que le générateur a écrite.
   Source : outils/mobile/mobile.js, copiée dans 04-Site/js/ par construire-site-v3.py. */
(function () {
  'use strict';
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var tel = window.matchMedia('(max-width: 767px)');
  var defaire = [];
  var el = function (tag, classe) { var e = document.createElement(tag); if (classe) e.className = classe; return e; };

  /* Blocs qui deviennent des carrousels (mêmes sélecteurs que outils/verifier-mobile.mjs) */
  var CARROUSELS = [
    '#venir-pour .raisons', '#pour-qui .raisons',
    '#rez-de-chaussee .pieces', '#pieces .pieces', '#etage .chambres', '#chambres .chambres',
    '#plus .points-forts', '#images .galerie', '#autres .autres-gites',
    '#comprend .compris', '#ideal .ideal', '#occasions .occasions',
    '#sejour .temps', '#activites .sorties', '#location .tarifs-plus'
  ];

  /* Carrousel : bande de cartes ou de photos qu'on fait glisser, avec un point par carte ------------------------ */
  function carrousel(piste) {
    if (!piste || !piste.parentNode) return;
    var cartes = Array.prototype.slice.call(piste.children);
    if (cartes.length < 2) return;
    var enveloppe = el('div', 'm-car');
    piste.parentNode.insertBefore(enveloppe, piste);
    enveloppe.appendChild(piste);
    piste.classList.add('m-piste');
    var points = el('div', 'm-points');
    points.setAttribute('aria-hidden', 'true');
    cartes.forEach(function (c, i) {
      var p = el('span');
      p.addEventListener('click', function () { aller(i); });
      points.appendChild(p);
    });
    var nav = el('div', 'm-nav');
    nav.appendChild(points);
    enveloppe.appendChild(nav);
    function proche() {
      var milieu = piste.scrollLeft + piste.clientWidth / 2, meilleur = 0, ecart = Infinity;
      cartes.forEach(function (c, i) {
        var e = Math.abs(c.offsetLeft + c.offsetWidth / 2 - milieu);
        if (e < ecart) { ecart = e; meilleur = i; }
      });
      return meilleur;
    }
    function maj() {
      var courant = proche();
      $$('span', points).forEach(function (p, i) { p.classList.toggle('est-actif', i === courant); });
    }
    function aller(i) {
      var c = cartes[i];
      piste.scrollTo({ left: c.offsetLeft + c.offsetWidth / 2 - piste.clientWidth / 2, behavior: 'smooth' });
    }
    piste.addEventListener('scroll', maj, { passive: true });
    maj();
    defaire.push(function () {
      piste.removeEventListener('scroll', maj);
      piste.classList.remove('m-piste');
      piste.scrollLeft = 0;
      enveloppe.parentNode.insertBefore(piste, enveloppe);
      enveloppe.remove();
    });
  }

  /* Bande qui défile de droite à gauche : les cases sont copiées une fois pour boucler sans saut ---------------- */
  function bande(liste) {
    if (!liste) return;
    var originaux = Array.prototype.slice.call(liste.children);
    if (!originaux.length) return;
    var clones = originaux.map(function (li) {
      var c = li.cloneNode(true);
      c.classList.add('m-clone');
      c.setAttribute('aria-hidden', 'true');
      liste.appendChild(c);
      return c;
    });
    var regler = function () {
      var largeur = liste.scrollWidth / 2;
      if (largeur > 0) liste.style.setProperty('--m-duree', Math.max(12, Math.round(largeur / 42)) + 's');
    };
    requestAnimationFrame(regler);
    window.addEventListener('load', regler);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(regler);
    defaire.push(function () {
      window.removeEventListener('load', regler);
      clones.forEach(function (c) { c.remove(); });
      liste.style.removeProperty('--m-duree');
    });
  }

  function construire() {
    bande(document.querySelector('.bande-mots__carte'));
    CARROUSELS.forEach(function (s) { $$(s).forEach(carrousel); });
  }
  function demonter() { while (defaire.length) { try { defaire.pop()(); } catch (e) { /* élément déjà retiré */ } } }
  var actif = false;
  function suivre() {
    if (tel.matches && !actif) { actif = true; construire(); }
    else if (!tel.matches && actif) { actif = false; demonter(); }
  }
  suivre();
  if (tel.addEventListener) tel.addEventListener('change', suivre); else tel.addListener(suivre);
})();
