/**
 * Team hierarchy and mock scoring data for the coaching dashboard.
 * TEAM array sourced from Gong API (/v2/users) — reflects real Apollo.io sales org.
 * Scores, deals, and calls use generated data until Gong call integration is live.
 *
 * Last synced: 2026-03-08 (from Gong)
 */

const TEAM = [
  // --- Leadership ---
  { id: 'tim-zheng', name: 'Tim Zheng', role: 'ceo', reports_to: null, segment: null, team_label: 'Apollo', gong_id: '3730266815323860735' },
  { id: 'adam-carr', name: 'Adam Carr', role: 'cro', reports_to: 'tim-zheng', segment: null, team_label: 'Revenue', gong_id: '4287780044584462399' },
  { id: 'max-angell', name: 'Max Angell', role: 'vp', reports_to: 'adam-carr', segment: null, team_label: 'Sales', gong_id: '508439118847453151' },

  // --- Directors under Max ---
  { id: 'heather-hansen', name: 'Heather Hansen', role: 'director', reports_to: 'max-angell', segment: null, team_label: 'Sales Development', gong_id: '174011158242053008' },
  { id: 'dana-hensler', name: 'Dana Hensler', role: 'director', reports_to: 'max-angell', segment: 'smb', team_label: 'SMB Sales', gong_id: '3939871472289606894' },
  { id: 'paula-urrutia', name: 'Paula Urrutia', role: 'director', reports_to: 'max-angell', segment: null, team_label: 'Sales', gong_id: '3379616238815016104' },
  { id: 'garris-yeung', name: 'Garris Yeung', role: 'director', reports_to: 'max-angell', segment: null, team_label: 'Sales', gong_id: '3464702930148036018' },

  // --- Tania Garcia Chavez — Customer Advocates (reports to Max) ---
  { id: 'tania-garcia-chavez', name: 'Tania Garcia Chavez', role: 'ca', reports_to: 'max-angell', segment: null, gong_id: '2697679220801044346' },
  { id: 'dany-altamirano', name: 'Dany Altamirano', role: 'ca', reports_to: 'tania-garcia-chavez', segment: null, gong_id: '7148285684633124603' },
  { id: 'luis-fernando-antunez-olguin', name: 'Luis Fernando Ant\u00fanez Olgu\u00edn', role: 'ca', reports_to: 'tania-garcia-chavez', segment: null, gong_id: '1105198533501604211' },
  { id: 'jose-alejandro-chavez', name: 'Jose Alejandro Chavez', role: 'ca', reports_to: 'tania-garcia-chavez', segment: null, gong_id: '9013097552186428967' },
  { id: 'flovin-brylle-daquioag', name: 'Flovin Brylle Daquioag', role: 'ca', reports_to: 'tania-garcia-chavez', segment: null, gong_id: '6699776270408871853' },
  { id: 'ro-dayota', name: 'Ro Dayota', role: 'ca', reports_to: 'tania-garcia-chavez', segment: null, gong_id: '809310877096043505' },
  { id: 'lily-garza-garza', name: 'Lily Garza Garza', role: 'ca', reports_to: 'tania-garcia-chavez', segment: null, gong_id: '585295356853624899' },
  { id: 'sheryl-gonzales', name: 'Sheryl Gonzales', role: 'ca', reports_to: 'tania-garcia-chavez', segment: null, gong_id: '1567052324003272041' },
  { id: 'karen-lopez', name: 'Karen Lopez', role: 'ca', reports_to: 'tania-garcia-chavez', segment: null, gong_id: '7350659861777244996' },
  { id: 'an-marasigan', name: 'An Marasigan', role: 'ca', reports_to: 'tania-garcia-chavez', segment: null, gong_id: '5436770107829607064' },
  { id: 'george-kenneth-ortega', name: 'George Kenneth Ortega', role: 'ca', reports_to: 'tania-garcia-chavez', segment: null, gong_id: '1816867309939295912' },
  { id: 'karl-angelo-tabada', name: 'Karl Angelo Tabada', role: 'ca', reports_to: 'tania-garcia-chavez', segment: null, gong_id: '4995739250322762078' },

  // ===== HEATHER HANSEN — Sales Development =====
  { id: 'sandy-chang', name: 'Sandy Chang', role: 'manager', reports_to: 'heather-hansen', segment: null, team_label: 'Sales Development', gong_id: '2389040023092076565' },

  // ===== DANA HENSLER — SMB Sales =====

  // David Castellanos — Manager, Account Management - SMB
  { id: 'david-castellanos', name: 'David Castellanos', role: 'manager', reports_to: 'dana-hensler', segment: 'smb', team_label: 'Account Management - SMB', gong_id: '8267624317270580613' },
  { id: 'rose-gahite', name: 'Rose Gahite', role: 'am', reports_to: 'david-castellanos', segment: 'smb', gong_id: '6650304042335232593' },
  { id: 'juliana-garcia-franco', name: 'Juliana Garcia Franco', role: 'am', reports_to: 'david-castellanos', segment: 'smb', gong_id: '5575426768138883557' },
  { id: 'nicolas-hurtado', name: 'Nicolas Hurtado', role: 'am', reports_to: 'david-castellanos', segment: 'smb', gong_id: '3488835454563734672' },
  { id: 'jhoana-medina', name: 'Jhoana Medina', role: 'am', reports_to: 'david-castellanos', segment: 'smb', gong_id: '7917417818407263581' },
  { id: 'alex-roehrig', name: 'Alex Roehrig', role: 'am', reports_to: 'david-castellanos', segment: 'smb', gong_id: '3235567736877010319' },
  { id: 'tristan-walker', name: 'Tristan Walker', role: 'am', reports_to: 'david-castellanos', segment: 'smb', gong_id: '8801378874683621757' },

  // Kristi Notvedt — Manager, SMB Account Executives
  { id: 'kristi-notvedt', name: 'Kristi Notvedt', role: 'manager', reports_to: 'dana-hensler', segment: 'smb', team_label: 'SMB Account Executives', gong_id: '459663337291670638' },
  { id: 'nick-camacho-vargas', name: 'Nick Camacho Vargas', role: 'ae', reports_to: 'kristi-notvedt', segment: 'smb', gong_id: '2824157959286124562' },
  { id: 'jose-hernandez', name: 'Jose Hernandez', role: 'ae', reports_to: 'kristi-notvedt', segment: 'smb', gong_id: '7922290445925340503' },
  { id: 'tyler-hughes', name: 'Tyler Hughes', role: 'ae', reports_to: 'kristi-notvedt', segment: 'smb', gong_id: '4813247188764911578' },
  { id: 'ethan-rife', name: 'Ethan Rife', role: 'ae', reports_to: 'kristi-notvedt', segment: 'smb', gong_id: '5472815436026121482' },
  { id: 'helene-rojas', name: 'Helene Rojas', role: 'ae', reports_to: 'kristi-notvedt', segment: 'smb', gong_id: '1590360730016282249' },
  { id: 'darius-valdez', name: 'Darius Valdez', role: 'ae', reports_to: 'kristi-notvedt', segment: 'smb', gong_id: '6877228676854408906' },

  // David Spears — Manager, SMB Sales
  { id: 'david-spears', name: 'David Spears', role: 'manager', reports_to: 'dana-hensler', segment: 'smb', team_label: 'SMB Sales', gong_id: '5443314839509891872' },
  { id: 'larissa-gomes', name: 'Larissa Gomes', role: 'am', reports_to: 'david-spears', segment: 'smb', gong_id: '1574843111058236702' },
  { id: 'blake-kashyap', name: 'Blake Kashyap', role: 'am', reports_to: 'david-spears', segment: 'smb', gong_id: '1792364229959089550' },
  { id: 'amery-segovia', name: 'Amery Segovia', role: 'am', reports_to: 'david-spears', segment: 'smb', gong_id: '699411150100118878' },
  { id: 'katherine-seropian', name: 'Katherine Seropian', role: 'am', reports_to: 'david-spears', segment: 'smb', gong_id: '5645439097531562574' },
  { id: 'alex-shoemaker', name: 'Alex Shoemaker', role: 'am', reports_to: 'david-spears', segment: 'smb', gong_id: '4195543298751999443' },

  // Kelly Ward — Manager, SMB Sales
  { id: 'kelly-ward', name: 'Kelly Ward', role: 'manager', reports_to: 'dana-hensler', segment: 'smb', team_label: 'SMB Sales', gong_id: '4935240193207359715' },
  { id: 'eseoghene-akpoyoware', name: 'Eseoghene Akpoyoware', role: 'ae', reports_to: 'kelly-ward', segment: 'smb', gong_id: '911072026979293351' },
  { id: 'connor-johnson', name: 'Connor Johnson', role: 'ae', reports_to: 'kelly-ward', segment: 'smb', gong_id: '8460748818771126608' },
  { id: 'mia-mihalic', name: 'Mia Mihalic', role: 'ae', reports_to: 'kelly-ward', segment: 'smb', gong_id: '1772230698874679470' },
  { id: 'steve-alex-santellano-jr', name: 'Steve Alex Santellano Jr.', role: 'ae', reports_to: 'kelly-ward', segment: 'smb', gong_id: '5566005523553448551' },
  { id: 'kyle-jacob-tomasino', name: 'Kyle Jacob Tomasino', role: 'ae', reports_to: 'kelly-ward', segment: 'smb', gong_id: '5270774107365159082' },

  // ===== PAULA URRUTIA — SMB Sales =====

  // Cameron Burdette — Manager, SMB Sales
  { id: 'cameron-burdette', name: 'Cameron Burdette', role: 'manager', reports_to: 'paula-urrutia', segment: 'smb', team_label: 'SMB Sales', gong_id: '4313168915169291536' },
  { id: 'james-barker', name: 'James Barker', role: 'ae', reports_to: 'cameron-burdette', segment: 'smb', gong_id: '2546257551815605857' },
  { id: 'conner-blackham', name: 'Conner Blackham', role: 'ae', reports_to: 'cameron-burdette', segment: 'smb', gong_id: '403344764176027209' },
  { id: 'josh-brinkerhoff', name: 'Josh Brinkerhoff', role: 'ae', reports_to: 'cameron-burdette', segment: 'smb', gong_id: '8819252183786237052' },
  { id: 'megan-fisher', name: 'Megan Fisher', role: 'ae', reports_to: 'cameron-burdette', segment: 'smb', gong_id: '4004332089076900930' },
  { id: 'jorge-martinez', name: 'Jorge Martinez', role: 'ae', reports_to: 'cameron-burdette', segment: 'smb', gong_id: '4621904478518861914' },
  { id: 'jared-pinson', name: 'Jared Pinson', role: 'ae', reports_to: 'cameron-burdette', segment: 'smb', gong_id: '3492483847689918684' },

  // David Jewell — Manager, SMB Sales
  { id: 'david-jewell', name: 'David Jewell', role: 'manager', reports_to: 'paula-urrutia', segment: 'smb', team_label: 'SMB Sales', gong_id: '2918617080321331649' },
  { id: 'avi-aditya', name: 'Avi Aditya', role: 'ae', reports_to: 'david-jewell', segment: 'smb', gong_id: '1232295256324828607' },
  { id: 'roy-aldrich', name: 'Roy Aldrich', role: 'ae', reports_to: 'david-jewell', segment: 'smb', gong_id: '8562245753051807632' },
  { id: 'lainey-allison', name: 'Lainey Allison', role: 'ae', reports_to: 'david-jewell', segment: 'smb', gong_id: '4024797686369975717' },
  { id: 'kyle-fleher', name: 'Kyle Fleher', role: 'ae', reports_to: 'david-jewell', segment: 'smb', gong_id: '2265428083649875817' },
  { id: 'gabriel-kane', name: 'Gabriel Kane', role: 'ae', reports_to: 'david-jewell', segment: 'smb', gong_id: '868070368411611218' },
  { id: 'mateo-mino-cornejo', name: 'Mateo Mino Cornejo', role: 'ae', reports_to: 'david-jewell', segment: 'smb', gong_id: '3269148337950924215' },

  // Kyle Karl — Manager, SMB Account Executives
  { id: 'kyle-karl', name: 'Kyle Karl', role: 'manager', reports_to: 'paula-urrutia', segment: 'smb', team_label: 'SMB Account Executives', gong_id: '5767196454719333339' },
  { id: 'alex-albert', name: 'Alex Albert', role: 'ae', reports_to: 'kyle-karl', segment: 'smb', gong_id: '3367325198104579955' },
  { id: 'brandon-athanasopoulos', name: 'Brandon Athanasopoulos', role: 'ae', reports_to: 'kyle-karl', segment: 'smb', gong_id: '1272425237522506621' },
  { id: 'ryan-brantley', name: 'Ryan Brantley', role: 'ae', reports_to: 'kyle-karl', segment: 'smb', gong_id: '5226536094125921005' },
  { id: 'sam-rhoton', name: 'Sam Rhoton', role: 'ae', reports_to: 'kyle-karl', segment: 'smb', gong_id: '8956928134478119649' },
  { id: 'mitchell-squires', name: 'Mitchell Squires', role: 'ae', reports_to: 'kyle-karl', segment: 'smb', gong_id: '7933135800316143575' },
  { id: 'bailey-wilson', name: 'Bailey Wilson', role: 'ae', reports_to: 'kyle-karl', segment: 'smb', gong_id: '5188015107540486156' },

  // Emilio Obeso Sansores — Manager, SMB Sales
  { id: 'emilio-obeso-sansores', name: 'Emilio Obeso Sansores', role: 'manager', reports_to: 'paula-urrutia', segment: 'smb', team_label: 'SMB Sales', gong_id: '5053816929949735647' },
  { id: 'felipe-blanco', name: 'Felipe Blanco', role: 'ae', reports_to: 'emilio-obeso-sansores', segment: 'smb', gong_id: '7725017241260341604' },
  { id: 'diana-constantino-de-la-espriella', name: 'Diana Constantino De La Espriella', role: 'ae', reports_to: 'emilio-obeso-sansores', segment: 'smb', gong_id: '275132788281022517' },
  { id: 'mauricio-garcia-sainz', name: 'Mauricio Garcia Sainz', role: 'ae', reports_to: 'emilio-obeso-sansores', segment: 'smb', gong_id: '8274547472701810819' },
  { id: 'jonny-knight', name: 'Jonny Knight', role: 'ae', reports_to: 'emilio-obeso-sansores', segment: 'smb', gong_id: '1436860938369510390' },
  { id: 'ronnel-mangupag', name: 'Ronnel Mangupag', role: 'ae', reports_to: 'emilio-obeso-sansores', segment: 'smb', gong_id: '7058726942646509903' },
  { id: 'amilcar-milan-garcia', name: 'Amilcar Milan Garcia', role: 'ae', reports_to: 'emilio-obeso-sansores', segment: 'smb', gong_id: '4285967675125974028' },

  // Elsa Schlemm — Manager, EMEA Sales
  { id: 'elsa-schlemm', name: 'Elsa Schlemm', role: 'manager', reports_to: 'paula-urrutia', segment: 'smb', team_label: 'EMEA Sales', gong_id: '5683297430551424953' },
  { id: 'adonis-adeoye', name: 'Adonis Adeoye', role: 'ae', reports_to: 'elsa-schlemm', segment: 'smb', gong_id: '537897335384981594' },
  { id: 'josiah-benjamin', name: 'Josiah Benjamin', role: 'ae', reports_to: 'elsa-schlemm', segment: 'mid_market', gong_id: '7757605004550033525' },
  { id: 'vineet-chatterjee', name: 'Vineet Chatterjee', role: 'ae', reports_to: 'elsa-schlemm', segment: 'smb', gong_id: '7191145838959569913' },
  { id: 'heena-choudhary', name: 'Heena Choudhary', role: 'ae', reports_to: 'elsa-schlemm', segment: 'smb', gong_id: '1094315763983166198' },
  { id: 'samuel-church', name: 'Samuel Church', role: 'ae', reports_to: 'elsa-schlemm', segment: 'smb', gong_id: '6310678081977926631' },
  { id: 'louise-dillon', name: 'Louise Dillon', role: 'ae', reports_to: 'elsa-schlemm', segment: 'mid_market', gong_id: '6323737901962267743' },
  { id: 'ryan-stamp', name: 'Ryan Stamp', role: 'ae', reports_to: 'elsa-schlemm', segment: 'smb', gong_id: '2869069116808805153' },
  { id: 'robert-village', name: 'Robert Village', role: 'ae', reports_to: 'elsa-schlemm', segment: 'mid_market', gong_id: '7461799118185430834' },

  // ===== GARRIS YEUNG — Mid-Market =====

  // Ross Arnowitz — Manager, Mid Market Account Management
  { id: 'ross-arnowitz', name: 'Ross Arnowitz', role: 'manager', reports_to: 'garris-yeung', segment: 'mid_market', team_label: 'Mid Market Account Management', gong_id: '5331700572854111251' },
  { id: 'kerri-ann-fahey', name: 'Kerri Ann Fahey', role: 'am', reports_to: 'ross-arnowitz', segment: 'mid_market', gong_id: '3616275622473131634' },
  { id: 'darius-saffold', name: 'Darius Saffold', role: 'am', reports_to: 'ross-arnowitz', segment: 'mid_market', gong_id: '4021525236309363506' },
  { id: 'dylan-tate', name: 'Dylan Tate', role: 'am', reports_to: 'ross-arnowitz', segment: 'mid_market', gong_id: '5393107153670696245' },
  { id: 'anna-lee-webster', name: 'Anna Lee Webster', role: 'am', reports_to: 'ross-arnowitz', segment: 'mid_market', gong_id: '9109730420594128020' },

  // Layla Jaffe — Manager, Mid Market Outbound Sales
  { id: 'layla-jaffe', name: 'Layla Jaffe', role: 'manager', reports_to: 'garris-yeung', segment: 'mid_market', team_label: 'Mid Market Outbound Sales', gong_id: '8052228624031216494' },
  { id: 'david-dember', name: 'David Dember', role: 'ae', reports_to: 'layla-jaffe', segment: 'mid_market', gong_id: '4343013120671425455' },
  { id: 'geo-flores', name: 'Geo Flores', role: 'ae', reports_to: 'layla-jaffe', segment: 'mid_market', gong_id: '1005292371269278945' },
  { id: 'hannah-gray', name: 'Hannah Gray', role: 'ae', reports_to: 'layla-jaffe', segment: 'mid_market', gong_id: '6006049015055053156' },
  { id: 'jake-lopez', name: 'Jake Lopez', role: 'ae', reports_to: 'layla-jaffe', segment: 'mid_market', gong_id: '1056102316203054049' },
  { id: 'jessie-spivey', name: 'Jessie Spivey', role: 'ae', reports_to: 'layla-jaffe', segment: 'mid_market', gong_id: '6639926469274192011' },
  { id: 'nicholas-thrune', name: 'Nicholas Thrune', role: 'ae', reports_to: 'layla-jaffe', segment: 'mid_market', gong_id: '837168772057217120' },
  { id: 'tanya-valdez', name: 'Tanya Valdez', role: 'ae', reports_to: 'layla-jaffe', segment: 'mid_market', gong_id: '243958934107644692' },
  { id: 'aidan-velle', name: 'Aidan Velle', role: 'ae', reports_to: 'layla-jaffe', segment: 'mid_market', gong_id: '6840040468307411342' },
  { id: 'sarah-wahn', name: 'Sarah Wahn', role: 'ae', reports_to: 'layla-jaffe', segment: 'mid_market', gong_id: '3148483972791255539' },

  // Lindsey Liranzo — Manager, Account Management - Mid-Market
  { id: 'lindsey-liranzo', name: 'Lindsey Liranzo', role: 'manager', reports_to: 'garris-yeung', segment: 'mid_market', team_label: 'Account Management - Mid-Market', gong_id: '175630722409231467' },
  { id: 'victoria-bishop', name: 'Victoria Bishop', role: 'am', reports_to: 'lindsey-liranzo', segment: 'mid_market', gong_id: '8340679476625485821' },
  { id: 'danny-cook', name: 'Danny Cook', role: 'am', reports_to: 'lindsey-liranzo', segment: 'mid_market', gong_id: '4864502965555406992' },
  { id: 'paul-demarco', name: 'Paul DeMarco', role: 'am', reports_to: 'lindsey-liranzo', segment: 'mid_market', gong_id: '6962176262283108905' },
  { id: 'charlie-plamondon', name: 'Charlie Plamondon', role: 'am', reports_to: 'lindsey-liranzo', segment: 'mid_market', gong_id: '15213334520601983' },
  { id: 'isabell-rashid', name: 'Isabell Rashid', role: 'am', reports_to: 'lindsey-liranzo', segment: 'mid_market', gong_id: '3087208292577038234' },
  { id: 'nicole-stehura', name: 'Nicole Stehura', role: 'am', reports_to: 'lindsey-liranzo', segment: 'mid_market', gong_id: '2745294782858738036' },

  // Erika Schultz — Manager, Mid Market Sales
  { id: 'erika-schultz', name: 'Erika Schultz', role: 'manager', reports_to: 'garris-yeung', segment: 'mid_market', team_label: 'Mid Market Sales', gong_id: '7321261835804000223' },
  { id: 'westin-bennett', name: 'Westin Bennett', role: 'ae', reports_to: 'erika-schultz', segment: 'smb', gong_id: '5437427652378560074' },
  { id: 'sammy-dunn', name: 'Sammy Dunn', role: 'ae', reports_to: 'erika-schultz', segment: 'mid_market', gong_id: '9221997586258325478' },
  { id: 'daniel-grijalva', name: 'Daniel Grijalva', role: 'ae', reports_to: 'erika-schultz', segment: 'mid_market', gong_id: '2866740705084391158' },
  { id: 'austin-robert', name: 'Austin Robert', role: 'ae', reports_to: 'erika-schultz', segment: 'mid_market', gong_id: '1547294695872518702' },
  { id: 'jono-shupack', name: 'Jono Shupack', role: 'ae', reports_to: 'erika-schultz', segment: 'mid_market', gong_id: '3152963918868216510' },
  { id: 'brian-smith', name: 'Brian Smith', role: 'ae', reports_to: 'erika-schultz', segment: 'mid_market', gong_id: '361562093534714264' },
  { id: 'anthony-sullivan', name: 'Anthony Sullivan', role: 'ae', reports_to: 'erika-schultz', segment: 'mid_market', gong_id: '1381123934623785004' },
  { id: 'ran-warcel', name: 'Ran Warcel', role: 'ae', reports_to: 'erika-schultz', segment: 'mid_market', gong_id: '1508519224559957411' },
];

