import Database from 'better-sqlite3';

const db = new Database('aerocare.db');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    facilities TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS passengers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    flight_number TEXT,
    country TEXT,
    passport_number TEXT,
    nationality TEXT,
    departure_airline TEXT,
    departure_date TEXT,
    final_destination TEXT,
    location_id INTEGER,
    qr_token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'registered',
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
  );

  CREATE TABLE IF NOT EXISTS benefits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    value INTEGER NOT NULL,
    picture_url TEXT NOT NULL DEFAULT '',
    available_locations TEXT NOT NULL DEFAULT '',
    open_time TEXT NOT NULL DEFAULT '',
    close_time TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS passenger_benefits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    passenger_id INTEGER NOT NULL,
    benefit_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'available',
    FOREIGN KEY (passenger_id) REFERENCES passengers(id),
    FOREIGN KEY (benefit_id) REFERENCES benefits(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    passenger_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    location_id INTEGER,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (passenger_id) REFERENCES passengers(id)
  );
  
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    passenger_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    sender TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (passenger_id) REFERENCES passengers(id)
  );


  CREATE TABLE IF NOT EXISTS broadcast_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT 'all',
    target_airline TEXT,
    target_destination TEXT,
    sent_at TEXT NOT NULL,
    sent_by TEXT NOT NULL DEFAULT 'admin'
  );

  CREATE TABLE IF NOT EXISTS dropdown_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    label TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    UNIQUE(category, label)
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chat_default_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    passenger_id INTEGER,
    passenger_name TEXT,
    metadata TEXT,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS companions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    passenger_id INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'adult',
    nationality TEXT NOT NULL DEFAULT '',
    passport_number TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('monitor', 'operator', 'admin')),
    display_name TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS building_qr_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('checkin', 'checkout')),
    label TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    expires_at TEXT
  );
`);

const columnsToAdd = [
  { table: 'passengers', col: 'country TEXT' },
  { table: 'passengers', col: 'passport_number TEXT' },
  { table: 'passengers', col: 'nationality TEXT' },
  { table: 'passengers', col: 'departure_airline TEXT' },
  { table: 'passengers', col: 'departure_date TEXT' },
  { table: 'passengers', col: 'final_destination TEXT' },
  { table: 'events', col: "description TEXT NOT NULL DEFAULT ''" },
  { table: 'benefits', col: "picture_url TEXT NOT NULL DEFAULT ''" },
  { table: 'benefits', col: "available_locations TEXT NOT NULL DEFAULT ''" },
  { table: 'benefits', col: "open_time TEXT NOT NULL DEFAULT ''" },
  { table: 'benefits', col: "close_time TEXT NOT NULL DEFAULT ''" },
  { table: 'benefits', col: "description TEXT NOT NULL DEFAULT ''" },
  { table: 'benefits', col: 'active INTEGER NOT NULL DEFAULT 1' },
  { table: 'passengers', col: "qr_generated_at TEXT NOT NULL DEFAULT ''" },
  { table: 'messages', col: "status TEXT NOT NULL DEFAULT 'open'" },
  { table: 'passengers', col: 'companion_adults INTEGER NOT NULL DEFAULT 0' },
  { table: 'passengers', col: 'companion_children INTEGER NOT NULL DEFAULT 0' },
  { table: 'building_qr_codes', col: 'expires_at TEXT' },
];

for (const { table, col } of columnsToAdd) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${col}`);
  } catch (e) {
    // column might already exist
  }
}

// Seed initial data if empty
const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
if (eventCount.count === 0) {
  db.prepare('INSERT INTO events (name, date) VALUES (?, ?)').run('Disruption Case: War-related cancellations', '2026-03-02');

  db.prepare('INSERT INTO locations (name, capacity, facilities) VALUES (?, ?, ?)').run('Zone A - Sleep Area', 500, 'Sleep, Shower, Charging');
  db.prepare('INSERT INTO locations (name, capacity, facilities) VALUES (?, ?, ?)').run('Zone B - Family Rest', 200, 'Sleep, Infant Care, Water');
  db.prepare('INSERT INTO locations (name, capacity, facilities) VALUES (?, ?, ?)').run('Zone C - Overflow', 1000, 'Seating, Charging');

  db.prepare('INSERT INTO benefits (name, type, value, description, available_locations, open_time, close_time) VALUES (?, ?, ?, ?, ?, ?, ?)').run('Dinner Voucher', 'meal', 0, 'Complimentary dinner at airport restaurants', 'All Terminals', '18:00', '22:00');
  db.prepare('INSERT INTO benefits (name, type, value, description, available_locations, open_time, close_time) VALUES (?, ?, ?, ?, ?, ?, ?)').run('Breakfast Voucher', 'meal', 0, 'Complimentary breakfast at airport cafes', 'All Terminals', '06:00', '10:00');
}

