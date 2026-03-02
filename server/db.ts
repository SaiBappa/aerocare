import Database from 'better-sqlite3';

const db = new Database('aerocare.db');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
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
    flight_number TEXT NOT NULL,
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
    value INTEGER NOT NULL
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
    outlet_id INTEGER,
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
`);

// Seed initial data if empty
const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
if (eventCount.count === 0) {
  db.prepare('INSERT INTO events (name, date) VALUES (?, ?)').run('Disruption Case: War-related cancellations', '2026-03-02');
  
  db.prepare('INSERT INTO locations (name, capacity, facilities) VALUES (?, ?, ?)').run('Zone A - Sleep Area', 500, 'Sleep, Shower, Charging');
  db.prepare('INSERT INTO locations (name, capacity, facilities) VALUES (?, ?, ?)').run('Zone B - Family Rest', 200, 'Sleep, Infant Care, Water');
  db.prepare('INSERT INTO locations (name, capacity, facilities) VALUES (?, ?, ?)').run('Zone C - Overflow', 1000, 'Seating, Charging');

  db.prepare('INSERT INTO benefits (name, type, value) VALUES (?, ?, ?)').run('Dinner Voucher', 'meal', 0);
  db.prepare('INSERT INTO benefits (name, type, value) VALUES (?, ?, ?)').run('Breakfast Voucher', 'meal', 0);
  db.prepare('INSERT INTO benefits (name, type, value) VALUES (?, ?, ?)').run('20% Duty Free', 'discount', 20);
}

export default db;