// ---------------------------------------------------------------------------
// Scoring helpers (generated data until Gong integration is live)
// ---------------------------------------------------------------------------

function randomScore(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

function getBand(score) {
  if (score <= 3) return 'developing';
  if (score <= 6) return 'proficient';
  return 'elite';
}

function generateWeeklyScores(repId, weeks = 8) {
  const data = [];
  const base = 4 + Math.random() * 4;
  for (let w = 0; w < weeks; w++) {
    const d = new Date();
    d.setDate(d.getDate() - (weeks - w) * 7);
    const p1 = randomScore(Math.max(0, base - 1.5), Math.min(10, base + 1.5));
    const p2 = randomScore(Math.max(0, base - 1), Math.min(10, base + 2));
    const p3 = randomScore(Math.max(0, base - 2), Math.min(10, base + 1));
    const composite = Math.round((p1 * 0.35 + p2 * 0.35 + p3 * 0.30) * 10) / 10;
    data.push({
      week: d.toISOString().split('T')[0],
      composite,
      p1, p2, p3,
      band: getBand(composite),
      deals_evaluated: 2 + Math.floor(Math.random() * 4),
    });
  }
  return data;
}

const REP_IDS = TEAM.filter(m => ['ae', 'sdr', 'am', 'ca'].includes(m.role)).map(m => m.id);
const WEEKLY_SCORES = {};
REP_IDS.forEach(id => { WEEKLY_SCORES[id] = generateWeeklyScores(id); });

function getLatestScores(repId) {
  const weeks = WEEKLY_SCORES[repId];
  return weeks ? weeks[weeks.length - 1] : null;
}

function generateDeals(repId, count = 3) {
  const companies = ['Acme Corp', 'Beta Inc', 'Gamma Solutions', 'Delta Tech', 'Epsilon AI', 'Zeta Cloud', 'Omega Systems'];
  const stages = ['Discovery', 'Qualification', 'Demo', 'Proposal', 'Negotiation', 'Closed Won'];
  return Array.from({ length: count }, (_, i) => ({
    id: `deal-${repId}-${i}`,
    name: `${companies[Math.floor(Math.random() * companies.length)]} Deal`,
    account_name: companies[Math.floor(Math.random() * companies.length)],
    stage: stages[Math.floor(Math.random() * stages.length)],
    arr: Math.round((20000 + Math.random() * 180000) / 1000) * 1000,
    seat_count: 5 + Math.floor(Math.random() * 95),
    composite_score: randomScore(3, 9),
    p1: randomScore(3, 9), p2: randomScore(3, 9), p3: randomScore(3, 9),
    scoring_band: getBand(randomScore(3, 9)),
    evaluated_at: new Date(Date.now() - Math.random() * 14 * 86400000).toISOString(),
    calls_count: 1 + Math.floor(Math.random() * 5),
    strengths: ['Strong discovery questions', 'Good rapport building', 'Clear demo narrative'],
    improvements: ['Ask about budget earlier', 'Multi-thread with economic buyer', 'Quantify business impact'],
    next_call_playbook: ['Open with Dialer ROI proof point', 'Map reporting chain above current contact', 'Tie enrichment accuracy to pipeline conversion'],
    meddpicc: {
      metrics: { status: Math.random() > 0.3 ? 'documented' : 'not_started', score: randomScore(0, 10) },
      economic_buyer: { status: Math.random() > 0.5 ? 'identified' : 'not_started', score: randomScore(0, 10) },
      decision_criteria: { status: Math.random() > 0.4 ? 'documented' : 'not_started', score: randomScore(0, 10) },
      decision_process: { status: Math.random() > 0.5 ? 'mapped' : 'not_started', score: randomScore(0, 10) },
      identify_pain: { status: Math.random() > 0.3 ? 'confirmed' : 'not_started', score: randomScore(0, 10) },
      champion: { status: ['not_identified', 'identified', 'tested', 'active'][Math.floor(Math.random() * 4)], score: randomScore(0, 10) },
      competition: { status: Math.random() > 0.4 ? 'mapped' : 'not_started', score: randomScore(0, 10) },
    },
  }));
}

const DEALS = {};
REP_IDS.forEach(id => { DEALS[id] = generateDeals(id); });

function generateCalls(dealId) {
  return Array.from({ length: 1 + Math.floor(Math.random() * 3) }, (_, i) => ({
    id: `call-${dealId}-${i}`,
    deal_id: dealId,
    date: new Date(Date.now() - Math.random() * 14 * 86400000).toISOString(),
    duration_seconds: 300 + Math.floor(Math.random() * 2700),
    participants: ['Rep', 'Prospect CTO', 'Prospect VP Sales'].slice(0, 2 + Math.floor(Math.random() * 2)),
    gong_url: `https://app.gong.io/call?id=${dealId}-${i}`,
    key_moments: [
      { timestamp_seconds: 120, quote: 'Tell me about your current workflow for prospecting.', category: 'strong_discovery' },
      { timestamp_seconds: 480, quote: 'How does that compare to what you were expecting?', category: 'objection_handling' },
      { timestamp_seconds: 900, quote: 'Let me show you how our Dialer integrates with your CRM.', category: 'product_demo' },
    ],
    transcript_segments: [
      { speaker: 'Rep', start: 0, end: 30, text: 'Thanks for joining today. I wanted to follow up on our previous conversation about your sales team\'s outbound process.' },
      { speaker: 'Prospect', start: 31, end: 60, text: 'Sure, happy to discuss. We\'ve been evaluating a few different solutions.' },
      { speaker: 'Rep', start: 61, end: 120, text: 'Great. Can you walk me through your current prospecting workflow? I want to make sure I understand where the pain points are.' },
    ],
  }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getMember(id) { return TEAM.find(m => m.id === id); }
export function getTeam() { return TEAM; }
export function getDirectReports(id) { return TEAM.filter(m => m.reports_to === id); }
export function getSubtree(id) {
  const direct = getDirectReports(id);
  return direct.flatMap(m => [m, ...getSubtree(m.id)]);
}
export function getReps() { return TEAM.filter(m => ['ae', 'sdr', 'am', 'ca'].includes(m.role)); }
export function getRepScores(repId) { return WEEKLY_SCORES[repId] || []; }
export function getRepLatest(repId) { return getLatestScores(repId); }
export function getRepDeals(repId) { return DEALS[repId] || []; }
export function getDeal(dealId) {
  for (const deals of Object.values(DEALS)) {
    const found = deals.find(d => d.id === dealId);
    if (found) return found;
  }
  return null;
}
export function getDealCalls(dealId) { return generateCalls(dealId); }
export function getCall(callId) {
  const parts = callId.split('-');
  const dealId = parts.slice(0, -1).join('-');
  const calls = generateCalls(dealId);
  return calls.find(c => c.id === callId) || calls[0];
}

export function getOrgMetrics() {
  const reps = getReps();
  const scores = reps.map(r => getLatestScores(r.id)).filter(Boolean);
  const avg = scores.length ? Math.round(scores.reduce((s, r) => s + r.composite, 0) / scores.length * 10) / 10 : 0;
  const prevScores = reps.map(r => {
    const w = WEEKLY_SCORES[r.id];
    return w && w.length >= 2 ? w[w.length - 2] : null;
  }).filter(Boolean);
  const prevAvg = prevScores.length ? Math.round(prevScores.reduce((s, r) => s + r.composite, 0) / prevScores.length * 10) / 10 : avg;
  return {
    avg_composite: avg,
    delta: Math.round((avg - prevAvg) * 10) / 10,
    total_reps: reps.length,
    deals_evaluated: reps.reduce((s, r) => s + (getLatestScores(r.id)?.deals_evaluated || 0), 0),
    band_distribution: {
      developing: scores.filter(s => s.composite <= 3).length,
      proficient: scores.filter(s => s.composite > 3 && s.composite <= 6).length,
      elite: scores.filter(s => s.composite > 6).length,
    },
    pillar_avgs: {
      p1: scores.length ? Math.round(scores.reduce((s, r) => s + r.p1, 0) / scores.length * 10) / 10 : 0,
      p2: scores.length ? Math.round(scores.reduce((s, r) => s + r.p2, 0) / scores.length * 10) / 10 : 0,
      p3: scores.length ? Math.round(scores.reduce((s, r) => s + r.p3, 0) / scores.length * 10) / 10 : 0,
    },
  };
}

export function getSegmentMetrics() {
  const segments = ['smb', 'mid_market', 'enterprise'];
  return segments.map(seg => {
    const reps = getReps().filter(r => r.segment === seg);
    const scores = reps.map(r => getLatestScores(r.id)).filter(Boolean);
    const avg = scores.length ? Math.round(scores.reduce((s, r) => s + r.composite, 0) / scores.length * 10) / 10 : 0;
    return {
      segment: seg,
      label: seg === 'mid_market' ? 'Mid-Market' : seg.charAt(0).toUpperCase() + seg.slice(1),
      avg_composite: avg,
      rep_count: reps.length,
      p1: scores.length ? Math.round(scores.reduce((s, r) => s + r.p1, 0) / scores.length * 10) / 10 : 0,
      p2: scores.length ? Math.round(scores.reduce((s, r) => s + r.p2, 0) / scores.length * 10) / 10 : 0,
      p3: scores.length ? Math.round(scores.reduce((s, r) => s + r.p3, 0) / scores.length * 10) / 10 : 0,
    };
  });
}

export { TEAM, WEEKLY_SCORES, DEALS, getBand };