// Seed dropdown options if empty
const dropdownCount = db.prepare('SELECT COUNT(*) as count FROM dropdown_options').get() as { count: number };
if (dropdownCount.count === 0) {
  const nationalities = [
    'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Argentine',
    'Armenian', 'Australian', 'Austrian', 'Azerbaijani', 'Bahamian', 'Bahraini',
    'Bangladeshi', 'Barbadian', 'Belarusian', 'Belgian', 'Belizean', 'Beninese',
    'Bhutanese', 'Bolivian', 'Bosnian', 'Brazilian', 'British', 'Bruneian',
    'Bulgarian', 'Burkinabe', 'Burmese', 'Burundian', 'Cambodian', 'Cameroonian',
    'Canadian', 'Cape Verdean', 'Central African', 'Chadian', 'Chilean', 'Chinese',
    'Colombian', 'Comoran', 'Congolese', 'Costa Rican', 'Croatian', 'Cuban',
    'Cypriot', 'Czech', 'Danish', 'Djiboutian', 'Dominican', 'Dutch', 'Ecuadorean',
    'Egyptian', 'Emirati', 'English', 'Eritrean', 'Estonian', 'Ethiopian', 'Fijian',
    'Filipino', 'Finnish', 'French', 'Gabonese', 'Gambian', 'Georgian', 'German',
    'Ghanaian', 'Greek', 'Grenadian', 'Guatemalan', 'Guinean', 'Guyanese', 'Haitian',
    'Honduran', 'Hungarian', 'Icelandic', 'Indian', 'Indonesian', 'Iranian', 'Iraqi',
    'Irish', 'Israeli', 'Italian', 'Ivorian', 'Jamaican', 'Japanese', 'Jordanian',
    'Kazakh', 'Kenyan', 'Korean', 'Kuwaiti', 'Kyrgyz', 'Lao', 'Latvian', 'Lebanese',
    'Liberian', 'Libyan', 'Lithuanian', 'Luxembourgish', 'Macedonian', 'Malagasy',
    'Malawian', 'Malaysian', 'Maldivian', 'Malian', 'Maltese', 'Mauritanian',
    'Mauritian', 'Mexican', 'Moldovan', 'Mongolian', 'Montenegrin', 'Moroccan',
    'Mozambican', 'Namibian', 'Nepalese', 'New Zealander', 'Nicaraguan', 'Nigerian',
    'Norwegian', 'Omani', 'Pakistani', 'Panamanian', 'Paraguayan', 'Peruvian',
    'Polish', 'Portuguese', 'Qatari', 'Romanian', 'Russian', 'Rwandan', 'Saudi',
    'Scottish', 'Senegalese', 'Serbian', 'Singaporean', 'Slovak', 'Slovenian',
    'Somali', 'South African', 'Spanish', 'Sri Lankan', 'Sudanese', 'Surinamese',
    'Swedish', 'Swiss', 'Syrian', 'Taiwanese', 'Tajik', 'Tanzanian', 'Thai',
    'Togolese', 'Trinidadian', 'Tunisian', 'Turkish', 'Turkmen', 'Ugandan',
    'Ukrainian', 'Uruguayan', 'Uzbek', 'Venezuelan', 'Vietnamese', 'Welsh',
    'Yemeni', 'Zambian', 'Zimbabwean',
  ];

  const airlines = [
    'Aeroflot', 'Air Arabia', 'Air Canada', 'Air China', 'Air France', 'Air India',
    'Air New Zealand', 'Alaska Airlines', 'All Nippon Airways (ANA)', 'American Airlines',
    'Avianca', 'British Airways', 'Cathay Pacific', 'China Eastern', 'China Southern',
    'Copa Airlines', 'Delta Air Lines', 'EgyptAir', 'Emirates', 'Ethiopian Airlines',
    'Etihad Airways', 'EVA Air', 'Finnair', 'flydubai', 'Frontier Airlines',
    'Gulf Air', 'Hainan Airlines', 'Hawaiian Airlines', 'Iberia', 'IndiGo',
    'Japan Airlines (JAL)', 'JetBlue Airways', 'KLM Royal Dutch Airlines',
    'Korean Air', 'LATAM Airlines', 'LOT Polish Airlines', 'Lufthansa',
    'Malaysia Airlines', 'Maldivian', 'Oman Air', 'Philippine Airlines',
    'Qantas', 'Qatar Airways', 'Royal Air Maroc', 'Royal Jordanian',
    'Ryanair', 'SAS Scandinavian Airlines', 'Saudi Arabian Airlines (Saudia)',
    'Singapore Airlines', 'Southwest Airlines', 'SpiceJet', 'Spirit Airlines',
    'SriLankan Airlines', 'Swiss International Air Lines', 'TAP Air Portugal',
    'Thai Airways', 'Turkish Airlines', 'United Airlines', 'Vietnam Airlines',
    'Virgin Atlantic', 'Vistara', 'Vueling', 'WestJet', 'Wizz Air',
  ];

  const destinations = [
    'Abu Dhabi (AUH)', 'Addis Ababa (ADD)', 'Amsterdam (AMS)', 'Athens (ATH)',
    'Auckland (AKL)', 'Bangkok (BKK)', 'Barcelona (BCN)', 'Beijing (PEK)',
    'Berlin (BER)', 'Bogota (BOG)', 'Boston (BOS)', 'Brussels (BRU)',
    'Buenos Aires (EZE)', 'Cairo (CAI)', 'Cape Town (CPT)', 'Casablanca (CMN)',
    'Chennai (MAA)', 'Chicago (ORD)', 'Colombo (CMB)', 'Copenhagen (CPH)',
    'Dallas (DFW)', 'Delhi (DEL)', 'Dhaka (DAC)', 'Doha (DOH)', 'Dubai (DXB)',
    'Dublin (DUB)', 'Frankfurt (FRA)', 'Geneva (GVA)', 'Guangzhou (CAN)',
    'Helsinki (HEL)', 'Hong Kong (HKG)', 'Houston (IAH)', 'Hyderabad (HYD)',
    'Istanbul (IST)', 'Jakarta (CGK)', 'Jeddah (JED)', 'Johannesburg (JNB)',
    'Karachi (KHI)', 'Kathmandu (KTM)', 'Kochi (COK)', 'Kolkata (CCU)',
    'Kuala Lumpur (KUL)', 'Kuwait City (KWI)', 'Lagos (LOS)', 'Lahore (LHE)',
    'Lima (LIM)', 'Lisbon (LIS)', 'London (LHR)', 'Los Angeles (LAX)',
    'Madrid (MAD)', 'Male (MLE)', 'Manchester (MAN)', 'Manila (MNL)',
    'Melbourne (MEL)', 'Mexico City (MEX)', 'Miami (MIA)', 'Milan (MXP)',
    'Montreal (YUL)', 'Moscow (SVO)', 'Mumbai (BOM)', 'Munich (MUC)',
    'Muscat (MCT)', 'Nairobi (NBO)', 'New York (JFK)', 'Osaka (KIX)',
    'Oslo (OSL)', 'Paris (CDG)', 'Perth (PER)', 'Prague (PRG)',
    'Rio de Janeiro (GIG)', 'Riyadh (RUH)', 'Rome (FCO)', 'San Francisco (SFO)',
    'Santiago (SCL)', 'Sao Paulo (GRU)', 'Seattle (SEA)', 'Seoul (ICN)',
    'Shanghai (PVG)', 'Singapore (SIN)', 'Stockholm (ARN)', 'Sydney (SYD)',
    'Taipei (TPE)', 'Tehran (IKA)', 'Tel Aviv (TLV)', 'Tokyo (NRT)',
    'Toronto (YYZ)', 'Vancouver (YVR)', 'Vienna (VIE)', 'Warsaw (WAW)',
    'Washington D.C. (IAD)', 'Zurich (ZRH)',
  ];

  const insertDropdown = db.prepare(
    'INSERT OR IGNORE INTO dropdown_options (category, label, sort_order) VALUES (?, ?, ?)'
  );
  const seedDropdowns = db.transaction(() => {
    nationalities.forEach((label, i) => insertDropdown.run('nationality', label, i));
    airlines.forEach((label, i) => insertDropdown.run('airline', label, i));
    destinations.forEach((label, i) => insertDropdown.run('destination', label, i));
  });
  seedDropdowns();
}

