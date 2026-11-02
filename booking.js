/* =====================================================================
   French with Nelliane — booking system (one file shared by every page)

   HOW TO CHANGE THINGS
   - Prices ............ edit the LESSONS list below (price, unit).
   - Teaching hours .... edit CONFIG.hours (South Africa time, 0 = Sunday).
   - Days off .......... add dates to CONFIG.blockedDates ('2026-12-25'),
                         or single slots to CONFIG.blockedSlots ('2026-11-04 14:00').
   - Packages .......... CONFIG.packages = how many sessions a student can pay for
                         upfront (4 is the minimum).
   - Bank details ...... fill in CONFIG.payment: they then appear on the booking
                         PDF and on the confirmation screen. While empty, the PDF
                         says Nelliane sends her banking details on WhatsApp.
   - Service Agreement . the blank contract students download after booking is the
                         file named in CONFIG.agreementFile.
   - Automatic e-mail .. paste a form/webhook URL into CONFIG.endpoint
                         (see the note next to it).
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------
     1. SETTINGS
     --------------------------------------------------------------- */
  var TIMES = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00', '18:30', '19:30'];

  var CONFIG = {
    whatsapp: '27691783734',
    email: 'FrenchwithNelliane@gmail.com',
    tzOffsetMin: 120,      // South Africa (SAST) is UTC+2 all year, no daylight saving
    lessonMinutes: 60,
    leadHours: 24,         // earliest bookable slot = now + 24 h
    daysAhead: 60,         // how far ahead students can book
    // Teaching hours by weekday (South Africa time). Empty list = closed.
    hours: { 0: [], 1: TIMES, 2: TIMES, 3: TIMES, 4: TIMES, 5: TIMES, 6: TIMES },
    blockedDates: [],      // e.g. '2026-12-25'
    blockedSlots: [],      // e.g. '2026-11-04 14:00'
    // OPTIONAL — automatic e-mail copy. A static site cannot send e-mail by itself.
    // Paste the URL of a form/webhook service here (e.g. Formspree, Web3Forms, Make,
    // Zapier, Google Apps Script). The booking is sent to it as JSON the moment the
    // student confirms. Leave empty to use WhatsApp + calendar only.
    endpoint: '',
    // Sessions a student can pay for upfront. 4 is the minimum (service agreement, section 4).
    packages: [4, 8],
    agreementFile: 'French-with-Nelliane-Service-Agreement.pdf',
    // OPTIONAL — Nelliane's banking details. Fill in the lines you want shown; leave '' to hide.
    payment: { accountName: '', bank: '', accountType: '', accountNumber: '', branchCode: '' }
  };

  // Prices (South African Rand). price: null = custom quote.
  // min = sessions that must be booked and paid upfront (4 for every lesson type).
  var LESSONS = [
    { id: 'general', price: 500, unit: 'hour', min: 4,
      name: { en: 'General French', fr: 'Français général' },
      sub:  { en: 'Private one-to-one lessons', fr: 'Cours particuliers en tête-à-tête' } },
    { id: 'conversation', price: 450, unit: 'hour', min: 4,
      name: { en: 'Conversation sessions', fr: 'Séances de conversation' },
      sub:  { en: 'Relaxed speaking practice', fr: 'Pratique orale détendue' } },
    { id: 'professional', price: null, unit: 'hour', min: 4,
      name: { en: 'Professional French', fr: 'Français professionnel' },
      sub:  { en: 'Business & corporate communication', fr: 'Communication professionnelle et d\u2019entreprise' } },
    { id: 'academic', price: 700, unit: 'session', min: 4,
      name: { en: 'Academic support', fr: 'Soutien scolaire' },
      sub:  { en: 'School, homework & assessments', fr: 'École, devoirs et évaluations' } },
    { id: 'exam', price: 700, unit: 'session', min: 4,
      name: { en: 'Exam preparation', fr: 'Préparation aux examens' },
      sub:  { en: 'DILF · DELF · DALF · TEF · TCF', fr: 'DILF · DELF · DALF · TEF · TCF' } }
  ];

  /* ---------------------------------------------------------------
     2. TEXT (English + French)
     --------------------------------------------------------------- */
  var TXT = {
    en: {
      title: 'Book your session', close: 'Close',
      step: 'Step', stepNames: ['Lesson & package', 'Date', 'Time', 'Details', 'Review'],
      s0h: 'Choose your lesson', s0s: 'Prices are shown before you book. Pick the session that fits.',
      s1h: 'Choose the date of your first lesson', s1s: 'Nelliane schedules your remaining sessions with you once your payment is received.',
      s2h: 'Choose a time', s3h: 'Your details', s3s: 'So Nelliane can confirm your session.',
      s4h: 'Review your request',
      perHour: '/ hour', perSession: '/ session', quote: 'Custom quote', min60: '60 min',
      pricesHint: 'Prices are shown for each lesson above.',
      minNote: 'A minimum of 4 sessions is booked and paid upfront for every lesson type. In-person lessons add a travel fee based on your location.',
      prev: 'Previous month', next: 'Next month',
      wd: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      picked: 'Selected:',
      tzSA: 'Times are South Africa time (SAST).', tzYou: 'Your timezone:', tzShown: 'your local time is shown under each slot.',
      noSlots: 'No times left on this day. Please choose another date.',
      fName: 'Name', fEmail: 'Email', fAge: 'Age', fMode: 'Mode of sessions', fLevel: 'Your level', fFreq: 'Sessions per week',
      modes: ['Online', 'In person'],
      levels: ['Not sure', 'A1 — Beginner', 'A2 — Elementary', 'B1 — Intermediate', 'B2 — Upper intermediate', 'C1 — Advanced', 'C2 — Mastery'],
      freqs: ['Not sure yet', 'Once a week', 'Twice a week', 'Three times a week'],
      lLesson: 'Lesson', lDate: 'Date', lTime: 'Time (SA time)', lLocal: 'Your time', lMode: 'Mode', lLevel: 'Level', lName: 'Name', lEmail: 'Email',
      lAge: 'Age', lFreq: 'Sessions per week', lPrice: 'Price', upfront: 'Paid upfront ({n} lessons)',
      travel: 'In-person lessons add a travel fee based on your location.',
      reviewNote: 'Nelliane will confirm the final slot with you on WhatsApp.',
      eLesson: 'Please choose a lesson.', eDate: 'Please choose a date.', eTime: 'Please choose a time.',
      eName: 'Please add your name.', eEmail: 'Please enter a valid email address.',
      back: 'Back', cont: 'Continue', review: 'Review', confirm: 'Confirm request',
      okTitle: 'Request received', ref: 'Booking reference',
      okText: 'Thank you, {name}! To lock in your slot, pay upfront and send your proof of payment to Nelliane on WhatsApp. If WhatsApp did not open by itself, use the button below.',
      sendWa: 'Send on WhatsApp', addG: 'Add to Google Calendar', dlIcs: 'Download calendar file (.ics)', done: 'Done',
      st_none: 'Your calendar entry is marked “to be confirmed” until Nelliane replies.',
      st_sending: 'Sending a confirmation email…',
      st_sent: 'A confirmation was also emailed to {email}.',
      st_failed: 'We could not send the email copy. Please use the WhatsApp button.',
      waHello: 'Bonjour Nelliane!', waReq: 'Booking request', at: 'at', saShort: 'South Africa time',
      calTitle: 'French lesson with Nelliane (to be confirmed)',
      calOnline: 'Online', calPerson: 'In person (location to be confirmed)',
      calNote: 'Your slot is locked in once Nelliane receives your payment (POP). She confirms on WhatsApp.',
      pkgH: 'Pay upfront: choose your package',
      pkgS: 'Your slot is held once payment is received. Choose how many sessions to pay for now.',
      pkgMin: 'minimum', pkgN: '{n} sessions', pkgUp: 'upfront',
      lPackage: 'Package', lTotal: 'Total to pay upfront', quoteInvoice: 'Quoted on your invoice',
      payTitle: 'Pay upfront to confirm your slot',
      payBody: 'Slots are first come, first served and are locked in only when your payment and proof of payment (POP) are received. After you confirm, you get a PDF with the amount to pay and the steps to follow.',
      payTotal: 'Total to pay upfront: {total} ({n} sessions).',
      payQuote: 'The total for {n} sessions is quoted on your invoice.',
      payIntl: 'Paying from outside South Africa? Bank and transfer fees are paid by you, so the full amount in Rand must arrive net.',
      nextH: 'What to do next',
      next1: 'Pay {total} upfront ({n} sessions).',
      next1q: 'Pay the total on your invoice upfront ({n} sessions).',
      next2: 'Send your proof of payment (POP) to Nelliane on WhatsApp.',
      next3: 'Fill in and sign the Service Agreement, then send it back with your POP.',
      next4: 'Nelliane confirms your slot and schedules your remaining sessions.',
      bankH: 'Payment details', bankRef: 'Payment reference',
      bankNone: 'Nelliane sends her banking details and your invoice on WhatsApp.',
      bankName: 'Account name', bankBank: 'Bank', bankType: 'Account type', bankNo: 'Account number', bankBranch: 'Branch code',
      dlPdf: 'Download booking & payment instructions (PDF)', dlAgr: 'Download the Service Agreement (PDF)',
      pdfBusy: 'Preparing your PDF…',
      pdfFail: 'We could not create the PDF. Your request was still sent on WhatsApp, and Nelliane will send you the details.',
      waPay: 'I will pay upfront and send my proof of payment (POP).',
      pdf: {
        file: 'French-lesson-booking-', band: 'Professional Language Tuition',
        title: 'Booking & payment instructions',
        intro: 'Thank you for booking, {name}. To lock in your slot, please pay upfront and send your proof of payment. Everything you need is below.',
        due: 'TOTAL TO PAY UPFRONT', dueQuote: 'Quoted on your invoice',
        dueNote: 'Your slot is locked in only when your payment and proof of payment (POP) are received.',
        sessions: '{n} sessions', each: '{n} x {price}',
        s1: 'Your booking', ref: 'Booking reference', issued: 'Issued', lesson: 'Lesson', first: 'First lesson (South Africa time)',
        local: 'Your local time', mode: 'Mode', student: 'Student', email: 'Email', package: 'Package', price: 'Price',
        s2: 'How to confirm your slot',
        c1: 'Pay {total} upfront for {n} sessions.',
        c1q: 'Pay the total on your invoice upfront for {n} sessions.',
        c2: 'Send your proof of payment (POP) to Nelliane on WhatsApp: {wa}.',
        c3: 'Complete the information below, sign the Service Agreement and send it back with your POP.',
        c4: 'Nelliane confirms your slot and schedules your remaining sessions with you.',
        s3: 'Payment', payRef: 'Payment reference', payNone: 'Nelliane sends you her banking details and your invoice on WhatsApp.',
        intl: 'International clients: hourly rates are the same, but all transfer fees, bank levies and intermediary taxes are paid by the client. The full amount in Rand must arrive net.',
        s4: 'Information to complete (Service Agreement, section 1)',
        fName: 'Student / client full name', fId: 'Identity / passport number', fPhone: 'Contact telephone / WhatsApp',
        fAddr: 'Physical / residential address', fEmail: 'Email address', fDate: 'Agreement commencement date',
        fGuard: 'Parent / legal guardian full name (required for minors)',
        sign: 'Signature', date: 'Date',
        s5: 'Key terms you agree to',
        terms: [
          'A minimum block of 4 sessions must be booked and paid in full before any lesson is scheduled or starts.',
          'Slots are first come, first served and are guaranteed only on receipt of your proof of payment (POP).',
          'Cancel or reschedule in writing at least 24 hours before the lesson. Same-day cancellations (less than 24 hours) are forfeited and deducted from your paid sessions. No refunds or makeup lessons are given for late cancellations.',
          'In-person lessons: a transport fee, based on distance and venue, is added to the invoice before the session is confirmed.',
          'French with Nelliane is an independent tutoring service and not an official examination centre. Official exams are sat at accredited centres (for example Alliance Française).',
          'A certificate of completion is an internal recognition and is not accredited by any external body.'
        ],
        page: 'Page {n} of {m}'
      }
    },
    fr: {
      title: 'Réservez votre séance', close: 'Fermer',
      step: 'Étape', stepNames: ['Cours et forfait', 'Date', 'Heure', 'Coordonnées', 'Récapitulatif'],
      s0h: 'Choisissez votre cours', s0s: 'Les tarifs sont affichés avant de réserver. Choisissez la séance qui vous convient.',
      s1h: 'Choisissez la date de votre premier cours', s1s: 'Nelliane planifie avec vous vos autres séances dès réception de votre paiement.',
      s2h: 'Choisissez une heure', s3h: 'Vos coordonnées', s3s: 'Pour que Nelliane puisse confirmer votre séance.',
      s4h: 'Vérifiez votre demande',
      perHour: '/ heure', perSession: '/ séance', quote: 'Sur devis', min60: '60 min',
      pricesHint: 'Les tarifs sont affichés pour chaque cours ci-dessus.',
      minNote: 'Un minimum de 4 séances est réservé et réglé à l’avance pour chaque type de cours. Les cours en présentiel ajoutent des frais de déplacement selon votre lieu.',
      prev: 'Mois précédent', next: 'Mois suivant',
      wd: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
      picked: 'Sélection :',
      tzSA: 'Les heures sont celles de l\u2019Afrique du Sud (SAST).', tzYou: 'Votre fuseau :', tzShown: 'votre heure locale est indiquée sous chaque créneau.',
      noSlots: 'Plus de créneaux ce jour-là. Choisissez une autre date.',
      fName: 'Nom', fEmail: 'Email', fAge: 'Âge', fMode: 'Mode des cours', fLevel: 'Votre niveau', fFreq: 'Séances par semaine',
      modes: ['En ligne', 'En présentiel'],
      levels: ['Je ne sais pas', 'A1 — Débutant', 'A2 — Élémentaire', 'B1 — Intermédiaire', 'B2 — Intermédiaire supérieur', 'C1 — Avancé', 'C2 — Maîtrise'],
      freqs: ['Pas encore sûr(e)', 'Une fois par semaine', 'Deux fois par semaine', 'Trois fois par semaine'],
      lLesson: 'Cours', lDate: 'Date', lTime: 'Heure (Afrique du Sud)', lLocal: 'Votre heure', lMode: 'Mode', lLevel: 'Niveau', lName: 'Nom', lEmail: 'Email',
      lAge: 'Âge', lFreq: 'Séances par semaine', lPrice: 'Tarif', upfront: 'Réglé à l\u2019avance ({n} cours)',
      travel: 'Les cours en présentiel ajoutent des frais de déplacement selon votre lieu.',
      reviewNote: 'Nelliane confirmera le créneau définitif avec vous sur WhatsApp.',
      eLesson: 'Choisissez un cours.', eDate: 'Choisissez une date.', eTime: 'Choisissez une heure.',
      eName: 'Ajoutez votre nom.', eEmail: 'Entrez une adresse email valide.',
      back: 'Retour', cont: 'Continuer', review: 'Vérifier', confirm: 'Confirmer la demande',
      okTitle: 'Demande reçue', ref: 'Référence de réservation',
      okText: 'Merci, {name} ! Pour verrouiller votre créneau, payez à l’avance et envoyez votre preuve de paiement à Nelliane sur WhatsApp. Si WhatsApp ne s’est pas ouvert tout seul, utilisez le bouton ci-dessous.',
      sendWa: 'Envoyer sur WhatsApp', addG: 'Ajouter à Google Agenda', dlIcs: 'Télécharger le fichier agenda (.ics)', done: 'Terminé',
      st_none: 'Votre rendez-vous est marqué « à confirmer » jusqu\u2019à la réponse de Nelliane.',
      st_sending: 'Envoi de l\u2019email de confirmation…',
      st_sent: 'Une confirmation a aussi été envoyée à {email}.',
      st_failed: 'Nous n\u2019avons pas pu envoyer la copie par email. Utilisez le bouton WhatsApp.',
      waHello: 'Bonjour Nelliane !', waReq: 'Demande de réservation', at: 'à', saShort: 'heure d\u2019Afrique du Sud',
      calTitle: 'Cours de français avec Nelliane (à confirmer)',
      calOnline: 'En ligne', calPerson: 'En présentiel (lieu à confirmer)',
      calNote: 'Votre créneau est verrouillé dès que Nelliane reçoit votre paiement (POP). Elle confirme sur WhatsApp.',
      pkgH: 'Payez à l’avance : choisissez votre forfait',
      pkgS: 'Votre créneau est réservé dès réception du paiement. Choisissez le nombre de séances à régler maintenant.',
      pkgMin: 'minimum', pkgN: '{n} séances', pkgUp: 'à l’avance',
      lPackage: 'Forfait', lTotal: 'Total à régler à l’avance', quoteInvoice: 'Indiqué sur votre facture',
      payTitle: 'Payez à l’avance pour confirmer votre créneau',
      payBody: 'Les créneaux sont attribués selon le principe du premier arrivé, premier servi et ne sont verrouillés qu’à réception de votre paiement et de votre preuve de paiement (POP). Après confirmation, vous recevez un PDF avec le montant à régler et les étapes à suivre.',
      payTotal: 'Total à régler à l’avance : {total} ({n} séances).',
      payQuote: 'Le total pour {n} séances est indiqué sur votre facture.',
      payIntl: 'Vous payez depuis l’étranger ? Les frais bancaires et de virement sont à votre charge : le montant complet en Rand doit arriver net.',
      nextH: 'Prochaines étapes',
      next1: 'Réglez {total} à l’avance ({n} séances).',
      next1q: 'Réglez à l’avance le total indiqué sur votre facture ({n} séances).',
      next2: 'Envoyez votre preuve de paiement (POP) à Nelliane sur WhatsApp.',
      next3: 'Remplissez et signez le contrat de services, puis renvoyez-le avec votre POP.',
      next4: 'Nelliane confirme votre créneau et planifie vos séances restantes.',
      bankH: 'Coordonnées de paiement', bankRef: 'Référence de paiement',
      bankNone: 'Nelliane vous envoie ses coordonnées bancaires et votre facture sur WhatsApp.',
      bankName: 'Titulaire du compte', bankBank: 'Banque', bankType: 'Type de compte', bankNo: 'Numéro de compte', bankBranch: 'Code agence',
      dlPdf: 'Télécharger les instructions de réservation et de paiement (PDF)', dlAgr: 'Télécharger le contrat de services (PDF)',
      pdfBusy: 'Préparation de votre PDF…',
      pdfFail: 'Nous n’avons pas pu créer le PDF. Votre demande a bien été envoyée sur WhatsApp et Nelliane vous enverra les détails.',
      waPay: 'Je vais payer à l’avance et envoyer ma preuve de paiement (POP).',
      pdf: {
        file: 'Reservation-cours-francais-', band: 'Cours de langue professionnels',
        title: 'Instructions de réservation et de paiement',
        intro: 'Merci pour votre réservation, {name}. Pour verrouiller votre créneau, payez à l’avance et envoyez votre preuve de paiement. Tout ce dont vous avez besoin se trouve ci-dessous.',
        due: 'TOTAL À RÉGLER À L’AVANCE', dueQuote: 'Indiqué sur votre facture',
        dueNote: 'Votre créneau n’est verrouillé qu’à réception de votre paiement et de votre preuve de paiement (POP).',
        sessions: '{n} séances', each: '{n} x {price}',
        s1: 'Votre réservation', ref: 'Référence de réservation', issued: 'Émis le', lesson: 'Cours', first: 'Premier cours (heure d’Afrique du Sud)',
        local: 'Votre heure locale', mode: 'Mode', student: 'Élève', email: 'Email', package: 'Forfait', price: 'Tarif',
        s2: 'Comment confirmer votre créneau',
        c1: 'Réglez {total} à l’avance pour {n} séances.',
        c1q: 'Réglez à l’avance le total indiqué sur votre facture pour {n} séances.',
        c2: 'Envoyez votre preuve de paiement (POP) à Nelliane sur WhatsApp : {wa}.',
        c3: 'Complétez les informations ci-dessous, signez le contrat de services et renvoyez-le avec votre POP.',
        c4: 'Nelliane confirme votre créneau et planifie avec vous vos séances restantes.',
        s3: 'Paiement', payRef: 'Référence de paiement', payNone: 'Nelliane vous envoie ses coordonnées bancaires et votre facture sur WhatsApp.',
        intl: 'Clients internationaux : les tarifs horaires sont identiques, mais tous les frais de virement, taxes bancaires et taxes d’intermédiaires sont à la charge du client. Le montant complet en Rand doit arriver net.',
        s4: 'Informations à compléter (contrat de services, section 1)',
        fName: 'Nom complet de l’élève / du client', fId: 'Numéro d’identité / de passeport', fPhone: 'Téléphone / WhatsApp',
        fAddr: 'Adresse de résidence', fEmail: 'Adresse email', fDate: 'Date de début du contrat',
        fGuard: 'Parent / tuteur légal : nom complet (obligatoire pour les mineurs)',
        sign: 'Signature', date: 'Date',
        s5: 'Conditions principales que vous acceptez',
        terms: [
          'Un bloc minimum de 4 séances doit être réservé et réglé intégralement avant toute planification ou tout début de cours.',
          'Les créneaux sont attribués selon le principe du premier arrivé, premier servi et ne sont garantis qu’à réception de votre preuve de paiement (POP).',
          'Annulez ou reportez par écrit au moins 24 heures avant le cours. Les annulations le jour même (moins de 24 heures) sont perdues et déduites de vos séances payées. Aucun remboursement ni cours de rattrapage pour les annulations tardives.',
          'Cours en présentiel : des frais de transport, selon la distance et le lieu, sont ajoutés à la facture avant la confirmation de la séance.',
          'French with Nelliane est un service de tutorat indépendant et non un centre d’examen officiel. Les examens officiels se passent dans des centres agréés (par exemple l’Alliance Française).',
          'Un certificat de fin de parcours est une reconnaissance interne, non accréditée par un organisme externe.'
        ],
        page: 'Page {n} sur {m}'
      }
    }
  };

  /* ---------------------------------------------------------------
     3. HELPERS
     --------------------------------------------------------------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function track(n, p) { try { if (window.fwnTrack) window.fwnTrack(n, p); } catch (e) {} }

  function lang() { return document.documentElement.lang === 'fr' ? 'fr' : 'en'; }
  function loc() { return lang() === 'fr' ? 'fr-FR' : 'en-GB'; }
  function tx() { return TXT[lang()]; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function isoOf(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }   // m is 0-based
  function parseIso(iso) { var p = iso.split('-'); return { y: +p[0], m: +p[1] - 1, d: +p[2] }; }
  function sastNow() { return new Date(Date.now() + CONFIG.tzOffsetMin * 60000); }
  function todayIso() { var n = sastNow(); return isoOf(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()); }
  function addDaysIso(iso, n) {
    var p = parseIso(iso), d = new Date(Date.UTC(p.y, p.m, p.d + n));
    return isoOf(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  function weekday(iso) { var p = parseIso(iso); return new Date(Date.UTC(p.y, p.m, p.d)).getUTCDay(); }
  function slotMs(iso, time) {
    var p = parseIso(iso), t = time.split(':');
    return Date.UTC(p.y, p.m, p.d, +t[0], +t[1]) - CONFIG.tzOffsetMin * 60000;
  }
  function money(n) { return 'R' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
  function lessonById(id) {
    for (var i = 0; i < LESSONS.length; i++) if (LESSONS[i].id === id) return LESSONS[i];
    return null;
  }
  function unitText(L) { var T = tx(); return L.unit === 'hour' ? T.perHour : T.perSession; }
  function priceText(L) { return L.price == null ? tx().quote.toLowerCase() : money(L.price) + ' ' + unitText(L); }
  // Total for n sessions paid upfront (null for a custom quote).
  function totalFor(L, n) { return L && L.price != null ? L.price * n : null; }
  function totalText(L, n) { var t = totalFor(L, n); return t == null ? tx().quoteInvoice : money(t); }
  function fmtN(s, vars) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }); }
  function waDisplay() {
    var w = CONFIG.whatsapp;
    return '+' + w.slice(0, 2) + ' ' + w.slice(2, 4) + ' ' + w.slice(4, 7) + ' ' + w.slice(7);
  }
  // Banking lines that Nelliane has filled in (empty ones are skipped).
  function bankRows() {
    var T = tx(), p = CONFIG.payment || {}, rows = [];
    [['accountName', T.bankName], ['bank', T.bankBank], ['accountType', T.bankType], ['accountNumber', T.bankNo], ['branchCode', T.bankBranch]]
      .forEach(function (r) { if (p[r[0]]) rows.push([r[1], p[r[0]]]); });
    return rows;
  }
  function fmtDate(iso) {
    var p = parseIso(iso);
    return new Intl.DateTimeFormat(loc(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(p.y, p.m, p.d)));
  }
  function monthLabel(y, m) {
    return new Intl.DateTimeFormat(loc(), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m, 1)));
  }
  function userTz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } }

  // Slots of one South-Africa calendar day, each flagged bookable or not.
  function slotsFor(iso) {
    if (CONFIG.blockedDates.indexOf(iso) > -1) return [];
    var list = CONFIG.hours[weekday(iso)] || [];
    var earliest = Date.now() + CONFIG.leadHours * 3600000;
    return list.map(function (t) {
      var ms = slotMs(iso, t);
      return { time: t, ms: ms, ok: ms >= earliest && CONFIG.blockedSlots.indexOf(iso + ' ' + t) === -1 };
    });
  }
  function dateOk(iso) {
    var t = todayIso();
    if (iso < t || iso > addDaysIso(t, CONFIG.daysAhead)) return false;
    return slotsFor(iso).some(function (s) { return s.ok; });
  }
  function firstAvailableIso() {
    var t = todayIso();
    for (var i = 0; i <= CONFIG.daysAhead; i++) { var iso = addDaysIso(t, i); if (dateOk(iso)) return iso; }
    return t;
  }

  // The student's own local time for a slot (empty when it equals South Africa time).
  function localTime(ms, iso) {
    var d = new Date(ms);
    if (-d.getTimezoneOffset() === CONFIG.tzOffsetMin) return '';
    var time = new Intl.DateTimeFormat(loc(), { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
    var day = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    if (day !== iso) time = new Intl.DateTimeFormat(loc(), { weekday: 'short' }).format(d) + ' ' + time;
    return time;
  }

  /* ---------------------------------------------------------------
     4. STATE
     --------------------------------------------------------------- */
  function fresh() {
    return {
      step: 0, done: false, lesson: '', sessions: 4, date: '', time: '', viewY: null, viewM: null,
      details: { name: '', email: '', age: '', mode: 0, level: 0, freq: 0 },
      ref: '', emailStatus: 'none'
    };
  }
  var state = fresh();
  var els = {};
  var lastFocus = null;

  function makeRef() {
    var p = parseIso(state.date), rnd = '';
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var buf = (window.crypto && crypto.getRandomValues) ? crypto.getRandomValues(new Uint8Array(4)) : null;
    for (var i = 0; i < 4; i++) rnd += chars.charAt((buf ? buf[i] : Math.floor(Math.random() * 256)) % chars.length);
    return 'FN-' + String(p.y).slice(2) + pad(p.m + 1) + pad(p.d) + '-' + rnd;
  }

  /* ---------------------------------------------------------------
     5. PANELS
     --------------------------------------------------------------- */
  function panelLesson() {
    var T = tx(), L = lang(), h = ['<h4>' + T.s0h + '</h4><p class="bk-sub">' + T.s0s + '</p>'];
    LESSONS.forEach(function (x) {
      var cost = x.price == null
        ? '<strong class="quote">' + T.quote + '</strong>'
        : '<strong>' + money(x.price) + '</strong>';
      var unit = (x.price == null ? '' : unitText(x) + ' · ') + T.min60;
      h.push('<button type="button" class="bk-choice" data-lesson="' + x.id + '" aria-pressed="' + (state.lesson === x.id) + '">' +
        '<span><b>' + esc(x.name[L]) + '</b><span class="bk-desc">' + esc(x.sub[L]) + '</span></span>' +
        '<span class="bk-cost">' + cost + '<small>' + unit + '</small></span></button>');
    });
    h.push('<h4 class="bk-pkgh">' + T.pkgH + '</h4><p class="bk-sub">' + T.pkgS + '</p><div class="bk-pkgs" role="group" aria-label="' + esc(T.pkgH) + '">');
    CONFIG.packages.forEach(function (n) {
      h.push('<button type="button" class="bk-pkg" data-sessions="' + n + '" aria-pressed="' + (state.sessions === n) + '">' +
        '<b>' + fmtN(T.pkgN, { n: n }) + '</b>' + (n === CONFIG.packages[0] ? '<small>' + T.pkgMin + '</small>' : '<small>&nbsp;</small>') +
        '<strong data-pkgtotal="' + n + '">' + esc(state.lesson ? totalText(lessonById(state.lesson), n) : '—') + '</strong></button>');
    });
    h.push('</div><p class="bk-note">' + T.minNote + '</p>');
    return h.join('');
  }

  function updatePkgTotals() {
    var L = lessonById(state.lesson), nodes = els.panel.querySelectorAll('[data-pkgtotal]');
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = L ? totalText(L, +nodes[i].getAttribute('data-pkgtotal')) : '—';
  }

  function canNav(dir) {
    var t = parseIso(todayIso()), last = parseIso(addDaysIso(todayIso(), CONFIG.daysAhead));
    var cur = state.viewY * 12 + state.viewM;
    return dir < 0 ? cur > t.y * 12 + t.m : cur < last.y * 12 + last.m;
  }

  function panelDate() {
    var T = tx(), y = state.viewY, m = state.viewM;
    var first = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7;        // Monday first
    var dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    var today = todayIso(), h = [];
    h.push('<h4>' + T.s1h + '</h4><p class="bk-sub">' + T.s1s + '</p>');
    h.push('<div class="bk-cal"><div class="bk-calhead">' +
      '<button type="button" class="bk-navbtn" data-nav="-1" aria-label="' + T.prev + '"' + (canNav(-1) ? '' : ' disabled') + '>‹</button>' +
      '<strong>' + esc(monthLabel(y, m)) + '</strong>' +
      '<button type="button" class="bk-navbtn" data-nav="1" aria-label="' + T.next + '"' + (canNav(1) ? '' : ' disabled') + '>›</button></div>');
    h.push('<div class="bk-wd" aria-hidden="true">' + T.wd.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div><div class="bk-days">');
    for (var i = 0; i < first; i++) h.push('<span></span>');
    for (var d = 1; d <= dim; d++) {
      var iso = isoOf(y, m, d), sel = iso === state.date;
      h.push('<button type="button" class="bk-day' + (sel ? ' sel' : '') + (iso === today ? ' today' : '') + '" data-date="' + iso + '"' +
        (dateOk(iso) ? '' : ' disabled') + ' aria-pressed="' + sel + '" aria-label="' + esc(fmtDate(iso)) + '">' + d + '</button>');
    }
    h.push('</div></div>');
    h.push('<p class="bk-picked" id="bkPicked">' + (state.date ? T.picked + ' ' + esc(fmtDate(state.date)) : '') + '</p>');
    return h.join('');
  }

  function panelTime() {
    var T = tx(), slots = slotsFor(state.date), h = [];
    h.push('<h4>' + T.s2h + '</h4><p class="bk-sub">' + esc(fmtDate(state.date)) + '</p>');
    var note = T.tzSA, tz = userTz();
    if (slots.length && -new Date(slots[0].ms).getTimezoneOffset() !== CONFIG.tzOffsetMin) {
      note += ' ' + T.tzYou + ' ' + esc(tz) + ' — ' + T.tzShown;
    }
    if (!slots.some(function (s) { return s.ok; })) {
      h.push('<div class="bk-empty">' + T.noSlots + '</div>');
    } else {
      h.push('<div class="bk-slots">');
      slots.forEach(function (s) {
        var lt = localTime(s.ms, state.date), sel = s.time === state.time;
        h.push('<button type="button" class="bk-slot' + (sel ? ' sel' : '') + '" data-time="' + s.time + '"' + (s.ok ? '' : ' disabled') +
          ' aria-pressed="' + sel + '"><b>' + s.time + '</b>' + (lt ? '<small>' + esc(lt) + '</small>' : '') + '</button>');
      });
      h.push('</div><p class="bk-note">' + note + '</p>');
    }
    return h.join('');
  }

  function opts(arr, sel) {
    return arr.map(function (o, i) { return '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('');
  }

  function panelDetails() {
    var T = tx(), d = state.details;
    return '<h4>' + T.s3h + '</h4><p class="bk-sub">' + T.s3s + '</p>' +
      '<div class="frow"><div class="field"><label for="bkName">' + T.fName + '</label><input type="text" id="bkName" data-field="name" autocomplete="name" value="' + esc(d.name) + '"></div>' +
      '<div class="field"><label for="bkEmail">' + T.fEmail + '</label><input type="email" id="bkEmail" data-field="email" autocomplete="email" placeholder="you@email.com" value="' + esc(d.email) + '"></div></div>' +
      '<div class="frow"><div class="field"><label for="bkAge">' + T.fAge + '</label><input type="number" id="bkAge" data-field="age" min="1" placeholder="—" value="' + esc(d.age) + '"></div>' +
      '<div class="field"><label for="bkMode">' + T.fMode + '</label><select id="bkMode" data-field="mode">' + opts(T.modes, d.mode) + '</select></div></div>' +
      '<div class="frow"><div class="field"><label for="bkLevel">' + T.fLevel + '</label><select id="bkLevel" data-field="level">' + opts(T.levels, d.level) + '</select></div>' +
      '<div class="field"><label for="bkFreq">' + T.fFreq + '</label><select id="bkFreq" data-field="freq">' + opts(T.freqs, d.freq) + '</select></div></div>';
  }

  function summaryRows(withEmail) {
    var T = tx(), L = lessonById(state.lesson), d = state.details, ms = slotMs(state.date, state.time);
    var lt = localTime(ms, state.date), rows = [];
    function row(k, v, cls) { rows.push('<div' + (cls ? ' class="' + cls + '"' : '') + '><span>' + k + '</span><b>' + v + '</b></div>'); }
    row(T.lLesson, esc(L.name[lang()]));
    row(T.lDate, esc(fmtDate(state.date)));
    row(T.lTime, esc(state.time));
    if (lt) row(T.lLocal, esc(lt));
    row(T.lMode, esc(T.modes[d.mode]));
    row(T.lLevel, esc(T.levels[d.level]));
    row(T.lName, esc(d.name));
    if (withEmail) row(T.lEmail, esc(d.email));
    row(T.lPrice, esc(priceText(L)));
    row(T.lPackage, esc(fmtN(T.pkgN, { n: state.sessions })));
    row(T.lTotal, esc(totalText(L, state.sessions)), 'total');
    return '<div class="bk-sum">' + rows.join('') + '</div>';
  }

  // Prominent "pay upfront" box: used on the review step and the confirmation screen.
  function payBox(withBody) {
    var T = tx(), L = lessonById(state.lesson), n = state.sessions;
    var line = totalFor(L, n) == null ? fmtN(T.payQuote, { n: n }) : fmtN(T.payTotal, { total: money(totalFor(L, n)), n: n });
    var h = '<div class="bk-pay"><strong>' + T.payTitle + '</strong>' + (withBody ? '<p>' + T.payBody + '</p>' : '') + '<p class="bk-payamt">' + esc(line) + '</p>';
    if (userOutsideSA()) h += '<p class="bk-payintl">' + T.payIntl + '</p>';
    return h + '</div>';
  }
  function userOutsideSA() { return -new Date().getTimezoneOffset() !== CONFIG.tzOffsetMin; }

  function panelReview() {
    var T = tx(), h = '<h4>' + T.s4h + '</h4><p class="bk-sub">' + T.reviewNote + '</p>' + payBox(true) + summaryRows(true);
    if (state.details.mode === 1) h += '<p class="bk-note">' + T.travel + '</p>';
    return h;
  }

  function statusText() {
    var T = tx();
    if (state.emailStatus === 'sent') return T.st_sent.replace('{email}', esc(state.details.email));
    return T['st_' + state.emailStatus] || T.st_none;
  }

  function panelDone() {
    var T = tx(), L = lessonById(state.lesson), n = state.sessions, first = esc((state.details.name || '').trim().split(/\s+/)[0] || '');
    var quote = totalFor(L, n) == null, bank = bankRows();
    var steps = [quote ? fmtN(T.next1q, { n: n }) : fmtN(T.next1, { total: money(totalFor(L, n)), n: n }), T.next2, T.next3, T.next4];
    var bankHtml = '<div class="bk-bank"><b>' + T.bankH + '</b>' + (bank.length
      ? bank.map(function (r) { return '<div><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>'; }).join('') +
        '<div><span>' + T.bankRef + '</span><b>' + esc(state.ref) + '</b></div>'
      : '<p>' + T.bankNone + '</p><div><span>' + T.bankRef + '</span><b>' + esc(state.ref) + '</b></div>') + '</div>';
    return '<div class="bk-done"><div class="bk-check"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></div>' +
      '<h3>' + T.okTitle + '</h3><p>' + T.okText.replace('{name}', first) + '</p>' +
      '<div class="bk-ref">' + T.ref + ': ' + esc(state.ref) + '</div></div>' +
      payBox(false) +
      '<h4 class="bk-nexth">' + T.nextH + '</h4><ol class="bk-next">' + steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      bankHtml +
      summaryRows(false) +
      '<div class="bk-actions">' +
      '<button type="button" class="btn btn-gold" data-act="pdf">' + T.dlPdf + '</button>' +
      '<a class="btn btn-ghost" href="' + esc(CONFIG.agreementFile) + '" target="_blank" rel="noopener" download data-track="agreement">' + T.dlAgr + '</a>' +
      '<a class="btn btn-ghost" href="' + esc(waUrl()) + '" target="_blank" rel="noopener">' + T.sendWa + '</a>' +
      '<a class="btn btn-ghost" data-track="gcal" href="' + esc(gcalUrl()) + '" target="_blank" rel="noopener">' + T.addG + '</a>' +
      '<button type="button" class="btn btn-ghost" data-act="ics">' + T.dlIcs + '</button>' +
      '<button type="button" class="btn btn-ink" data-act="done">' + T.done + '</button></div>' +
      '<p class="bk-err" id="bkPdfMsg" role="alert" hidden></p>' +
      '<p class="bk-status" id="bkStatus">' + statusText() + '</p>';
  }

  /* ---------------------------------------------------------------
     6. MESSAGES, CALENDAR, SUBMISSION
     --------------------------------------------------------------- */
  function waText() {
    var T = tx(), L = lessonById(state.lesson), d = state.details, ms = slotMs(state.date, state.time), lt = localTime(ms, state.date);
    var lines = [
      T.waHello + ' ' + T.waReq + ' ' + state.ref,
      '• ' + T.lLesson + ': ' + L.name[lang()] + ' (' + priceText(L) + ')',
      '• ' + T.lPackage + ': ' + fmtN(T.pkgN, { n: state.sessions }) + ' — ' + T.lTotal + ': ' + totalText(L, state.sessions),
      '• ' + T.lDate + ': ' + fmtDate(state.date) + ' ' + T.at + ' ' + state.time + ' (' + T.saShort + ')'
    ];
    if (lt) lines.push('• ' + T.lLocal + ': ' + lt + (userTz() ? ' (' + userTz() + ')' : ''));
    lines.push('• ' + T.lName + ': ' + d.name, '• ' + T.lEmail + ': ' + d.email, '• ' + T.lAge + ': ' + (d.age || '—'),
      '• ' + T.lLevel + ': ' + T.levels[d.level], '• ' + T.lMode + ': ' + T.modes[d.mode], '• ' + T.lFreq + ': ' + T.freqs[d.freq], '', T.waPay);
    return lines.join('\n');
  }
  function waUrl() { return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(waText()); }

  function eventInfo() {
    var T = tx(), L = lessonById(state.lesson), ms = slotMs(state.date, state.time);
    var where = state.details.mode === 1 ? T.calPerson : T.calOnline;
    return {
      start: ms, end: ms + CONFIG.lessonMinutes * 60000,
      title: T.calTitle,
      where: where,
      details: L.name[lang()] + ' — ' + priceText(L) + '\n' + T.ref + ': ' + state.ref + '\n' + T.calNote + '\nWhatsApp: +' + CONFIG.whatsapp
    };
  }
  function stamp(ms) { return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }

  function gcalUrl() {
    var e = eventInfo();
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(e.title) +
      '&dates=' + stamp(e.start) + '/' + stamp(e.end) +
      '&details=' + encodeURIComponent(e.details) +
      '&location=' + encodeURIComponent(e.where);
  }

  function icsEscape(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function icsFold(line) {
    var out = [];
    while (line.length > 70) { out.push(line.slice(0, 70)); line = ' ' + line.slice(70); }
    out.push(line);
    return out.join('\r\n');
  }
  function buildIcs() {
    var e = eventInfo();
    var lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//French with Nelliane//Booking//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + state.ref + '@frenchwithnelliane.co.za',
      'DTSTAMP:' + stamp(Date.now()),
      'DTSTART:' + stamp(e.start),
      'DTEND:' + stamp(e.end),
      'SUMMARY:' + icsEscape(e.title),
      'DESCRIPTION:' + icsEscape(e.details),
      'LOCATION:' + icsEscape(e.where),
      'STATUS:TENTATIVE',
      'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape(e.title), 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ];
    return lines.map(icsFold).join('\r\n') + '\r\n';
  }
  function downloadIcs() {
    var blob = new Blob([buildIcs()], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'french-lesson-' + state.ref + '.ics';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function payload() {
    var L = lessonById(state.lesson), d = state.details, T = TXT.en, e = eventInfo();
    return {
      reference: state.ref,
      _subject: 'Booking request ' + state.ref + ' — ' + L.name.en,
      _replyto: d.email,
      lesson: L.name.en,
      sessions_paid_upfront: state.sessions,
      total_upfront: totalFor(L, state.sessions) == null ? 'Quoted on invoice' : money(totalFor(L, state.sessions)),
      price: L.price == null ? 'Custom quote' : money(L.price) + ' ' + (L.unit === 'hour' ? 'per hour' : 'per session'),
      date_sa: state.date, time_sa: state.time + ' (South Africa time)',
      start_utc: new Date(e.start).toISOString(), end_utc: new Date(e.end).toISOString(),
      student_timezone: userTz(),
      name: d.name, email: d.email, age: d.age,
      level: T.levels[d.level], mode: T.modes[d.mode], sessions_per_week: T.freqs[d.freq],
      language: lang(), message: waText()
    };
  }
  function postBooking() {
    state.emailStatus = 'sending';
    var ref = state.ref;
    return fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload())
    }).then(function (r) { return r.ok; }).catch(function () { return false; }).then(function (ok) {
      if (state.ref !== ref) return;
      state.emailStatus = ok ? 'sent' : 'failed';
      var s = document.getElementById('bkStatus');
      if (s) s.innerHTML = statusText();
    });
  }

  function submit() {
    state.ref = makeRef();
    window.open(waUrl(), '_blank', 'noopener');      // inside the click, so browsers allow it
    state.emailStatus = 'none';
    state.step = 5;
    var Ls = lessonById(state.lesson);
    track('generate_lead', { lesson: Ls.id, sessions: state.sessions, value: totalFor(Ls, state.sessions) || 0, currency: 'ZAR' });
    render(true);
    if (CONFIG.endpoint) { postBooking(); var s = document.getElementById('bkStatus'); if (s) s.innerHTML = statusText(); }
  }

  /* ---------------------------------------------------------------
     6b. BOOKING & PAYMENT INSTRUCTIONS (PDF, built in the student's browser)
     jsPDF is only loaded when the student clicks the download button.
     --------------------------------------------------------------- */
  function loadPdfLib() {
    return new Promise(function (resolve, reject) {
      if (window.jspdf && window.jspdf.jsPDF) return resolve(window.jspdf.jsPDF);
      var s = document.createElement('script');
      s.src = 'jspdf.umd.min.js';
      s.onload = function () { window.jspdf && window.jspdf.jsPDF ? resolve(window.jspdf.jsPDF) : reject(new Error('jsPDF missing')); };
      s.onerror = function () { reject(new Error('jsPDF failed to load')); };
      document.head.appendChild(s);
    });
  }

  // The built-in PDF fonts only know Latin-1: swap curly quotes, dashes and other symbols.
  function pdfSafe(s) {
    return String(s == null ? '' : s)
      .replace(/ /g, ' ').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/[–—]/g, '-').replace(/…/g, '...').replace(/•/g, '-')
      .replace(/[^\x09\x0a\x0d\x20-\x7e\xa0-\xff]/g, '');
  }

  function buildPdf(jsPDF) {
    var T = tx(), P = T.pdf, L = lessonById(state.lesson), d = state.details, n = state.sessions;
    var doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    var W = 210, H = 297, M = 16, CW = W - 2 * M, y = 0;
    var NAVY = [18, 35, 63], GOLD = [194, 154, 75], INK = [32, 36, 43], MUTED = [114, 106, 89], LINE = [222, 215, 198], PALE = [246, 241, 230];
    var total = totalFor(L, n), ms = slotMs(state.date, state.time), lt = localTime(ms, state.date);
    var first = (d.name || '').trim().split(/\s+/)[0] || '';
    var money2 = function (v) { return pdfSafe(money(v)); };

    function S(s) { return pdfSafe(s); }
    function ink(c) { doc.setTextColor(c[0], c[1], c[2]); }
    function stroke(c, w) { doc.setDrawColor(c[0], c[1], c[2]); doc.setLineWidth(w); }
    function fill(c) { doc.setFillColor(c[0], c[1], c[2]); }
    function font(style, size) { doc.setFont('helvetica', style); doc.setFontSize(size); }
    function wrap(text, w) { return doc.splitTextToSize(S(text), w); }
    function ensure(h) { if (y + h > H - 20) { doc.addPage(); y = M + 2; } }

    function heading(text) {
      ensure(18); y += 3;
      font('bold', 12.5); ink(NAVY); doc.text(S(text), M, y + 4.2); y += 7;
      stroke(GOLD, 0.5); doc.line(M, y, M + CW, y); y += 3.5;
    }
    function para(text, size, style, c, lh) {
      font(style, size); ink(c);
      var ls = wrap(text, CW); ensure(ls.length * lh + 1);
      ls.forEach(function (l) { doc.text(l, M, y + lh * 0.75); y += lh; });
      y += 1;
    }
    function kv(label, value, strong) {
      font(strong ? 'bold' : 'normal', 10);
      var ls = wrap(value, CW - 56), h = Math.max(1, ls.length) * 5 + 1.8;
      ensure(h);
      font('normal', 9); ink(MUTED); doc.text(S(label), M, y + 3.8);
      font(strong ? 'bold' : 'normal', 10); ink(INK);
      ls.forEach(function (l, i) { doc.text(l, M + 56, y + 3.8 + i * 5); });
      y += h; stroke(LINE, 0.2); doc.line(M, y - 0.9, M + CW, y - 0.9);
    }
    function check(text) {
      font('normal', 10);
      var ls = wrap(text, CW - 9), h = ls.length * 5 + 2.4;
      ensure(h); stroke(NAVY, 0.4); doc.rect(M, y + 0.9, 4, 4);
      font('normal', 10); ink(INK);
      ls.forEach(function (l, i) { doc.text(l, M + 8, y + 4 + i * 5); });
      y += h;
    }
    function field(label, value) {
      ensure(14); font('normal', 8); ink(MUTED); doc.text(S(label), M, y + 3);
      stroke(LINE, 0.35); doc.roundedRect(M, y + 4.5, CW, 7.5, 1, 1, 'S');
      if (value) { font('bold', 10); ink(INK); doc.text(S(value), M + 3, y + 9.6); }
      y += 14;
    }
    function signRow(a, b) {
      ensure(18); stroke(NAVY, 0.3);
      doc.line(M, y + 11, M + CW * 0.62, y + 11); doc.line(M + CW * 0.68, y + 11, M + CW, y + 11);
      font('normal', 8); ink(MUTED); doc.text(S(a), M, y + 14.6); doc.text(S(b), M + CW * 0.68, y + 14.6);
      y += 19;
    }
    function bullet(text) {
      font('normal', 9);
      var ls = wrap(text, CW - 6), h = ls.length * 4.6 + 1.8;
      ensure(h); fill(GOLD); doc.circle(M + 1.2, y + 2.5, 0.7, 'F');
      font('normal', 9); ink(INK);
      ls.forEach(function (l, i) { doc.text(l, M + 5, y + 3.3 + i * 4.6); });
      y += h;
    }

    doc.setProperties({ title: S(P.title + ' ' + state.ref), author: 'French with Nelliane', subject: S(state.ref) });

    // ---- header band
    fill(NAVY); doc.rect(0, 0, W, 34, 'F');
    font('bold', 17); ink([255, 255, 255]); doc.text('FRENCH WITH NELLIANE', M, 15);
    font('normal', 8.5); ink(GOLD); doc.text(S(P.band).toUpperCase(), M, 21.5);
    font('bold', 10); ink([255, 255, 255]); doc.text(S(P.title), W - M, 15, { align: 'right' });
    font('normal', 9); ink(GOLD); doc.text(S(P.ref + ': ' + state.ref), W - M, 21.5, { align: 'right' });
    y = 42;

    para(fmtN(P.intro, { name: first }), 10.5, 'normal', INK, 5.2);
    y += 2;

    // ---- amount due
    ensure(34);
    fill(PALE); stroke(GOLD, 0.6); doc.roundedRect(M, y, CW, 27, 2, 2, 'FD');
    font('bold', 8.5); ink(MUTED); doc.text(S(P.due), M + 6, y + 8);
    font('bold', 24); ink(NAVY); doc.text(total == null ? S(P.dueQuote) : money2(total), M + 6, y + 19);
    font('normal', 9.5); ink(INK);
    doc.text(S(fmtN(P.sessions, { n: n })), W - M - 6, y + 10, { align: 'right' });
    if (total != null) doc.text(S(fmtN(P.each, { n: n, price: money(L.price) }) + ' ' + (L.unit === 'hour' ? '/ h' : '/ ' + T.perSession.replace('/ ', ''))), W - M - 6, y + 16, { align: 'right' });
    font('normal', 8); ink(MUTED);
    var dn = wrap(P.dueNote, CW - 12); doc.text(dn[0], M + 6, y + 24.2);
    y += 31;

    // ---- booking
    heading(P.s1);
    kv(P.lesson, L.name[lang()], true);
    kv(P.first, fmtDate(state.date) + ' - ' + state.time);
    if (lt) kv(P.local, lt + (userTz() ? ' (' + userTz() + ')' : ''));
    kv(P.mode, T.modes[d.mode]);
    kv(P.student, d.name + '  |  ' + d.email);
    kv(P.package, fmtN(P.sessions, { n: n }));
    kv(P.price, priceText(L));
    kv(P.issued, new Intl.DateTimeFormat(loc(), { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()));

    // ---- steps
    heading(P.s2);
    check(total == null ? fmtN(P.c1q, { n: n }) : fmtN(P.c1, { total: money(total), n: n }));
    check(fmtN(P.c2, { wa: waDisplay() }));
    check(P.c3);
    check(P.c4);

    // ---- payment
    heading(P.s3);
    var bank = bankRows();
    if (bank.length) bank.forEach(function (r) { kv(r[0], r[1], true); });
    else para(P.payNone, 10, 'normal', INK, 5);
    kv(P.payRef, state.ref, true);
    para(P.intl, 8.8, 'normal', MUTED, 4.5);

    // ---- information to complete (contract section 1): keep the whole form together on one page
    ensure(112);
    heading(P.s4);
    field(P.fName, d.name);
    field(P.fId, '');
    field(P.fPhone, '');
    field(P.fAddr, '');
    field(P.fEmail, d.email);
    field(P.fDate, fmtDate(state.date));
    field(P.fGuard, '');
    signRow(P.sign, P.date);

    // ---- key terms
    heading(P.s5);
    P.terms.forEach(bullet);

    // ---- footer on every page
    var pages = doc.getNumberOfPages();
    for (var i = 1; i <= pages; i++) {
      doc.setPage(i);
      stroke(LINE, 0.3); doc.line(M, H - 14, W - M, H - 14);
      font('normal', 8); ink(MUTED);
      doc.text(S('French with Nelliane  |  WhatsApp ' + waDisplay() + '  |  ' + CONFIG.email), M, H - 9.5);
      doc.text(S(fmtN(P.page, { n: i, m: pages })), W - M, H - 9.5, { align: 'right' });
    }
    return doc;
  }

  function showPdfMsg(msg) {
    var m = document.getElementById('bkPdfMsg');
    if (!m) return;
    m.textContent = msg || ''; m.hidden = !msg;
  }

  function makePdf(btn) {
    var T = tx(), label = btn.textContent;
    btn.disabled = true; btn.textContent = T.pdfBusy; showPdfMsg('');
    loadPdfLib().then(function (jsPDF) {
      buildPdf(jsPDF).save(T.pdf.file + state.ref + '.pdf');
      track('download_pdf', { lesson: state.lesson, sessions: state.sessions });
    }).catch(function () {
      showPdfMsg(T.pdfFail);
    }).then(function () {
      btn.disabled = false; btn.textContent = label;
    });
  }

  /* ---------------------------------------------------------------
     7. RENDER + EVENTS
     --------------------------------------------------------------- */
  function renderFoot() {
    var T = tx(), L = lessonById(state.lesson), done = state.step === 5;
    els.foot.hidden = done;
    if (done) return;
    els.pricebar.innerHTML = L
      ? '<span>' + esc(L.name[lang()]) + '<small>' + esc(L.price == null ? T.quote : fmtN(T.pkgN, { n: state.sessions }) + ' · ' + money(L.price) + ' ' + unitText(L)) + '</small></span>' +
        '<strong>' + esc(totalText(L, state.sessions)) + (L.price == null ? '' : ' <small>' + T.pkgUp + '</small>') + '</strong>'
      : '<span>' + T.pricesHint + '</span>';
    els.back.textContent = T.back;
    els.back.style.visibility = state.step === 0 ? 'hidden' : 'visible';
    els.nextLabel.textContent = state.step === 4 ? T.confirm : state.step === 3 ? T.review : T.cont;
  }

  function renderPanel() {
    var s = state.step;
    els.panel.innerHTML = s === 0 ? panelLesson() : s === 1 ? panelDate() : s === 2 ? panelTime() : s === 3 ? panelDetails() : s === 4 ? panelReview() : panelDone();
  }

  function render(moveFocus) {
    var T = tx(), done = state.step === 5;
    els.title.textContent = T.title;
    els.x.setAttribute('aria-label', T.close);
    var on = done ? 5 : state.step + 1, lis = '';
    for (var i = 0; i < 5; i++) lis += '<li' + (i < on ? ' class="on"' : '') + '></li>';
    els.steps.innerHTML = lis;
    els.stepname.hidden = done;
    els.stepname.textContent = done ? '' : T.step + ' ' + (state.step + 1) + ' / 5 · ' + T.stepNames[state.step];
    renderPanel();
    renderFoot();
    hideErr();
    if (moveFocus) {
      var h = els.panel.querySelector('h4,h3');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      els.body.scrollTop = 0;
    }
  }

  function showErr(msg) { els.err.textContent = msg; els.err.hidden = false; }
  function hideErr() { els.err.hidden = true; els.err.textContent = ''; }

  function syncDetails() {
    var f = els.panel.querySelectorAll('[data-field]');
    for (var i = 0; i < f.length; i++) {
      var k = f[i].getAttribute('data-field');
      state.details[k] = (k === 'mode' || k === 'level' || k === 'freq') ? +f[i].value : f[i].value;
    }
  }

  function validate() {
    var T = tx(), s = state;
    if (s.step === 0 && !s.lesson) return T.eLesson;
    if (s.step === 1 && !s.date) return T.eDate;
    if (s.step === 2 && !s.time) return T.eTime;
    if (s.step === 3) {
      if (!s.details.name.trim()) return T.eName;
      if (!EMAIL_RE.test(s.details.email.trim())) return T.eEmail;
    }
    return '';
  }

  function go(dir) {
    if (state.step === 3) syncDetails();
    if (dir > 0) {
      var err = validate();
      if (err) { showErr(err); return; }
      if (state.step === 4) { submit(); return; }
    }
    state.step = Math.max(0, Math.min(4, state.step + dir));
    track('booking_step', { step: state.step + 1 });
    render(true);
  }

  function pick(selector, attr, value) {
    var b = els.panel.querySelectorAll(selector);
    for (var i = 0; i < b.length; i++) {
      var on = b[i].getAttribute(attr) === value;
      b[i].classList.toggle('sel', on);
      b[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function onClick(e) {
    var g = e.target.closest('[data-track="gcal"]');
    if (g) track('add_to_calendar', { type: 'google' });
    var a0 = e.target.closest('[data-track="agreement"]');
    if (a0) track('download_agreement', {});
    var t = e.target.closest('[data-lesson],[data-sessions],[data-date],[data-time],[data-nav],[data-act]');
    if (!t || !els.modal.contains(t)) return;
    if (t.hasAttribute('data-lesson')) {
      state.lesson = t.getAttribute('data-lesson');
      pick('.bk-choice', 'data-lesson', state.lesson);
      updatePkgTotals(); renderFoot(); hideErr();
    } else if (t.hasAttribute('data-sessions')) {
      state.sessions = +t.getAttribute('data-sessions');
      pick('.bk-pkg', 'data-sessions', String(state.sessions));
      renderFoot(); hideErr();
    } else if (t.hasAttribute('data-date')) {
      state.date = t.getAttribute('data-date'); state.time = '';
      pick('.bk-day', 'data-date', state.date);
      var p = document.getElementById('bkPicked');
      if (p) p.textContent = tx().picked + ' ' + fmtDate(state.date);
      hideErr();
    } else if (t.hasAttribute('data-time')) {
      state.time = t.getAttribute('data-time');
      pick('.bk-slot', 'data-time', state.time);
      hideErr();
    } else if (t.hasAttribute('data-nav')) {
      var dir = +t.getAttribute('data-nav'), m = state.viewM + dir, y = state.viewY;
      if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
      state.viewM = m; state.viewY = y;
      renderPanel();
      var again = els.panel.querySelector('[data-nav="' + dir + '"]:not(:disabled)') || els.panel.querySelector('.bk-day:not(:disabled)');
      if (again) again.focus();
    } else {
      var a = t.getAttribute('data-act');
      if (a === 'back') go(-1);
      else if (a === 'next') go(1);
      else if (a === 'ics') { track('add_to_calendar', { type: 'ics' }); downloadIcs(); }
      else if (a === 'pdf') makePdf(t);
      else if (a === 'done') close();
    }
  }

  function trapTab(e) {
    if (e.key !== 'Tab') return;
    var f = els.modal.querySelectorAll('button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]');
    var vis = [];
    for (var i = 0; i < f.length; i++) if (f[i].offsetParent !== null) vis.push(f[i]);
    if (!vis.length) return;
    var first = vis[0], last = vis[vis.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === els.modal)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function open(lessonId) {
    if (state.done) state = fresh();
    if (lessonId && lessonById(lessonId)) {
      state.lesson = lessonId;
      if (state.step === 0) state.step = 1;
    }
    if (state.viewY === null) {
      var p = parseIso(state.date || firstAvailableIso());
      state.viewY = p.y; state.viewM = p.m;
    }
    lastFocus = document.activeElement;
    track('booking_open', { lesson: state.lesson || 'none' });
    els.bg.classList.add('open');
    els.bg.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    render(false);
    els.modal.focus();
  }

  function close() {
    if (!els.bg || !els.bg.classList.contains('open')) return;
    if (state.step === 5) state.done = true;
    els.bg.classList.remove('open');
    els.bg.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }

  function build() {
    var bg = document.createElement('div');
    bg.className = 'bk-bg'; bg.id = 'bookingModal'; bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML =
      '<div class="bk-modal" role="dialog" aria-modal="true" aria-labelledby="bkTitle" tabindex="-1">' +
        '<div class="bk-head"><h3 id="bkTitle"></h3><button type="button" class="bk-x">×</button></div>' +
        '<div class="bk-body">' +
          '<ol class="bk-steps" aria-hidden="true"></ol><p class="bk-stepname"></p>' +
          '<div class="bk-panel" aria-live="polite"></div>' +
          '<p class="bk-err" role="alert" hidden></p>' +
        '</div>' +
        '<div class="bk-foot"><div class="bk-pricebar"></div>' +
          '<div class="bk-nav"><button type="button" class="btn btn-ghost" data-act="back"></button>' +
          '<button type="button" class="btn btn-gold" data-act="next"><span></span> <span class="arrow">→</span></button></div></div>' +
      '</div>';
    document.body.appendChild(bg);
    els.bg = bg;
    els.modal = bg.querySelector('.bk-modal');
    els.title = bg.querySelector('#bkTitle');
    els.x = bg.querySelector('.bk-x');
    els.body = bg.querySelector('.bk-body');
    els.steps = bg.querySelector('.bk-steps');
    els.stepname = bg.querySelector('.bk-stepname');
    els.panel = bg.querySelector('.bk-panel');
    els.err = bg.querySelector('.bk-err');
    els.foot = bg.querySelector('.bk-foot');
    els.pricebar = bg.querySelector('.bk-pricebar');
    els.back = bg.querySelector('[data-act="back"]');
    els.nextLabel = bg.querySelector('[data-act="next"] span');

    els.x.addEventListener('click', close);
    bg.addEventListener('click', function (e) { if (e.target === bg) close(); });
    els.modal.addEventListener('click', onClick);
    els.modal.addEventListener('keydown', trapTab);
    els.panel.addEventListener('input', function (e) {
      if (e.target.hasAttribute && e.target.hasAttribute('data-field')) { syncDetails(); hideErr(); }
    });
    els.panel.addEventListener('change', function (e) {
      if (e.target.hasAttribute && e.target.hasAttribute('data-field')) syncDetails();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);

  window.openBooking = open;
  window.closeBooking = close;
  window.FWNBooking = { config: CONFIG, lessons: LESSONS, state: function () { return state; }, buildIcs: buildIcs, waText: waText, gcalUrl: gcalUrl };
})();
