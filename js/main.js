/* Gîte sur la Baume : scripts du site (sans bibliothèque) */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* En-tête : fond au défilement, menu sur téléphone ------------------- */
  var entete = $('.entete');
  if (entete) {
    if (!$('.heros, .demande')) entete.classList.add('est-plein');
    var majEntete = function () { entete.classList.toggle('est-defile', window.scrollY > 40); };
    majEntete();
    window.addEventListener('scroll', majEntete, { passive: true });
    var burger = $('.entete__burger');
    if (burger) burger.addEventListener('click', function () {
      var ouvert = entete.classList.toggle('menu-ouvert');
      burger.setAttribute('aria-expanded', ouvert);
      document.body.style.overflow = ouvert ? 'hidden' : '';
    });
  }

  /* Apparitions au défilement ----------------------------------------- */
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('est-visible'); obs.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.apparait').forEach(function (el) { obs.observe(el); });
  } else {
    $$('.apparait').forEach(function (el) { el.classList.add('est-visible'); });
  }

  /* Diaporama du héros : une photo toutes les 3 secondes, qui glisse ------- */
  $$('[data-diaporama]').forEach(function (d) {
    var photos = $$('img', d);
    // les avis du héros changent en même temps que les photos
    var heros = d.closest('.heros');
    var avis = heros ? $$('[data-avis-heros] .avis-flottant__avis', heros) : [];
    if (photos.length < 2 || reduit) return;
    var i = 0;
    setInterval(function () {
      if (avis.length) {
        avis[i % avis.length].classList.remove('est-visible');
        avis[(i + 1) % avis.length].classList.add('est-visible');
      }
      var sortante = photos[i];
      i = (i + 1) % photos.length;
      var entrante = photos[i];
      // la suivante attend à droite, sans animation, puis entre pendant que l'autre sort à gauche
      d.classList.add('sans-transition');
      entrante.classList.remove('est-sortie', 'est-visible');
      void entrante.offsetWidth;
      d.classList.remove('sans-transition');
      entrante.loading = 'eager';
      sortante.classList.remove('est-visible');
      sortante.classList.add('est-sortie');
      entrante.classList.add('est-visible');
    }, 3000);
  });

  /* Bande d'avis : on double la piste pour une boucle sans couture ------ */
  $$('.defile__piste').forEach(function (piste) {
    var n = piste.children.length;
    piste.innerHTML += piste.innerHTML;
    $$('.carte-avis', piste).slice(n).forEach(function (c) { c.setAttribute('aria-hidden', 'true'); });
  });

  /* Combien êtes-vous ? Chaque hébergement reste ouvert tant qu'il a la place ---- */
  $$('[data-combien]').forEach(function (bloc) {
    var curseur = $('input[type="range"]', bloc);
    var chiffre = $('[data-combien-chiffre]', bloc);
    var reponse = $('[data-combien-reponse]', bloc);
    var cartes = $$('.choix', bloc);
    var foule = $('[data-personnes]', bloc);
    var max = Number(curseur.max), min = Number(curseur.min);
    for (var k = 1; k <= max; k++) { var s = document.createElement('span'); s.className = 'pers'; foule.appendChild(s); }
    var pers = $$('.pers', foule);
    var noms = { cavaliere: 'La Cavalière', tilleul: 'Le Tilleul', domaine: 'le domaine entier' };
    var maj = function () {
      var n = Number(curseur.value);
      curseur.style.setProperty('--rempli', ((n - min) / (max - min) * 100) + '%');
      chiffre.textContent = n;
      pers.forEach(function (p, i) { p.classList.toggle('est-la', i < n); });
      var ouverts = [];
      cartes.forEach(function (c) {
        var ouvert = n <= Number(c.getAttribute('data-max'));
        c.classList.toggle('est-ferme', !ouvert);
        c.setAttribute('aria-hidden', !ouvert);
        c.tabIndex = ouvert ? 0 : -1;
        if (ouvert) ouverts.push(noms[c.getAttribute('data-choix')]);
      });
      var liste = ouverts.map(function (x) { return '<strong>' + x + '</strong>'; });
      reponse.innerHTML = ouverts.length === 1
        ? 'À ' + n + ', réservez ' + liste[0] + '\u00a0: 43 couchages et 8 d’appoint, rien que pour vous.'
        : 'À ' + n + ', vous avez le choix\u00a0: ' + liste.slice(0, -1).join(', ') + ' ou ' + liste[liste.length - 1] + '.';
    };
    curseur.addEventListener('input', maj);
    maj();
  });

  /* Fiches en fenêtre (gîtes) --------------------------------------------- */
  $$('[data-fiche]').forEach(function (bouton) {
    bouton.addEventListener('click', function () {
      var d = document.getElementById(bouton.getAttribute('data-fiche'));
      if (d && d.showModal) { d.showModal(); history.replaceState(null, '', '#' + d.id); }
    });
  });
  $$('dialog.fiche').forEach(function (d) {
    $('.fiche__fermer', d).addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    d.addEventListener('close', function () { history.replaceState(null, '', location.pathname + location.search); });
  });
  if (location.hash) {
    var cible = document.getElementById(location.hash.slice(1));
    if (cible && cible.tagName === 'DIALOG') cible.showModal();
  }

  /* Onglets (qui dort où, quatre saisons) --------------------------------- */
  $$('[data-onglets]').forEach(function (bloc) {
    var boutons = $$('[role="tab"]', bloc);
    boutons.forEach(function (b) {
      b.addEventListener('click', function () {
        boutons.forEach(function (x) {
          var actif = x === b;
          x.setAttribute('aria-selected', actif);
          document.getElementById(x.getAttribute('aria-controls')).hidden = !actif;
        });
      });
    });
  });

  /* Beau temps, pluie ------------------------------------------------------ */
  $$('[data-meteo]').forEach(function (bloc) {
    var bouton = $('.interrupteur', bloc);
    var libelle = $('[data-meteo-libelle]', bloc);
    for (var k = 0; k < 40; k++) {
      var g = document.createElement('span');
      g.className = 'goutte';
      g.setAttribute('aria-hidden', 'true');
      g.style.left = (Math.random() * 100) + '%';
      g.style.animationDuration = (0.6 + Math.random() * 0.6) + 's';
      g.style.animationDelay = (Math.random() * 1.2) + 's';
      bloc.appendChild(g);
    }
    bouton.addEventListener('click', function () {
      var pluie = bouton.getAttribute('aria-pressed') !== 'true';
      bouton.setAttribute('aria-pressed', pluie);
      bloc.classList.toggle('est-pluie', pluie);
      $('[data-liste="soleil"]', bloc).hidden = pluie;
      $('[data-liste="pluie"]', bloc).hidden = !pluie;
      libelle.textContent = pluie ? 'Il pleut : tout se passe dedans' : 'Il fait beau : tout le monde dehors';
    });
  });

  /* La salle, quatre façons : les chaises se replacent -------------------- */
  var salle = $('[data-salle]');
  if (salle) {
    var svg = $('svg', salle.closest('.salle'));
    var N = 40, W = 500, H = 400;
    var chaises = [];
    for (var c = 0; c < N; c++) {
      var r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('class', 'chaise'); r.setAttribute('width', 14); r.setAttribute('height', 14); r.setAttribute('rx', 4);
      r.setAttribute('x', -7); r.setAttribute('y', -7);
      svg.appendChild(r); chaises.push(r);
    }
    var tables = $('[data-tables]', svg);
    var dispositions = {
      theatre: function () {
        var p = [];
        for (var i = 0; i < N; i++) { var rang = Math.floor(i / 8), place = i % 8; p.push([70 + place * 52 + (place > 3 ? 20 : 0), 130 + rang * 52]); }
        return { p: p, t: '' };
      },
      u: function () {
        var p = [], i;
        for (i = 0; i < 14; i++) p.push([80, 110 + i * 19.5]);
        for (i = 0; i < 14; i++) p.push([420, 110 + i * 19.5]);
        for (i = 0; i < 12; i++) p.push([112 + i * 25.5, 382]);
        var t = '<rect class="table" x="94" y="100" width="20" height="270" rx="4"/><rect class="table" x="386" y="100" width="20" height="270" rx="4"/><rect class="table" x="94" y="350" width="312" height="18" rx="4"/>';
        return { p: p, t: t };
      },
      ilots: function () {
        var p = [], t = '', centres = [[120, 160], [250, 160], [380, 160], [120, 300], [250, 300], [380, 300]];
        var k = 0;
        centres.forEach(function (ce, j) {
          var nb = j < 4 ? 7 : 6;
          t += '<circle class="table" cx="' + ce[0] + '" cy="' + ce[1] + '" r="30"/>';
          for (var m = 0; m < nb && k < N; m++, k++) { var a = m / nb * Math.PI * 2; p.push([ce[0] + Math.cos(a) * 48, ce[1] + Math.sin(a) * 48]); }
        });
        return { p: p, t: t };
      },
      cercle: function () {
        var p = [];
        for (var i = 0; i < N; i++) { var a = i / N * Math.PI * 2; p.push([250 + Math.cos(a) * 150, 235 + Math.sin(a) * 135]); }
        return { p: p, t: '' };
      }
    };
    var boutonsSalle = $$('button', salle);
    var usage = $('.configs__usage', salle.parentNode);
    var choisir = function (b) {
      var d = dispositions[b.getAttribute('data-config')]();
      boutonsSalle.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      tables.innerHTML = d.t;
      chaises.forEach(function (ch, i) { ch.style.transform = 'translate(' + d.p[i][0] + 'px,' + d.p[i][1] + 'px)'; });
      usage.innerHTML = b.getAttribute('data-usage');
    };
    boutonsSalle.forEach(function (b) { b.addEventListener('click', function () { choisir(b); }); });
    choisir(boutonsSalle[0]);
    void W; void H;
  }

  /* Fils qui avancent au défilement (week-end, journée type) -------------- */
  $$('[data-fil]').forEach(function (bloc) {
    var trait = $('[data-fil-trait]', bloc);
    var etapes = $$('[data-etape]', bloc);
    var horizontal = bloc.hasAttribute('data-fil-horizontal');
    var maj = function () {
      var r = bloc.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (window.innerHeight * .75 - r.top) / (r.height * .9)));
      if (horizontal) trait.style.width = (p * 100) + '%';
      bloc.style.setProperty('--avance', (p * 100) + '%');
      etapes.forEach(function (e, i) { e.classList.toggle('est-allume', p >= i / etapes.length + 0.01 || p === 1); });
    };
    maj();
    window.addEventListener('scroll', maj, { passive: true });
    window.addEventListener('resize', maj);
  });

  /* Une journée type : le soleil suit l'arc du matin au soir ---------------- */
  $$('[data-soleil]').forEach(function (bloc) {
    var svg = $('.soleil__arc', bloc);
    var trace = $('.soleil__trace', bloc);
    var astre = $('.soleil__astre', bloc);
    var boutons = $$('.soleil__moments button', bloc);
    var detail = $('.soleil__detail', bloc);
    var L = trace.getTotalLength();
    trace.style.strokeDasharray = L;
    // point de l'arc à une fraction u de sa longueur, ramené aux coordonnées du bloc
    var point = function (u) {
      var p = trace.getPointAtLength(L * u), m = trace.getScreenCTM(), b = bloc.getBoundingClientRect();
      return { x: m.a * p.x + m.c * p.y + m.e - b.left, y: m.b * p.x + m.d * p.y + m.f - b.top };
    };
    var place = function () {
      boutons.forEach(function (bt) {
        var q = point(Number(bt.getAttribute('data-t')));
        bt.style.left = q.x + 'px';
        bt.style.top = (q.y - 36) + 'px';
      });
    };
    // le soleil glisse le long de l'arc, image par image, sans jamais couper la courbe
    var uActuel = null, anim = null;
    var poser = function (u) {
      var q = point(u);
      astre.style.left = q.x + 'px';
      astre.style.top = q.y + 'px';
      trace.style.strokeDashoffset = L * (1 - u);
      uActuel = u;
    };
    var voyage = function (cible) {
      if (anim) cancelAnimationFrame(anim);
      if (uActuel === null || reduit) { poser(cible); return; }
      var depart = uActuel, t0 = null, duree = 500 + Math.abs(cible - depart) * 900;
      var pas = function (ts) {
        if (t0 === null) t0 = ts;
        var k = Math.min(1, (ts - t0) / duree);
        var e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        poser(depart + (cible - depart) * e);
        if (k < 1) anim = requestAnimationFrame(pas);
      };
      anim = requestAnimationFrame(pas);
    };
    var actif = 0, auto = null;
    var choisir = function (k) {
      actif = k;
      var bt = boutons[k], u = Number(bt.getAttribute('data-t'));
      place();
      voyage(u);
      boutons.forEach(function (x, i) { x.setAttribute('aria-selected', i === k); x.tabIndex = i === k ? 0 : -1; });
      $('.soleil__heure', detail).textContent = bt.textContent;
      $('h3', detail).textContent = bt.getAttribute('data-titre');
      $('p', detail).textContent = bt.getAttribute('data-texte');
    };
    boutons.forEach(function (bt, i) {
      bt.addEventListener('click', function () { clearInterval(auto); auto = null; choisir(i); });
    });
    window.addEventListener('resize', function () { place(); poser(uActuel === null ? 0 : uActuel); });
    choisir(0);
    // la journée défile seule quand la section est à l'écran, jusqu'au premier clic
    if (!reduit && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting && auto === null && !bloc.dataset.vu) {
          bloc.dataset.vu = '1';
          auto = setInterval(function () { choisir((actif + 1) % boutons.length); }, 2600);
        }
      }, { threshold: .4 }).observe(bloc);
    }
  });

  /* Carrousel centré, voisines floutées, en boucle --------------------- */
  $$('[data-carrousel]').forEach(function (car) {
    var piste = $('.carrousel__piste', car);
    var originaux = $$('.diapo', piste);
    var n = originaux.length;
    var copie = function (d) { var c = d.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.setAttribute('data-copie', ''); $$('img', c).forEach(function (im) { im.alt = ''; }); return c; };
    originaux.forEach(function (d) { piste.insertBefore(copie(d), originaux[0]); });
    originaux.forEach(function (d) { piste.appendChild(copie(d)); });
    var toutes = $$('.diapo', piste);
    var pos = n, i = 0, attente = null;
    var points = $('.carrousel__points', car);
    originaux.forEach(function (d, k) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', 'Photo ' + (k + 1));
      b.addEventListener('click', function () { aller(k - i); });
      points.appendChild(b);
    });
    function placer(k, anime) {
      car.classList.toggle('sans-transition', !anime);
      var d = toutes[k];
      var decalage = d.offsetLeft - (car.clientWidth - d.offsetWidth) / 2;
      piste.style.transform = 'translateX(' + (-decalage) + 'px)';
      toutes.forEach(function (x, m) { x.classList.toggle('est-active', m === k); });
      if (!anime) { void piste.offsetWidth; car.classList.remove('sans-transition'); }
    }
    function aller(pas) {
      if (attente) { clearTimeout(attente); recaler(); }
      pos += pas;
      i = ((pos - n) % n + n) % n;
      placer(pos, true);
      $$('button', points).forEach(function (b, k) { b.setAttribute('aria-current', k === i); });
      attente = setTimeout(recaler, 720);
    }
    function recaler() { attente = null; if (pos < n || pos >= 2 * n) { pos = n + i; placer(pos, false); } }
    $('.carrousel__fleche--g', car).addEventListener('click', function () { aller(-1); });
    $('.carrousel__fleche--d', car).addEventListener('click', function () { aller(1); });
    var depart = null;
    car.addEventListener('touchstart', function (e) { depart = e.touches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', function (e) {
      if (depart === null) return;
      var dx = e.changedTouches[0].clientX - depart;
      if (Math.abs(dx) > 40) aller(dx < 0 ? 1 : -1);
      depart = null;
    });
    window.addEventListener('resize', function () { placer(pos, false); });
    placer(pos, false);
    $$('button', points).forEach(function (b, k) { b.setAttribute('aria-current', k === 0); });
  });

  /* Rails : la flèche avance d'une case et revient au début au bout -------- */
  $$('[data-rail]').forEach(function (bloc) {
    var rail = $('.rail', bloc);
    var pas = function () { return rail.firstElementChild ? rail.firstElementChild.offsetWidth + 22 : 300; };
    var auBout = function () { return rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4; };
    $('[data-rail-g]', bloc).addEventListener('click', function () {
      rail.scrollBy({ left: rail.scrollLeft <= 4 ? rail.scrollWidth : -pas(), behavior: 'smooth' });
    });
    $('[data-rail-d]', bloc).addEventListener('click', function () {
      if (auBout()) rail.scrollTo({ left: 0, behavior: 'smooth' });
      else rail.scrollBy({ left: pas(), behavior: 'smooth' });
    });
  });

  /* Témoignages à flèches rondes ----------------------------------------- */
  $$('[data-temoins]').forEach(function (bloc) {
    var temoins = $$('.temoin', bloc);
    var photo = $('.temoins__photo img', bloc);
    var compte = $('.temoins__compte', bloc);
    var i = 0;
    function montrer(n) {
      i = (n + temoins.length) % temoins.length;
      temoins.forEach(function (t, k) { t.classList.toggle('est-actif', k === i); });
      var src = temoins[i].getAttribute('data-photo');
      if (src && photo && photo.getAttribute('src') !== src) { photo.style.opacity = 0; setTimeout(function () { photo.src = src; photo.style.opacity = 1; }, 250); }
      if (compte) compte.textContent = (i + 1) + ' / ' + temoins.length;
    }
    $('[data-temoin-g]', bloc).addEventListener('click', function () { montrer(i - 1); });
    $('[data-temoin-d]', bloc).addEventListener('click', function () { montrer(i + 1); });
    montrer(0);
  });

  /* Questions : une seule ouverte à la fois ------------------------------- */
  $$('.faq').forEach(function (faq) {
    $$('details', faq).forEach(function (d) {
      d.addEventListener('toggle', function () { if (d.open) $$('details', faq).forEach(function (x) { if (x !== d) x.open = false; }); });
    });
  });

  /* Visionneuse : une photo en grand, avec ses voisines du même groupe ------ */
  var vis = null, groupe = [], rang = 0;
  function montrerPhoto() {
    var im = groupe[rang];
    $('img', vis).src = im.currentSrc || im.src;
    $('img', vis).alt = im.alt;
    $('.visionneuse__legende', vis).textContent = im.alt;
    var seule = groupe.length < 2;
    $('.visionneuse__prec', vis).hidden = seule; $('.visionneuse__suiv', vis).hidden = seule;
  }
  function agrandir(img) {
    if (!vis) {
      vis = document.createElement('dialog');
      vis.className = 'visionneuse';
      vis.setAttribute('aria-label', 'Photo en grand');
      vis.innerHTML = '<img alt=""><p class="visionneuse__legende"></p>' +
        '<button class="visionneuse__fermer" type="button" aria-label="Fermer">×</button>' +
        '<button class="visionneuse__prec" type="button" aria-label="Photo précédente">←</button>' +
        '<button class="visionneuse__suiv" type="button" aria-label="Photo suivante">→</button>';
      document.body.appendChild(vis);
      $('.visionneuse__fermer', vis).addEventListener('click', function () { vis.close(); });
      $('.visionneuse__prec', vis).addEventListener('click', function () { rang = (rang - 1 + groupe.length) % groupe.length; montrerPhoto(); });
      $('.visionneuse__suiv', vis).addEventListener('click', function () { rang = (rang + 1) % groupe.length; montrerPhoto(); });
      vis.addEventListener('click', function (e) { if (e.target === vis) vis.close(); });
      vis.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') $('.visionneuse__suiv', vis).click();
        if (e.key === 'ArrowLeft') $('.visionneuse__prec', vis).click();
      });
    }
    var bloc = img.closest('.fiche__photos, .carrousel__piste, [data-groupe-photos]') || img.parentNode;
    groupe = $$('[data-agrandir]', bloc).filter(function (x) { return !x.closest('[data-copie]'); });
    if (groupe.indexOf(img) < 0) groupe = [img];
    rang = Math.max(0, groupe.indexOf(img));
    montrerPhoto();
    vis.showModal();
  }
  document.addEventListener('click', function (e) {
    var cible = e.target.closest('[data-agrandir]');
    if (!cible) return;
    var diapo = cible.closest('.diapo');
    if (diapo && !diapo.classList.contains('est-active')) return;
    if (diapo && diapo.hasAttribute('data-copie')) {
      // copie de boucle : on ouvre l'original correspondant
      var src = cible.getAttribute('src');
      cible = $$('.diapo:not([data-copie]) [data-agrandir]').filter(function (x) { return x.getAttribute('src') === src; })[0] || cible;
    }
    agrandir(cible);
  });

  /* Formulaire unique : préremplissage et préparation de l'e-mail ----------- */
  var form = $('form[data-formulaire]');
  if (form) {
    var params = new URLSearchParams(location.search);
    var projet = params.get('projet');
    if (projet) {
      var bulle = $('input[name="projet"][value="' + projet + '"]', form);
      if (bulle) bulle.checked = true;
    }
    ['arrivee', 'depart', 'personnes'].forEach(function (cle) {
      var v = params.get(cle), champ = form.elements[cle];
      if (v && champ) champ.value = v;
    });
    var gite = params.get('gite');
    if (gite && $('select[name="gite"] option[value="' + gite + '"]', form)) $('select[name="gite"]', form).value = gite;
    var majProjet = function () {
      var p = ($('input[name="projet"]:checked', form) || {}).value || '';
      $('[data-champ-chevaux]', form).hidden = p !== 'cavaliers';
    };
    $$('input[name="projet"]', form).forEach(function (r) { r.addEventListener('change', majProjet); });
    majProjet();
    var auj = new Date().toISOString().slice(0, 10);
    $$('input[type="date"]', form).forEach(function (c) { c.min = auj; });

    var erreurs = $('.formulaire__erreurs', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var manque = [];
      $$('[aria-invalid]', form).forEach(function (c) { c.removeAttribute('aria-invalid'); });
      if (!$('input[name="projet"]:checked', form)) manque.push('votre projet');
      $$('[required]', form).forEach(function (c) {
        if (c.type === 'radio') return;
        if (!c.value.trim() || !c.checkValidity()) { c.setAttribute('aria-invalid', 'true'); manque.push(c.getAttribute('data-manque')); }
      });
      if (manque.length) {
        var liste = manque.length > 1 ? manque.slice(0, -1).join(', ') + ' et ' + manque[manque.length - 1] : manque[0];
        erreurs.textContent = 'Il manque ' + liste + ' pour que Carole puisse vous répondre.';
        erreurs.hidden = false;
        return;
      }
      erreurs.hidden = true;
      // Aucun service d'envoi n'est branché sur la maquette : on prépare l'e-mail.
      var lignes = [];
      var choix = $('input[name="projet"]:checked', form);
      var nomProjet = $('label[for="' + choix.id + '"]', form).textContent;
      lignes.push('Projet : ' + nomProjet);
      $$('.champ', form).forEach(function (ch) {
        if (ch.hidden) return;
        var c = $('input, select, textarea', ch);
        if (!c || !c.value.trim() || c.name === 'message') return;
        var v = c.tagName === 'SELECT' ? c.options[c.selectedIndex].text : c.value.trim();
        if (c.type === 'date') v = new Date(v + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        lignes.push($('label', ch).textContent.replace(/\s*\*$/, '') + ' : ' + v);
      });
      var message = $('[name="message"]', form).value.trim();
      if (message) lignes.push('', message);
      var lien = 'mailto:reservation@gitesurlabaume.fr?subject=' + encodeURIComponent('Demande depuis le site : ' + nomProjet) + '&body=' + encodeURIComponent(lignes.join('\n'));
      var merci = $('.formulaire__merci');
      form.hidden = true; merci.hidden = false;
      $('a', merci).href = lien;
    });
  }

  /* Année du pied de page */
  $$('[data-annee]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

/* V2 de Tom (12/10/2026) : écran d'entrée, vidéo du héros, avis du héros, sous-menu des gîtes */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Écran d'entrée : 2 secondes, puis il monte comme un rideau ------------- */
  // La décision de l'afficher est prise dans le <head> de l'accueil (classe sans-entree).
  var entree = $('#entree');
  var video = $('.heros__video');
  if (entree) {
    var retirer = function () { if (entree.parentNode) entree.parentNode.removeChild(entree); document.body.classList.remove('est-verrouille'); };
    if (document.documentElement.classList.contains('sans-entree')) retirer();
    else {
      document.body.classList.add('est-verrouille');
      var sortir = function () {
        entree.classList.add('est-sortie');
        // la vidéo repart de son premier plan pendant que le rideau monte
        if (video) { try { video.currentTime = 0; video.play(); } catch (e) {} }
        setTimeout(retirer, reduit ? 0 : 900);
      };
      setTimeout(sortir, 2000);
      // retour arrière servi depuis le cache du navigateur : le minuteur a pu ne pas repartir
      window.addEventListener('pageshow', function (ev) { if (ev.persisted) retirer(); });
    }
  }
  // Certains navigateurs bloquent la lecture automatique : on la relance une fois, sinon l'affiche reste.
  if (video && video.paused) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }

  /* Avis du héros : sans diaporama (héros vidéo), ils tournent seuls ------ */
  $$('[data-avis-heros]').forEach(function (bloc) {
    if (bloc.closest('.heros') && $('[data-diaporama]', bloc.closest('.heros'))) return;
    var avis = $$('.avis-flottant__avis', bloc);
    if (avis.length < 2 || reduit) return;
    var i = 0;
    setInterval(function () {
      avis[i].classList.remove('est-visible');
      i = (i + 1) % avis.length;
      avis[i].classList.add('est-visible');
    }, 4500);
  });

  /* Sous-menu « Les gîtes » : survol sur ordinateur, bouton au clavier ----- */
  $$('.menu__deroulant').forEach(function (li) {
    var bouton = $('.menu__parent', li);
    if (!bouton) return;
    var fermer = function () { li.classList.remove('est-ouvert'); bouton.setAttribute('aria-expanded', 'false'); };
    bouton.addEventListener('click', function (e) {
      e.stopPropagation();
      var ouvert = li.classList.toggle('est-ouvert');
      bouton.setAttribute('aria-expanded', ouvert);
    });
    document.addEventListener('click', function (e) { if (!li.contains(e.target)) fermer(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermer(); });
  });
})();

/* Carte Google Maps : chargée seulement au clic (Google ne reçoit rien avant) */
(function () {
  'use strict';
  Array.prototype.slice.call(document.querySelectorAll('[data-carte]')).forEach(function (bloc) {
    var bouton = bloc.querySelector('[data-carte-ouvrir]');
    if (!bouton) return;
    bouton.addEventListener('click', function () {
      var cadre = document.createElement('iframe');
      cadre.src = bloc.getAttribute('data-carte');
      cadre.title = bloc.getAttribute('data-titre') || 'Carte';
      cadre.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      bloc.appendChild(cadre);
    });
  });
})();