// Seed default app settings if empty
const settingsCount = db.prepare('SELECT COUNT(*) as count FROM app_settings').get() as { count: number };
if (settingsCount.count === 0) {
  db.prepare('INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)').run('qr_expiry_minutes', '30');
  db.prepare('INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)').run('checkin_extension_minutes', '60');
}

// Ensure checkin_extension_minutes setting exists
try {
  const extSetting = db.prepare("SELECT value FROM app_settings WHERE key = 'checkin_extension_minutes'").get();
  if (!extSetting) {
    db.prepare('INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)').run('checkin_extension_minutes', '60');
  }
} catch (e) {
  // ignore
}

// Seed default building QR codes if empty
const buildingQrCount = db.prepare('SELECT COUNT(*) as count FROM building_qr_codes').get() as { count: number };
if (buildingQrCount.count === 0) {
  const now = new Date().toISOString();
  const checkinCode = 'AEROCARE_CHECKIN_' + Math.random().toString(36).substring(2, 15);
  const checkoutCode = 'AEROCARE_CHECKOUT_' + Math.random().toString(36).substring(2, 15);
  db.prepare('INSERT INTO building_qr_codes (code, type, label, created_at) VALUES (?, ?, ?, ?)').run(checkinCode, 'checkin', 'Main Entry - Check In', now);
  db.prepare('INSERT INTO building_qr_codes (code, type, label, created_at) VALUES (?, ?, ?, ?)').run(checkoutCode, 'checkout', 'Main Exit - Check Out', now);
}

