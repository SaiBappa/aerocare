import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './server/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/events', (req, res) => {
    const events = db.prepare('SELECT * FROM events').all();
    res.json(events);
  });

  app.get('/api/locations', (req, res) => {
    const locations = db.prepare('SELECT * FROM locations').all();
    res.json(locations);
  });

  app.get('/api/benefits', (req, res) => {
    const benefits = db.prepare('SELECT * FROM benefits').all();
    res.json(benefits);
  });

  app.post('/api/passengers/register', (req, res) => {
    const { event_id, name, flight_number, location_id } = req.body;
    const qr_token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    try {
      const result = db.prepare(
        'INSERT INTO passengers (event_id, name, flight_number, location_id, qr_token) VALUES (?, ?, ?, ?, ?)'
      ).run(event_id, name, flight_number, location_id, qr_token);
      
      const passengerId = result.lastInsertRowid;
      
      // Assign default benefits
      const benefits = db.prepare('SELECT id FROM benefits').all() as {id: number}[];
      for (const benefit of benefits) {
        db.prepare('INSERT INTO passenger_benefits (passenger_id, benefit_id) VALUES (?, ?)').run(passengerId, benefit.id);
      }
      
      res.json({ success: true, qr_token, passenger_id: passengerId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to register passenger' });
    }
  });

  app.get('/api/passengers/:qr_token', (req, res) => {
    const passenger = db.prepare('SELECT * FROM passengers WHERE qr_token = ?').get(req.params.qr_token);
    if (!passenger) {
      return res.status(404).json({ error: 'Passenger not found' });
    }
    
    const location = db.prepare('SELECT * FROM locations WHERE id = ?').get((passenger as any).location_id);
    const benefits = db.prepare(`
      SELECT pb.id, pb.status, b.name, b.type, b.value 
      FROM passenger_benefits pb 
      JOIN benefits b ON pb.benefit_id = b.id 
      WHERE pb.passenger_id = ?
    `).all((passenger as any).id);
    
    const messages = db.prepare('SELECT * FROM messages WHERE passenger_id = ? ORDER BY timestamp ASC').all((passenger as any).id);
    
    res.json({ ...passenger, location, benefits, messages });
  });

  app.post('/api/scan', (req, res) => {
    const { qr_token, action, location_id, outlet_id, benefit_id } = req.body;
    const passenger = db.prepare('SELECT * FROM passengers WHERE qr_token = ?').get(qr_token) as any;
    
    if (!passenger) {
      return res.status(404).json({ error: 'Invalid QR code' });
    }

    const timestamp = new Date().toISOString();

    try {
      if (action === 'check-in') {
        db.prepare('INSERT INTO transactions (passenger_id, type, location_id, timestamp) VALUES (?, ?, ?, ?)').run(passenger.id, 'check-in', location_id, timestamp);
        db.prepare('UPDATE passengers SET status = ? WHERE id = ?').run('checked-in', passenger.id);
        res.json({ success: true, message: 'Checked in successfully' });
      } else if (action === 'check-out') {
        db.prepare('INSERT INTO transactions (passenger_id, type, location_id, timestamp) VALUES (?, ?, ?, ?)').run(passenger.id, 'check-out', location_id, timestamp);
        db.prepare('UPDATE passengers SET status = ? WHERE id = ?').run('checked-out', passenger.id);
        res.json({ success: true, message: 'Checked out successfully' });
      } else if (action === 'redeem') {
        const benefit = db.prepare('SELECT * FROM passenger_benefits WHERE id = ? AND passenger_id = ?').get(benefit_id, passenger.id) as any;
        if (!benefit || benefit.status !== 'available') {
          return res.status(400).json({ error: 'Benefit not available or already used' });
        }
        db.prepare('UPDATE passenger_benefits SET status = ? WHERE id = ?').run('used', benefit_id);
        db.prepare('INSERT INTO transactions (passenger_id, type, outlet_id, timestamp) VALUES (?, ?, ?, ?)').run(passenger.id, 'redeem', outlet_id, timestamp);
        res.json({ success: true, message: 'Benefit redeemed successfully' });
      } else {
        res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Transaction failed' });
    }
  });

  app.post('/api/messages', (req, res) => {
    const { passenger_id, text, sender } = req.body;
    const timestamp = new Date().toISOString();
    
    try {
      db.prepare('INSERT INTO messages (passenger_id, text, sender, timestamp) VALUES (?, ?, ?, ?)').run(passenger_id, text, sender, timestamp);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.get('/api/dashboard', (req, res) => {
    const totalPassengers = db.prepare('SELECT COUNT(*) as count FROM passengers').get() as {count: number};
    const checkedIn = db.prepare("SELECT COUNT(*) as count FROM passengers WHERE status = 'checked-in'").get() as {count: number};
    const benefitsUsed = db.prepare("SELECT COUNT(*) as count FROM passenger_benefits WHERE status = 'used'").get() as {count: number};
    const messagesCount = db.prepare("SELECT COUNT(*) as count FROM messages WHERE sender = 'passenger'").get() as {count: number};
    
    const locationsOccupancy = db.prepare(`
      SELECT l.name, l.capacity, COUNT(p.id) as occupancy
      FROM locations l
      LEFT JOIN passengers p ON p.location_id = l.id AND p.status = 'checked-in'
      GROUP BY l.id
    `).all();

    res.json({
      totalPassengers: totalPassengers.count,
      checkedIn: checkedIn.count,
      benefitsUsed: benefitsUsed.count,
      messagesCount: messagesCount.count,
      locationsOccupancy
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
