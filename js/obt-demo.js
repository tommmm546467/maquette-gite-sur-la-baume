/* Gîte sur la Baume : données de démonstration pour le panneau de réservation OBT.
 *
 * Le panneau est le vrai script de l'application (obt-gestion.com/blocks/obt-booking.js), le même que
 * sur le site de T'Nature. Le gîte n'a pas encore de compte dans l'application : ce fichier répond à sa
 * place, dans le navigateur, pour une adresse factice (DEMO_API). Rien n'est lu dans l'application et
 * rien n'y est écrit ; la demande finale n'est envoyée nulle part.
 *
 * Tarifs : ceux du site actuel du gîte (400 € la nuit en semaine, 1400 € le forfait du vendredi au
 * dimanche, le double pour le domaine entier, ménage 230 € par gîte). Les séjours déjà pris sont
 * inventés, pour montrer le planning. Plus tard, les vrais tarifs et le vrai planning viendront
 * de l'application (ou de Smoobu) : ce fichier disparaît.
 */
(function () {
  "use strict";
  var DEMO_API = "https://demo-baume.obt.invalid";
  var DEMO_ENVOI = "https://demo-baume.obt.invalid/envoi";

  var JOUR = 86400000;
  var iso = function (d) { return d.toISOString().slice(0, 10); };
  var date = function (s) { return new Date(s + "T00:00:00Z"); };
  var auj = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
  var plus = function (n) { return iso(new Date(auj.getTime() + n * JOUR)); };
  var jourSemaine = function (s) { return date(s).getUTCDay(); }; // 0 dimanche, 5 vendredi, 6 samedi

  var IMG = "images/";
  var LOGEMENTS = [
    { id: "la-cavaliere", name: "La Cavalière", kind: "gite", capacity: 24, note: "22 couchages et 2 d’appoint, grande salle de 60 places, 4 chambres avec salle de bain", image: IMG + "cav-salle-1.jpg", minNights: 1, contains: [], facteur: 1 },
    { id: "le-tilleul", name: "Le Tilleul", kind: "gite", capacity: 27, note: "21 couchages et 6 d’appoint, salle de 40 places, chambre PMR au rez-de-chaussée", image: IMG + "til-batiment.jpg", minNights: 1, contains: [], facteur: 1 },
    { id: "le-domaine", name: "Le domaine entier", kind: "gite", capacity: 51, note: "Les deux gîtes rien que pour vous : 43 couchages et 8 d’appoint", image: IMG + "ciel-cour.jpg", minNights: 1, contains: ["la-cavaliere", "le-tilleul"], facteur: 2 },
  ];

  // Séjours inventés autour d'aujourd'hui
  var OCCUPE = { "la-cavaliere": [], "le-tilleul": [], "le-domaine": [] };
  OCCUPE["la-cavaliere"].push({ start: plus(4), end: plus(7) }, { start: plus(18), end: plus(21) }, { start: plus(33), end: plus(36) });
  OCCUPE["le-tilleul"].push({ start: plus(11), end: plus(14) }, { start: plus(25), end: plus(28) });
  OCCUPE["le-domaine"].push({ start: plus(46), end: plus(49) });

  var OPTIONS = [
    { id: "taxe", name: "Taxe de séjour (comprise)", priceCents: 0, unit: "sejour", included: true },
    { id: "draps", name: "Draps, literie et linge de bain (compris)", priceCents: 0, unit: "sejour", included: true },
    { id: "menage-cavaliere", name: "Ménage de fin de séjour", priceCents: 23000, unit: "sejour", logementIds: ["la-cavaliere"] },
    { id: "menage-tilleul", name: "Ménage de fin de séjour", priceCents: 23000, unit: "sejour", logementIds: ["le-tilleul"] },
    { id: "menage-domaine", name: "Ménage de fin de séjour (deux gîtes)", priceCents: 46000, unit: "sejour", logementIds: ["le-domaine"] },
    { id: "box", name: "Un box ou une stalle pour un cheval (7 € la nuit)", priceCents: 700, unit: "nuit" },
  ].map(function (o) {
    return { id: o.id, name: o.name, priceCents: o.priceCents, unit: o.unit, logementIds: o.logementIds || [], appliesTo: "all",
      minGuests: null, minNights: null, included: !!o.included, mandatory: false, maxGuests: null, maxNights: null,
      periodStart: null, periodEnd: null, includedGuests: null, adultsOnly: false };
  });

  var CONDITIONS = [
    { id: "regles", title: "Les règles de location", body: "Le week-end se loue uniquement en forfait 2 nuits, du vendredi au dimanche.\nLes nuits en semaine se louent du lundi au jeudi.\nVous louez un gîte entier, quel que soit le nombre de personnes." },
    { id: "compris", title: "Compris dans le prix", body: "La taxe de séjour, l’eau, l’électricité et le chauffage.\nLes draps, la literie et le linge de bain.\nLe gel douche, le shampooing, le papier toilette, les produits ménagers et la vaisselle.\nLe Wi-Fi, les lits parapluie, la chaise haute et le parking." },
    { id: "devis", title: "Mariage, séminaire ou groupe", body: "Pour un événement, Carole vous répond avec un devis adapté. Elle répond du lundi au vendredi, de 9 h à 19 h." },
  ];
  var QUESTIONS = [
    { id: "occasion", label: "Pour quelle occasion venez-vous (séjour, fête, mariage, séminaire, classe) ?" },
    { id: "chevaux", label: "Venez-vous avec des chevaux ? Combien ?" },
  ];

  var nuits = function (a, b) { return Math.round((date(b) - date(a)) / JOUR); };
  var chevauche = function (a, b, r) { return a < r.end && r.start < b; };
  var byId = function (id) { return LOGEMENTS.filter(function (l) { return l.id === id; })[0]; };
  var lies = function (l) { return [l.id].concat(l.contains, LOGEMENTS.filter(function (o) { return o.contains.indexOf(l.id) >= 0; }).map(function (o) { return o.id; })); };
  var libre = function (l, a, b) { return !lies(l).some(function (id) { return OCCUPE[id].some(function (r) { return chevauche(a, b, r); }); }); };

  // Le week-end ne se loue qu'en forfait 2 nuits (vendredi et samedi ensemble)
  function datesNuits(a, b) {
    var n = nuits(a, b), d = [];
    for (var i = 0; i < n; i++) d.push(iso(new Date(date(a).getTime() + i * JOUR)));
    return d;
  }
  function weekendEntier(a, b) {
    var d = datesNuits(a, b);
    return d.every(function (x) {
      var j = jourSemaine(x);
      if (j === 5) return d.indexOf(iso(new Date(date(x).getTime() + JOUR))) >= 0;
      if (j === 6) return d.indexOf(iso(new Date(date(x).getTime() - JOUR))) >= 0;
      return true;
    });
  }

  // 400 € la nuit en semaine ; 1400 € les nuits du vendredi et du samedi, soit 700 € chacune
  function prixNuits(l, a, b) {
    return datesNuits(a, b).map(function (d) {
      var j = jourSemaine(d);
      return { date: d, priceCents: (j === 5 || j === 6 ? 70000 : 40000) * l.facteur };
    });
  }
  var somme = function (t) { return t.reduce(function (s, x) { return s + x.priceCents; }, 0); };

  function planning() {
    return { hidden: false, today: iso(auj), privacyUrl: null, questions: QUESTIONS, conditions: CONDITIONS, options: OPTIONS,
      logements: LOGEMENTS.map(function (l) {
        return { id: l.id, name: l.name, kind: l.kind, capacity: l.capacity, note: l.note, image: new URL(l.image, location.href).href,
          minNights: l.minNights, minStays: [], contains: l.contains, occupied: OCCUPE[l.id] };
      }) };
  }

  function disponibilites(p) {
    var a = p.get("start"), b = p.get("end"), g = +p.get("guests") || 1, n = nuits(a, b);
    var regle = weekendEntier(a, b);
    return { hidden: false, nights: n, guests: g, logements: LOGEMENTS.map(function (l) {
      var ok = libre(l, a, b);
      return { id: l.id, name: l.name, kind: l.kind, capacity: l.capacity, note: l.note, image: new URL(l.image, location.href).href,
        fits: g <= l.capacity, minNights: l.minNights, available: ok && regle,
        reason: !ok ? "occupe" : !regle ? "nuits_minimum" : g > l.capacity ? "places" : null,
        accommodationCents: ok && regle ? somme(prixNuits(l, a, b)) : null };
    }) };
  }

  function devis(p) {
    var ids = (p.get("logement") || "").split(",").filter(Boolean), a = p.get("start"), b = p.get("end");
    var g = +p.get("guests") || 1, enfants = +p.get("children") || 0, n = nuits(a, b);
    var choisis = ids.map(byId).filter(Boolean);
    var dispo = choisis.length > 0 && weekendEntier(a, b) && choisis.every(function (l) { return libre(l, a, b); });
    var places = choisis.reduce(function (s, l) { return s + l.capacity; }, 0);
    var lignes = [], nuitees = {};
    choisis.forEach(function (l) {
      var t = prixNuits(l, a, b);
      t.forEach(function (x) { nuitees[x.date] = (nuitees[x.date] || 0) + x.priceCents; });
      lignes.push({ id: l.id, name: l.name, accommodationCents: somme(t) });
    });
    var hebergement = lignes.reduce(function (s, x) { return s + x.accommodationCents; }, 0);
    var voulues = (p.get("options") || "").split(",").filter(Boolean);
    var extras = OPTIONS.filter(function (o) {
      var permise = !o.logementIds.length || choisis.some(function (l) { return o.logementIds.indexOf(l.id) >= 0; });
      return permise && (o.mandatory || o.included || voulues.indexOf(o.id) >= 0);
    }).map(function (o) {
      var q = o.unit === "sejour" ? 1 : o.unit === "personne" ? g : o.unit === "personne_nuit" ? g * n : n;
      var e = { id: o.id, name: o.name, unit: o.unit, quantity: q, unitPriceCents: o.priceCents, totalCents: o.priceCents * q };
      if (o.mandatory) e.mandatory = true;
      if (o.included) e.included = true;
      return e;
    });
    return { hidden: false, available: dispo && g <= places, nights: n, guests: g, children: enfants,
      minNights: 1, capacity: places,
      nightly: Object.keys(nuitees).sort().map(function (d) { return { date: d, priceCents: nuitees[d] }; }),
      lines: lignes, accommodationCents: hebergement, extras: extras,
      totalCents: hebergement + extras.reduce(function (s, e) { return s + e.totalCents; }, 0) };
  }

  var repondre = function (corps) {
    return Promise.resolve(new Response(JSON.stringify(corps), { status: 200, headers: { "Content-Type": "application/json" } }));
  };
  var vraiFetch = window.fetch.bind(window);
  window.fetch = function (entree, init) {
    var url = typeof entree === "string" ? entree : entree && entree.url;
    if (!url || url.indexOf(DEMO_API) !== 0) return vraiFetch(entree, init);
    var u = new URL(url);
    // Démonstration : la demande et l'e-mail ne partent nulle part, le visiteur voit simplement « Merci »
    if (url.indexOf(DEMO_ENVOI) === 0 || /\/requests$/.test(u.pathname)) return repondre({ success: true, demo: true });
    if (/\/image\//.test(u.pathname)) return vraiFetch(entree, init);
    if (/\/planning$/.test(u.pathname)) return repondre(planning());
    if (/\/availability$/.test(u.pathname)) return repondre(disponibilites(u.searchParams));
    if (/\/quote$/.test(u.pathname)) return repondre(devis(u.searchParams));
    return Promise.resolve(new Response("{}", { status: 404 }));
  };
})();