// Seed default chat responses if empty
const chatResponsesCount = db.prepare('SELECT COUNT(*) as count FROM chat_default_responses').get() as { count: number };
if (chatResponsesCount.count === 0) {
  const defaultResponses = [
    { title: 'Welcome', message: 'Thank you for reaching out. How can we assist you today?', category: 'general', sort_order: 0 },
    { title: 'Processing', message: 'We are looking into your request. Please allow us a few minutes to check.', category: 'general', sort_order: 1 },
    { title: 'Food Voucher', message: 'Your meal voucher is ready. Please visit any participating restaurant at the airport and show your QR code.', category: 'services', sort_order: 2 },
    { title: 'Rest Area Info', message: 'Rest areas are open 24/7. Please head to your assigned zone shown in the app. Staff will assist with check-in.', category: 'services', sort_order: 3 },
    { title: 'Flight Update', message: 'We are awaiting updates from the airline. We will notify you as soon as new information is available.', category: 'flights', sort_order: 4 },
    { title: 'Rebooking Help', message: 'For rebooking assistance, please visit the airline counter at Gate B12.', category: 'flights', sort_order: 5 },
    { title: 'WiFi Info', message: 'Free airport WiFi is available. Connect to "Airport_Free" and accept the terms to get online.', category: 'facilities', sort_order: 6 },
    { title: 'Thank You', message: 'Thank you for your patience. If you need anything else, do not hesitate to reach out.', category: 'general', sort_order: 7 },
  ];

  const insertChatResponse = db.prepare(
    'INSERT INTO chat_default_responses (title, message, category, sort_order) VALUES (?, ?, ?, ?)'
  );
  const seedChatResponses = db.transaction(() => {
    for (const r of defaultResponses) {
      insertChatResponse.run(r.title, r.message, r.category, r.sort_order);
    }
  });
  seedChatResponses();
}

// Seed default admin users if empty
const adminUsersCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
if (adminUsersCount.count === 0) {
  const insertAdminUser = db.prepare(
    'INSERT INTO admin_users (username, password, role, display_name) VALUES (?, ?, ?, ?)'
  );
  const seedAdminUsers = db.transaction(() => {
    insertAdminUser.run('monitor', 'monitor123', 'monitor', 'Monitor User');
    insertAdminUser.run('operator', 'operator123', 'operator', 'Operator User');
    insertAdminUser.run('admin', 'admin123', 'admin', 'Administrator');
  });
  seedAdminUsers();
}

export default db;
