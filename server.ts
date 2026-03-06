import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { supabase } from './server/supabase.js';
import { supabaseAdmin } from './server/supabaseAdmin.js';

dotenv.config({ path: '.env.local' });

const LANG_NAMES: Record<string, string> = {
  en: 'English', zh: 'Chinese (Simplified)', ru: 'Russian', de: 'German',
  ja: 'Japanese', ko: 'Korean', fr: 'French', it: 'Italian', ar: 'Arabic', hi: 'Hindi',
};

const nationalityToCountry: Record<string, string> = {
  'Afghan': 'Afghanistan',
  'Albanian': 'Albania',
  'Algerian': 'Algeria',
  'American': 'United States',
  'Andorran': 'Andorra',
  'Angolan': 'Angola',
  'Argentine': 'Argentina',
  'Armenian': 'Armenia',
  'Australian': 'Australia',
  'Austrian': 'Austria',
  'Azerbaijani': 'Azerbaijan',
  'Bahamian': 'Bahamas',
  'Bahraini': 'Bahrain',
  'Bangladeshi': 'Bangladesh',
  'Barbadian': 'Barbados',
  'Belarusian': 'Belarus',
  'Belgian': 'Belgium',
  'Belizean': 'Belize',
  'Beninese': 'Benin',
  'Bhutanese': 'Bhutan',
  'Bolivian': 'Bolivia',
  'Bosnian': 'Bosnia and Herzegovina',
  'Brazilian': 'Brazil',
  'British': 'United Kingdom',
  'Bruneian': 'Brunei',
  'Bulgarian': 'Bulgaria',
  'Burkinabe': 'Burkina Faso',
  'Burmese': 'Myanmar',
  'Burundian': 'Burundi',
  'Cambodian': 'Cambodia',
  'Cameroonian': 'Cameroon',
  'Canadian': 'Canada',
  'Cape Verdean': 'Cape Verde',
  'Central African': 'Central African Republic',
  'Chadian': 'Chad',
  'Chilean': 'Chile',
  'Chinese': 'China',
  'Colombian': 'Colombia',
  'Comoran': 'Comoros',
  'Congolese': 'Congo',
  'Costa Rican': 'Costa Rica',
  'Croatian': 'Croatia',
  'Cuban': 'Cuba',
  'Cypriot': 'Cyprus',
  'Czech': 'Czech Republic',
  'Danish': 'Denmark',
  'Djiboutian': 'Djibouti',
  'Dominican': 'Dominican Republic',
  'Dutch': 'Netherlands',
  'Ecuadorean': 'Ecuador',
  'Egyptian': 'Egypt',
  'Emirati': 'United Arab Emirates',
  'English': 'United Kingdom',
  'Eritrean': 'Eritrea',
  'Estonian': 'Estonia',
  'Ethiopian': 'Ethiopia',
  'Fijian': 'Fiji',
  'Filipino': 'Philippines',
  'Finnish': 'Finland',
  'French': 'France',
  'Gabonese': 'Gabon',
  'Gambian': 'Gambia',
  'Georgian': 'Georgia',
  'German': 'Germany',
  'Ghanaian': 'Ghana',
  'Greek': 'Greece',
  'Grenadian': 'Grenada',
  'Guatemalan': 'Guatemala',
  'Guinean': 'Guinea',
  'Guyanese': 'Guyana',
  'Haitian': 'Haiti',
  'Honduran': 'Honduras',
  'Hungarian': 'Hungary',
  'Icelandic': 'Iceland',
  'Indian': 'India',
  'Indonesian': 'Indonesia',
  'Iranian': 'Iran',
  'Iraqi': 'Iraq',
  'Irish': 'Ireland',
  'Israeli': 'Israel',
  'Italian': 'Italy',
  'Ivorian': 'Ivory Coast',
  'Jamaican': 'Jamaica',
  'Japanese': 'Japan',
  'Jordanian': 'Jordan',
  'Kazakh': 'Kazakhstan',
  'Kenyan': 'Kenya',
  'Korean': 'South Korea',
  'Kuwaiti': 'Kuwait',
  'Kyrgyz': 'Kyrgyzstan',
  'Lao': 'Laos',
  'Latvian': 'Latvia',
  'Lebanese': 'Lebanon',
  'Liberian': 'Liberia',
  'Libyan': 'Libya',
  'Lithuanian': 'Lithuania',
  'Luxembourgish': 'Luxembourg',
  'Macedonian': 'North Macedonia',
  'Malagasy': 'Madagascar',
  'Malawian': 'Malawi',
  'Malaysian': 'Malaysia',
  'Maldivian': 'Maldives',
  'Malian': 'Mali',
  'Maltese': 'Malta',
  'Mauritanian': 'Mauritania',
  'Mauritian': 'Mauritius',
  'Mexican': 'Mexico',
  'Moldovan': 'Moldova',
  'Mongolian': 'Mongolia',
  'Montenegrin': 'Montenegro',
  'Moroccan': 'Morocco',
  'Mozambican': 'Mozambique',
  'Namibian': 'Namibia',
  'Nepalese': 'Nepal',
  'New Zealander': 'New Zealand',
  'Nicaraguan': 'Nicaragua',
  'Nigerian': 'Nigeria',
  'Norwegian': 'Norway',
  'Omani': 'Oman',
  'Pakistani': 'Pakistan',
  'Panamanian': 'Panama',
  'Paraguayan': 'Paraguay',
  'Peruvian': 'Peru',
  'Polish': 'Poland',
  'Portuguese': 'Portugal',
  'Qatari': 'Qatar',
  'Romanian': 'Romania',
  'Russian': 'Russia',
  'Rwandan': 'Rwanda',
  'Saudi': 'Saudi Arabia',
  'Scottish': 'United Kingdom',
  'Senegalese': 'Senegal',
  'Serbian': 'Serbia',
  'Singaporean': 'Singapore',
  'Slovak': 'Slovakia',
  'Slovenian': 'Slovenia',
  'Somali': 'Somalia',
  'South African': 'South Africa',
  'Spanish': 'Spain',
  'Sri Lankan': 'Sri Lanka',
  'Sudanese': 'Sudan',
  'Surinamese': 'Suriname',
  'Swedish': 'Sweden',
  'Swiss': 'Switzerland',
  'Syrian': 'Syria',
  'Taiwanese': 'Taiwan',
  'Tajik': 'Tajikistan',
  'Tanzanian': 'Tanzania',
  'Thai': 'Thailand',
  'Togolese': 'Togo',
  'Trinidadian': 'Trinidad and Tobago',
  'Tunisian': 'Tunisia',
  'Turkish': 'Turkey',
  'Turkmen': 'Turkmenistan',
  'Ugandan': 'Uganda',
  'Ukrainian': 'Ukraine',
  'Uruguayan': 'Uruguay',
  'Uzbek': 'Uzbekistan',
  'Venezuelan': 'Venezuela',
  'Vietnamese': 'Vietnam',
  'Welsh': 'United Kingdom',
  'Yemeni': 'Yemen',
  'Zambian': 'Zambia',
  'Zimbabwean': 'Zimbabwe',
};

function getCountryFromNationality(nationality: string): string {
  if (!nationality) return '';
  const trimmed = nationality.trim();
  // Check direct mapping
  if (nationalityToCountry[trimmed]) {
    return nationalityToCountry[trimmed];
  }
  // Fallback: If not found, return the nationality itself
  return trimmed;
}

// In-memory translation cache: key = `${lang}:${text}` → translated
const translationCache = new Map<string, string>();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

  app.use(express.json());

  const requireRole = (allowedRoles: string[]) => async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: missing or invalid token' });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: invalid token' });
    }

    // Default to 'staff' if no role explicitly set (for basic access) or handle properly
    const role = user.app_metadata?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }

    (req as any).user = user;
    next();
  };

  // We enforce requireRole(['admin']) for user management routes
  // Other admin routes should really be protected with requireRole(['admin', 'dashboard'])
  // For now, let's just implement the user management endpoints.

  // Admin User Management (Admin only)
  app.get('/api/admin/users', requireRole(['admin']), async (req, res) => {
    try {
      const { data: usersData, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;
      const users = usersData.users.map(u => ({
        id: u.id,
        email: u.email,
        display_name: u.user_metadata?.display_name || u.email,
        role: u.app_metadata?.role || 'staff',
        active: u.app_metadata?.active ?? 1
      }));
      res.json(users);
    } catch (error) {
      console.error('Failed to fetch admin users:', error);
      res.status(500).json({ error: 'Failed to fetch admin users' });
    }
  });

  app.put('/api/admin/users/:id', requireRole(['admin']), async (req, res) => {
    const id = req.params.id;

    const { display_name, password, role, active } = req.body;

    if (role !== undefined && !['staff', 'dashboard', 'admin', 'stakeholder'].includes(role)) {
      return res.status(400).json({ error: 'Role must be one of: staff, dashboard, admin, stakeholder' });
    }

    try {
      // First get existing user to preserve other app_metadata
      const { data: existingUser, error: existError } = await supabaseAdmin.auth.admin.getUserById(id);
      if (existError || !existingUser.user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updates: any = {};

      const newAppMetadata = { ...existingUser.user.app_metadata };
      let metaChanged = false;

      if (role !== undefined) {
        newAppMetadata.role = role;
        metaChanged = true;
      }
      if (active !== undefined) {
        newAppMetadata.active = active ? 1 : 0;
        metaChanged = true;
      }
      if (metaChanged) {
        updates.app_metadata = newAppMetadata;
      }

      if (display_name !== undefined) {
        updates.user_metadata = { ...(existingUser.user.user_metadata || {}), display_name: display_name.trim() };
      }
      if (password !== undefined && password.length > 0) {
        updates.password = password;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const { data: updated, error } = await supabaseAdmin.auth.admin.updateUserById(id, updates);
      if (error) throw error;

      const u = updated.user;
      res.json({
        id: u.id,
        email: u.email,
        display_name: u.user_metadata?.display_name || u.email,
        role: u.app_metadata?.role || 'staff',
        active: u.app_metadata?.active ?? 1
      });
    } catch (error: any) {
      console.error('Failed to update admin user:', error);
      res.status(500).json({ error: error.message || 'Failed to update admin user' });
    }
  });

  app.post('/api/admin/users', requireRole(['admin']), async (req, res) => {
    console.log("HIT POST /api/admin/users with body:", req.body);
    const { email, password, role, display_name } = req.body;

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!password || typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'Password is required' });
    }
    if (!role || !['staff', 'dashboard', 'admin', 'stakeholder'].includes(role)) {
      return res.status(400).json({ error: 'Role must be one of: staff, dashboard, admin, stakeholder' });
    }
    if (!display_name || typeof display_name !== 'string' || display_name.trim().length === 0) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    try {
      const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim(),
        password: password,
        email_confirm: true,
        user_metadata: { display_name: display_name.trim() },
        app_metadata: { role: role, active: 1 }
      });

      if (error) {
        throw error;
      }

      const u = newUser.user;
      res.status(201).json({
        id: u.id,
        email: u.email,
        display_name: u.user_metadata?.display_name || u.email,
        role: u.app_metadata?.role || 'staff',
        active: u.app_metadata?.active ?? 1
      });
    } catch (error: any) {
      console.error('Failed to create admin user:', error);
      if (error.message && error.message.includes('already registered')) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: error.message || 'Failed to create user' });
    }
  });

  app.delete('/api/admin/users/:id', requireRole(['admin']), async (req, res) => {
    const id = req.params.id;

    try {
      // Prevent deleting self
      if ((req as any).user.id === id) {
        return res.status(409).json({ error: 'Cannot delete yourself' });
      }

      const { data: existing, error: existError } = await supabaseAdmin.auth.admin.getUserById(id);
      if (existError || !existing.user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) throw error;
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Failed to delete admin user:', error);
      res.status(500).json({ error: 'Failed to delete admin user' });
    }
  });

  // ───── App Settings ─────
  app.get('/api/settings', async (req, res) => {
    try {
      const { data: rows, error } = await supabase.from('app_settings').select('key, value');
      if (error) throw error;
      const settings: Record<string, string> = {};
      for (const row of rows || []) {
        settings[row.key] = row.value;
      }
      res.json(settings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.put('/api/settings', async (req, res) => {
    const { key, value } = req.body;

    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'Key is required and must be a string' });
    }
    if (value === undefined || value === null) {
      return res.status(400).json({ error: 'Value is required' });
    }

    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value: String(value) }, { onConflict: 'key' });
      if (error) throw error;
      res.json({ success: true, key, value: String(value) });
    } catch (error) {
      console.error('Failed to update setting:', error);
      res.status(500).json({ error: 'Failed to update setting' });
    }
  });

  // ───── Building QR Codes & Scanning ─────
  app.get('/api/building/qr-codes', async (req, res) => {
    try {
      const { data: codes, error } = await supabase.from('building_qr_codes').select('*, locations(name)').order('type').order('id');
      if (error) throw error;
      res.json(codes || []);
    } catch (error) {
      console.error('Failed to fetch building QR codes:', error);
      res.status(500).json({ error: 'Failed to fetch QR codes' });
    }
  });

  app.get('/api/building/qr-codes/:id', async (req, res) => {
    try {
      const { data: qr, error } = await supabase.from('building_qr_codes').select('*').eq('id', req.params.id).single();
      if (error || !qr) return res.status(404).json({ error: 'QR Code not found' });
      res.json(qr);
    } catch (error) {
      console.error('Failed to fetch building QR code:', error);
      res.status(500).json({ error: 'Failed to fetch QR code' });
    }
  });

  app.post('/api/building/qr-codes/generate', async (req, res) => {
    const { type, label, location_id, expires_at } = req.body;
    if (!['checkin', 'checkout'].includes(type)) {
      return res.status(400).json({ error: 'Type must be checkin or checkout' });
    }
    try {
      const code = `AEROCARE_${type.toUpperCase()}_${Math.random().toString(36).substring(2, 15)}`;
      const now = new Date().toISOString();
      const { data: newCode, error } = await supabase
        .from('building_qr_codes')
        .insert({ code, type, label: label || '', location_id: location_id || null, created_at: now, expires_at: expires_at || null })
        .select('*, locations(name)')
        .single();
      if (error) throw error;
      res.json({ success: true, qr_code: newCode });
    } catch (error) {
      console.error('Failed to generate building QR code:', error);
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  });

  app.delete('/api/building/qr-codes/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
      const { error } = await supabase.from('building_qr_codes').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete QR code' });
    }
  });

  async function processCheckinCheckout(passenger: any, action: 'checkin' | 'checkout', location_id: number | string, label: string = '') {
    const now = new Date().toISOString();
    const isCheckin = action === 'checkin';
    const isAlreadyCheckedIn = passenger.status === 'checked-in';

    // Special case: renewal for already checked in passengers
    if (isCheckin && isAlreadyCheckedIn) {
      await supabase.from('passengers').update({ qr_generated_at: now }).eq('id', passenger.id);
      const { data: companions } = await supabase.from('companions').select('*').eq('passenger_id', passenger.id).order('id');
      return {
        success: true,
        message: 'QR Pass renewed successfully.',
        type: 'renewal',
        location: label,
        passenger: {
          name: passenger.name,
          passport_number: passenger.passport_number,
          nationality: passenger.nationality,
          companions: companions || []
        }
      };
    }

    // Prevent checkout if not checked in
    if (!isCheckin && !isAlreadyCheckedIn) {
      throw new Error('Passenger is not checked in');
    }

    const newStatus = isCheckin ? 'checked-in' : 'checked-out';
    const logDescription = `${passenger.name} ${isCheckin ? 'Checked-in' : 'Checked-out'} via staff assistance at ${label || location_id}`;

    await Promise.all([
      supabase.from('passengers').update({ status: newStatus, qr_generated_at: now }).eq('id', passenger.id),
      supabase.from('activity_log').insert({
        type: isCheckin ? 'check-in' : 'check-out',
        description: logDescription,
        passenger_id: passenger.id,
        passenger_name: passenger.name,
        timestamp: now
      }),
      supabase.from('transactions').insert({
        passenger_id: passenger.id,
        type: isCheckin ? 'check-in' : 'check-out',
        timestamp: now
      })
    ]);

    const { data: companions } = await supabase.from('companions').select('*').eq('passenger_id', passenger.id).order('id');

    return {
      success: true,
      message: isCheckin ? 'Checked in successfully.' : 'Checked out successfully.',
      type: isCheckin ? 'checkin' : 'checkout',
      location: label,
      passenger: {
        name: passenger.name,
        passport_number: passenger.passport_number,
        nationality: passenger.nationality,
        companions: companions || []
      }
    };
  }

  app.post('/api/building/scan', async (req, res) => {
    const { passenger_qr_token, building_qr_code } = req.body;

    if (!passenger_qr_token || !building_qr_code) {
      return res.status(400).json({ error: 'Passenger QR token and Building QR code are required' });
    }

    try {
      const { data: passenger } = await supabase.from('passengers').select('*').eq('qr_token', passenger_qr_token).single();
      if (!passenger) return res.status(404).json({ error: 'Invalid passenger QR token' });

      const { data: buildingQR } = await supabase.from('building_qr_codes').select('*, locations(name)').eq('code', building_qr_code).eq('active', 1).single();
      if (!buildingQR) return res.status(404).json({ error: 'Invalid or inactive building QR code' });

      if (buildingQR.expires_at && new Date() > new Date(buildingQR.expires_at)) {
        return res.status(400).json({ error: 'This building QR code has expired' });
      }

      const locId = buildingQR.location_id || 0;
      const locName = buildingQR.locations?.name ? `${buildingQR.locations.name} - ${buildingQR.label}` : (buildingQR.label || buildingQR.code);

      const result = await processCheckinCheckout(passenger, buildingQR.type, locId, locName);
      res.json(result);
    } catch (error: any) {
      console.error('Scan processing error:', error);
      res.status(500).json({ error: error.message || 'Failed to process scan' });
    }
  });

  app.post('/api/staff/assist', async (req, res) => {
    const { nationality, passport_number, action, location_id } = req.body;

    if (!nationality || !passport_number || !action || !location_id) {
      return res.status(400).json({ error: 'Nationality, passport number, action, and location are required' });
    }

    if (!['checkin', 'checkout'].includes(action)) {
      return res.status(400).json({ error: 'Action must be checkin or checkout' });
    }

    try {
      const { data: passenger } = await supabase
        .from('passengers')
        .select('*')
        .ilike('nationality', nationality.trim())
        .ilike('passport_number', passport_number.trim())
        .single();

      if (!passenger) {
        return res.status(404).json({ error: 'Passenger not found with provided nationality and passport number' });
      }

      const { data: location } = await supabase.from('locations').select('name').eq('id', location_id).single();
      const locationName = location ? location.name : `Location ${location_id}`;

      const result = await processCheckinCheckout(passenger, action, location_id, locationName);
      res.json(result);
    } catch (error: any) {
      console.error('Staff assist error:', error);
      res.status(500).json({ error: error.message || 'Failed to process staff assistance' });
    }
  });

  app.get('/api/building/occupancy', async (req, res) => {
    try {
      const { count } = await supabase.from('passengers').select('*', { count: 'exact', head: true }).eq('status', 'checked-in');
      res.json({ inside: count || 0 });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get occupancy' });
    }
  });

  // API Routes
  // ───── Events CRUD ─────
  app.get('/api/events', async (req, res) => {
    try {
      const { data: events } = await supabase.from('events').select('*').order('date', { ascending: false });
      res.json(events || []);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid event ID' });
    try {
      const { data: event } = await supabase.from('events').select('*').eq('id', id).single();
      if (!event) return res.status(404).json({ error: 'Event not found' });
      res.json(event);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch event' });
    }
  });

  app.post('/api/events', async (req, res) => {
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Event name is required and must be a non-empty string' });
    }
    if (description !== undefined && typeof description !== 'string') {
      return res.status(400).json({ error: 'Description must be a string' });
    }

    const date = new Date().toISOString().split('T')[0];

    try {
      const { data: newEvent, error } = await supabase.from('events').insert({
        name: name.trim(),
        description: (description || '').trim(),
        date
      }).select().single();
      if (error) throw error;
      res.status(201).json(newEvent);
    } catch (error) {
      console.error('Failed to create event:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  });

  app.put('/api/events/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid event ID' });

    const { name, description, status } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Event name is required and must be a non-empty string' });
    }
    if (description !== undefined && typeof description !== 'string') {
      return res.status(400).json({ error: 'Description must be a string' });
    }

    try {
      const { data: updated, error } = await supabase.from('events').update({
        name: name.trim(),
        description: (description || '').trim(),
        status: status || 'active'
      }).eq('id', id).select().single();
      if (error) throw error;
      res.json(updated);
    } catch (error) {
      console.error('Failed to update event:', error);
      res.status(500).json({ error: 'Failed to update event' });
    }
  });

  app.delete('/api/events/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid event ID' });

    try {
      const { count } = await supabase.from('passengers').select('*', { count: 'exact', head: true }).eq('event_id', id);
      if (count && count > 0) {
        return res.status(409).json({ error: `Cannot delete event with ${count} registered passenger(s). Remove them first.` });
      }

      await supabase.from('events').delete().eq('id', id);
      res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Failed to delete event:', error);
      res.status(500).json({ error: 'Failed to delete event' });
    }
  });

  app.get('/api/locations', async (req, res) => {
    try {
      const { data: locations } = await supabase.from('locations').select('*');
      res.json(locations || []);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch locations' });
    }
  });

  app.get('/api/locations/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid location ID' });
    try {
      const { data: location } = await supabase.from('locations').select('*').eq('id', id).single();
      if (!location) return res.status(404).json({ error: 'Location not found' });
      res.json(location);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch location' });
    }
  });

  app.post('/api/locations', async (req, res) => {
    const { name, capacity, facilities } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
    }
    if (capacity == null || typeof capacity !== 'number' || capacity < 0) {
      return res.status(400).json({ error: 'Capacity is required and must be a non-negative number' });
    }
    if (!facilities || typeof facilities !== 'string' || facilities.trim().length === 0) {
      return res.status(400).json({ error: 'Facilities is required and must be a non-empty string' });
    }

    try {
      const { data: newLocation, error } = await supabase.from('locations').insert({
        name: name.trim(),
        capacity,
        facilities: facilities.trim()
      }).select().single();
      if (error) throw error;
      res.status(201).json(newLocation);
    } catch (error) {
      console.error('Failed to create location:', error);
      res.status(500).json({ error: 'Failed to create location' });
    }
  });

  app.put('/api/locations/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid location ID' });

    const { name, capacity, facilities } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
    }
    if (capacity == null || typeof capacity !== 'number' || capacity < 0) {
      return res.status(400).json({ error: 'Capacity is required and must be a non-negative number' });
    }
    if (!facilities || typeof facilities !== 'string' || facilities.trim().length === 0) {
      return res.status(400).json({ error: 'Facilities is required and must be a non-empty string' });
    }

    try {
      const { data: updated, error } = await supabase.from('locations').update({
        name: name.trim(),
        capacity,
        facilities: facilities.trim()
      }).eq('id', id).select().single();
      if (error) throw error;
      res.json(updated);
    } catch (error) {
      console.error('Failed to update location:', error);
      res.status(500).json({ error: 'Failed to update location' });
    }
  });

  app.delete('/api/locations/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid location ID' });

    try {
      const { count } = await supabase.from('passengers').select('*', { count: 'exact', head: true }).eq('location_id', id).eq('status', 'checked-in');
      if (count && count > 0) {
        return res.status(409).json({ error: `Cannot delete location with ${count} checked-in passenger(s). Reassign them first.` });
      }

      await supabase.from('locations').delete().eq('id', id);
      res.json({ success: true, message: 'Location deleted successfully' });
    } catch (error) {
      console.error('Failed to delete location:', error);
      res.status(500).json({ error: 'Failed to delete location' });
    }
  });



  app.post('/api/passengers/register', async (req, res) => {
    const {
      event_id,
      name,
      flight_number,
      location_id,
      country,
      passport_number,
      nationality,
      departure_airline,
      departure_date,
      final_destination,
      companions
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    if (!nationality || typeof nationality !== 'string' || nationality.trim().length === 0) {
      return res.status(400).json({ error: 'Nationality is required' });
    }

    // Validate companions if provided
    const companionList: Array<{ type: string; nationality: string; passport_number: string }> = [];
    if (companions && Array.isArray(companions)) {
      for (const c of companions) {
        if (!c || typeof c !== 'object') continue;
        const cType = c.type === 'child' ? 'child' : 'adult';
        const cNationality = typeof c.nationality === 'string' ? c.nationality.trim() : '';
        const cPassport = typeof c.passport_number === 'string' ? c.passport_number.trim() : '';
        if (!cNationality) {
          return res.status(400).json({ error: 'Nationality is required for all companions' });
        }
        if (!cPassport) {
          return res.status(400).json({ error: 'Passport number is required for all companions' });
        }
        companionList.push({ type: cType, nationality: cNationality, passport_number: cPassport });
      }
    }

    // Check for duplicate passport across both passengers and companions
    const allChecking = [
      { nationality: nationality.trim(), passport_number: passport_number.trim() },
      ...companionList
    ];

    const uniquePassports = new Set(allChecking.map(p => `${p.nationality.toLowerCase()}-${p.passport_number.toLowerCase()}`));
    if (uniquePassports.size < allChecking.length) {
      return res.status(400).json({ error: 'Duplicate passport numbers found in the request' });
    }

    for (const person of allChecking) {
      if (!person.nationality || !person.passport_number) continue;

      const { data: existingPass } = await supabase
        .from('passengers')
        .select('id')
        .ilike('nationality', person.nationality)
        .ilike('passport_number', person.passport_number)
        .single();

      const { data: existingComp } = await supabase
        .from('companions')
        .select('id')
        .ilike('nationality', person.nationality)
        .ilike('passport_number', person.passport_number)
        .single();

      if (existingPass || existingComp) {
        return res.status(409).json({ error: 'If already registered, please request to check' });
      }
    }

    const companionAdults = companionList.filter(c => c.type === 'adult').length;
    const companionChildren = companionList.filter(c => c.type === 'child').length;

    const qr_token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const qr_generated_at = new Date().toISOString();

    // Default event_id to 1 if not provided (self-registration)
    const resolvedEventId = event_id || 1;

    try {
      const { data: result, error } = await supabase.from('passengers').insert({
        event_id: resolvedEventId,
        name: name.trim(),
        flight_number: flight_number ? flight_number.trim() : null,
        location_id: location_id || null,
        country: country ? country.trim() : getCountryFromNationality(nationality),
        passport_number: passport_number ? passport_number.trim() : null,
        nationality: nationality.trim(),
        departure_airline: departure_airline ? departure_airline.trim() : null,
        departure_date: departure_date ? departure_date.trim() : null,
        final_destination: final_destination ? final_destination.trim() : null,
        qr_token,
        qr_generated_at,
        status: 'checked-in',
        companion_adults: companionAdults,
        companion_children: companionChildren
      }).select().single();

      if (error) throw error;
      const passengerId = result.id;

      // Insert companions
      if (companionList.length > 0) {
        const companionsToInsert = companionList.map(c => ({
          passenger_id: passengerId,
          type: c.type,
          nationality: c.nationality,
          passport_number: c.passport_number
        }));
        await supabase.from('companions').insert(companionsToInsert);
      }

      const totalGroup = 1 + companionList.length;
      const timestamp = new Date().toISOString();

      let locName = null;
      if (location_id) {
        const { data: loc } = await supabase.from('locations').select('name').eq('id', location_id).single();
        locName = loc?.name;
      }

      await supabase.from('transactions').insert({
        passenger_id: passengerId,
        type: 'check-in',
        location_id: location_id || null,
        timestamp
      });

      // Log activity
      await supabase.from('activity_log').insert([
        {
          type: 'registration',
          description: `${name.trim()} registered as a new passenger (group of ${totalGroup})`,
          passenger_id: passengerId,
          passenger_name: name.trim(),
          timestamp
        },
        {
          type: 'check-in',
          description: `${name.trim()} checked in${locName ? ` at ${locName}` : ''} automatically upon registration`,
          passenger_id: passengerId,
          passenger_name: name.trim(),
          metadata: JSON.stringify({ location_id: location_id || null }),
          timestamp
        }
      ]);

      res.json({ success: true, qr_token, passenger_id: passengerId });
    } catch (error) {
      console.error('Failed to register passenger:', error);
      res.status(500).json({ error: 'Failed to register passenger' });
    }
  });

  // ───── Companion Management ─────
  app.get('/api/passengers/:qr_token/companions', async (req, res) => {
    const { data: passenger } = await supabase.from('passengers').select('id').eq('qr_token', req.params.qr_token).single();
    if (!passenger) {
      return res.status(404).json({ error: 'Passenger not found' });
    }
    const { data: companions } = await supabase.from('companions').select('*').eq('passenger_id', passenger.id).order('id');
    res.json(companions || []);
  });

  app.post('/api/passengers/:qr_token/companions', async (req, res) => {
    const { data: passenger } = await supabase.from('passengers').select('*').eq('qr_token', req.params.qr_token).single();
    if (!passenger) {
      return res.status(404).json({ error: 'Passenger not found' });
    }

    const { type, nationality: cNationality, passport_number: cPassport } = req.body;
    if (!cNationality || typeof cNationality !== 'string' || cNationality.trim().length === 0) {
      return res.status(400).json({ error: 'Nationality is required for companion' });
    }
    if (!cPassport || typeof cPassport !== 'string' || cPassport.trim().length === 0) {
      return res.status(400).json({ error: 'Passport number is required for companion' });
    }
    const cType = type === 'child' ? 'child' : 'adult';

    const { data: existingPass } = await supabase
      .from('passengers')
      .select('id')
      .ilike('nationality', cNationality.trim())
      .ilike('passport_number', cPassport.trim())
      .single();

    const { data: existingComp } = await supabase
      .from('companions')
      .select('id')
      .ilike('nationality', cNationality.trim())
      .ilike('passport_number', cPassport.trim())
      .single();

    if (existingPass || existingComp) {
      return res.status(409).json({ error: 'If already registered, please request to check' });
    }

    try {
      await supabase.from('companions').insert({
        passenger_id: passenger.id,
        type: cType,
        nationality: cNationality.trim(),
        passport_number: cPassport.trim()
      });

      // Update counts
      const { data: comps } = await supabase.from('companions').select('type').eq('passenger_id', passenger.id);
      const adults = (comps || []).filter((c: any) => c.type === 'adult').length;
      const children = (comps || []).filter((c: any) => c.type === 'child').length;

      await supabase.from('passengers').update({
        companion_adults: adults,
        companion_children: children
      }).eq('id', passenger.id);

      const { data: companions } = await supabase.from('companions').select('*').eq('passenger_id', passenger.id).order('id');
      res.json({ success: true, companions: companions || [] });
    } catch (error) {
      console.error('Failed to add companion:', error);
      res.status(500).json({ error: 'Failed to add companion' });
    }
  });

  app.delete('/api/passengers/:qr_token/companions/:companionId', async (req, res) => {
    const { data: passenger } = await supabase.from('passengers').select('*').eq('qr_token', req.params.qr_token).single();
    if (!passenger) {
      return res.status(404).json({ error: 'Passenger not found' });
    }
    const companionId = parseInt(req.params.companionId, 10);
    if (isNaN(companionId)) {
      return res.status(400).json({ error: 'Invalid companion ID' });
    }

    try {
      await supabase.from('companions').delete().eq('id', companionId).eq('passenger_id', passenger.id);

      // Update counts
      const { data: comps } = await supabase.from('companions').select('type').eq('passenger_id', passenger.id);
      const adults = (comps || []).filter((c: any) => c.type === 'adult').length;
      const children = (comps || []).filter((c: any) => c.type === 'child').length;

      await supabase.from('passengers').update({
        companion_adults: adults,
        companion_children: children
      }).eq('id', passenger.id);

      const { data: companions } = await supabase.from('companions').select('*').eq('passenger_id', passenger.id).order('id');
      res.json({ success: true, companions: companions || [] });
    } catch (error) {
      console.error('Failed to delete companion:', error);
      res.status(500).json({ error: 'Failed to delete companion' });
    }
  });

  app.post('/api/passengers/login', async (req, res) => {
    const { nationality, passport_number } = req.body;

    if (!nationality || !passport_number) {
      return res.status(400).json({ error: 'Nationality and passport number are required' });
    }

    const { data: passenger } = await supabase
      .from('passengers')
      .select('qr_token')
      .ilike('nationality', nationality.trim())
      .ilike('passport_number', passport_number.trim())
      .single();

    if (!passenger) {
      return res.status(401).json({ error: 'Invalid nationality or passport number' });
    }

    res.json({ success: true, qr_token: passenger.qr_token });
  });

  app.get('/api/passengers/:qr_token', async (req, res) => {
    const { data: passenger } = await supabase.from('passengers').select('*').eq('qr_token', req.params.qr_token).single();
    if (!passenger) {
      return res.status(404).json({ error: 'Passenger not found' });
    }

    const { data: location } = await supabase.from('locations').select('*').eq('id', passenger.location_id).single();

    const { data: messages } = await supabase.from('messages').select('*').eq('passenger_id', passenger.id).order('timestamp', { ascending: true });


    // Fetch broadcast messages relevant to this passenger
    const conditions = ['target_type.eq.all'];
    if (passenger.departure_airline) {
      const spAirline = passenger.departure_airline.replace(/"/g, '');
      conditions.push(`and(target_type.eq.airline,target_airline.ilike."${spAirline}")`);
    }
    if (passenger.final_destination) {
      const spDest = passenger.final_destination.replace(/"/g, '');
      conditions.push(`and(target_type.eq.destination,target_destination.ilike."${spDest}")`);
    }

    const { data: broadcastMessages } = await supabase
      .from('broadcast_messages')
      .select('*')
      .or(conditions.join(','))
      .order('sent_at', { ascending: false });

    // Fetch QR expiry setting
    const passengerStatus = passenger.status;
    let qr_expiry_minutes = 30;

    if (passengerStatus === 'checked-in') {
      const { data: extSetting } = await supabase.from('app_settings').select('value').eq('key', 'checkin_extension_minutes').single();
      qr_expiry_minutes = extSetting ? parseInt(extSetting.value, 10) : 60;
    } else {
      const { data: qrExpirySetting } = await supabase.from('app_settings').select('value').eq('key', 'qr_expiry_minutes').single();
      qr_expiry_minutes = qrExpirySetting ? parseInt(qrExpirySetting.value, 10) : 30;
    }

    // Fetch companions
    const { data: companions } = await supabase.from('companions').select('*').eq('passenger_id', passenger.id).order('id');

    // Fetch always-on broadcast message
    const { data: appSettings } = await supabase.from('app_settings').select('key, value').in('key', ['always_on_title', 'always_on_message', 'always_on_visible']);
    const settingsMap = (appSettings || []).reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    const alwaysOnBroadcast = {
      title: settingsMap['always_on_title'] || '',
      message: settingsMap['always_on_message'] || '',
      visible: settingsMap['always_on_visible'] === 'true',
    };

    res.json({ ...(passenger as Record<string, unknown>), location, messages: messages || [], broadcastMessages: broadcastMessages || [], qr_expiry_minutes, companions: companions || [], alwaysOnBroadcast });
  });

  app.post('/api/scan', async (req, res) => {
    const { qr_token, action, location_id } = req.body;
    const { data: passenger } = await supabase.from('passengers').select('*').eq('qr_token', qr_token).single();

    if (!passenger) {
      return res.status(404).json({ error: 'Invalid QR code' });
    }

    const timestamp = new Date().toISOString();

    try {
      if (action === 'check-in') {
        await Promise.all([
          supabase.from('transactions').insert({ passenger_id: passenger.id, type: 'check-in', location_id, timestamp }),
          supabase.from('passengers').update({ status: 'checked-in' }).eq('id', passenger.id)
        ]);

        let locName = null;
        if (location_id) {
          const { data: loc } = await supabase.from('locations').select('name').eq('id', location_id).single();
          locName = loc?.name;
        }

        await supabase.from('activity_log').insert({
          type: 'check-in',
          description: `${passenger.name} checked in${locName ? ` at ${locName}` : ''}`,
          passenger_id: passenger.id,
          passenger_name: passenger.name,
          metadata: JSON.stringify({ location_id }),
          timestamp
        });

        res.json({ success: true, message: 'Checked in successfully' });
      } else if (action === 'check-out') {
        await Promise.all([
          supabase.from('transactions').insert({ passenger_id: passenger.id, type: 'check-out', location_id, timestamp }),
          supabase.from('passengers').update({ status: 'checked-out' }).eq('id', passenger.id)
        ]);

        await supabase.from('activity_log').insert({
          type: 'check-out',
          description: `${passenger.name} checked out`,
          passenger_id: passenger.id,
          passenger_name: passenger.name,
          metadata: JSON.stringify({ location_id }),
          timestamp
        });

        res.json({ success: true, message: 'Checked out successfully' });
      } else {
        res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Transaction failed' });
    }
  });

  app.post('/api/messages', async (req, res) => {
    const { passenger_id, text, sender } = req.body;
    const timestamp = new Date().toISOString();

    try {
      await supabase.from('messages').insert({
        passenger_id,
        text,
        sender,
        timestamp,
        status: sender === 'passenger' ? 'open' : undefined
      });

      if (sender === 'passenger') {
        // If a passenger sends a message, ensure any previously 'resolved' 
        // messages are set back to 'open' to reopen the conversation
        await supabase
          .from('messages')
          .update({ status: 'open' })
          .eq('passenger_id', passenger_id)
          .eq('status', 'resolved');
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.get('/api/dashboard', async (req, res) => {
    const { count: totalPassengers } = await supabase.from('passengers').select('*', { count: 'exact', head: true });
    const { count: checkedIn } = await supabase.from('passengers').select('*', { count: 'exact', head: true }).eq('status', 'checked-in');

    // Calculate open requests by finding unique passengers with an 'open' status message
    const { data: openMessages } = await supabase.from('messages').select('passenger_id').eq('status', 'open');
    const messagesCount = new Set((openMessages || []).map(m => m.passenger_id)).size;

    const { data: locations } = await supabase.from('locations').select('*');
    const { data: checkedInPassengers } = await supabase.from('passengers').select('location_id').eq('status', 'checked-in');

    const locationsOccupancy = locations?.map((l: any) => ({
      name: l.name,
      capacity: l.capacity,
      occupancy: checkedInPassengers?.filter((p: any) => p.location_id === l.id).length || 0
    })) || [];

    res.json({
      totalPassengers: totalPassengers || 0,
      checkedIn: checkedIn || 0,
      messagesCount: messagesCount || 0,
      locationsOccupancy
    });
  });

  // ───── Dashboard Charts Data ─────
  app.get('/api/dashboard/charts', async (req, res) => {
    try {
      // 1. Daily new registrations
      const { data: passengers } = await supabase.from('passengers').select('qr_generated_at').not('qr_generated_at', 'is', null);
      const dailyRegistrationsMap: Record<string, number> = {};
      (passengers || []).forEach((p: any) => {
        if (!p.qr_generated_at) return;
        const date = p.qr_generated_at.split('T')[0];
        dailyRegistrationsMap[date] = (dailyRegistrationsMap[date] || 0) + 1;
      });

      // 2. Daily exits (check-outs)
      const { data: exits } = await supabase.from('activity_log').select('timestamp').eq('type', 'check-out');
      const dailyExitsMap: Record<string, number> = {};
      (exits || []).forEach((e: any) => {
        if (!e.timestamp) return;
        const date = e.timestamp.split('T')[0];
        dailyExitsMap[date] = (dailyExitsMap[date] || 0) + 1;
      });

      // 3. Merge registrations and exits into a single timeline
      const dateMap: Record<string, { date: string; registrations: number; exits: number }> = {};
      for (const [date, count] of Object.entries(dailyRegistrationsMap)) {
        if (!dateMap[date]) dateMap[date] = { date, registrations: 0, exits: 0 };
        dateMap[date].registrations = count;
      }
      for (const [date, count] of Object.entries(dailyExitsMap)) {
        if (!dateMap[date]) dateMap[date] = { date, registrations: 0, exits: 0 };
        dateMap[date].exits = count;
      }

      const registrationExitTimeline = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

      // 4. Average stay duration
      const { data: transactions } = await supabase.from('transactions').select('passenger_id, type, timestamp').in('type', ['check-in', 'check-out']).order('timestamp', { ascending: true });
      const ciMap: Record<number, string> = {};
      const avgDurationMap: Record<string, number[]> = {};
      const allDurations: number[] = [];

      (transactions || []).forEach((tx: any) => {
        if (tx.type === 'check-in' && !ciMap[tx.passenger_id]) {
          ciMap[tx.passenger_id] = tx.timestamp;
        } else if (tx.type === 'check-out' && ciMap[tx.passenger_id]) {
          const ciTime = new Date(ciMap[tx.passenger_id]).getTime();
          const coTime = new Date(tx.timestamp).getTime();
          const hours = (coTime - ciTime) / (1000 * 60 * 60);

          const date = tx.timestamp.split('T')[0];
          if (!avgDurationMap[date]) avgDurationMap[date] = [];
          avgDurationMap[date].push(hours);
          allDurations.push(hours);
        }
      });

      const avgStayDuration = Object.entries(avgDurationMap).map(([date, hoursList]) => ({
        date,
        avgHours: parseFloat((hoursList.reduce((a, b) => a + b, 0) / hoursList.length).toFixed(1))
      })).sort((a, b) => a.date.localeCompare(b.date));

      const overallAvgStayHours = allDurations.length > 0
        ? parseFloat((allDurations.reduce((a, b) => a + b, 0) / allDurations.length).toFixed(1))
        : 0;

      res.json({
        registrationExitTimeline,
        avgStayDuration,
        overallAvgStayHours,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard chart data:', error);
      res.status(500).json({ error: 'Failed to fetch chart data' });
    }
  });

  // ───── Daily Check-in / Check-out & QR Renewal Stats ─────
  app.get('/api/dashboard/daily-stats', async (req, res) => {
    const dateParam = req.query.date as string;
    if (!dateParam || typeof dateParam !== 'string') {
      return res.status(400).json({ error: 'date query parameter is required (YYYY-MM-DD)' });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    try {
      const { data: activityLog } = await supabase.from('activity_log').select('type, timestamp').like('timestamp', `${dateParam}%`);
      const activities = activityLog || [];

      const hourlyTimeline: Array<{ hour: string; label: string; checkIns: number; checkOuts: number }> = [];
      const qrRenewalTimeline: Array<{ hour: string; label: string; renewals: number }> = [];

      let totalCheckIns = 0;
      let totalCheckOuts = 0;
      let totalQrRenewals = 0;
      let totalQrExpired = 0;

      const hourlyData: Record<string, { ci: number; co: number; ren: number }> = {};
      for (let h = 0; h < 24; h++) {
        hourlyData[h.toString().padStart(2, '0')] = { ci: 0, co: 0, ren: 0 };
      }

      activities.forEach((a: any) => {
        const hourStr = a.timestamp.split('T')[1].substring(0, 2);
        if (!hourlyData[hourStr]) return;
        if (a.type === 'check-in') {
          hourlyData[hourStr].ci++;
          totalCheckIns++;
        } else if (a.type === 'check-out') {
          hourlyData[hourStr].co++;
          totalCheckOuts++;
        } else if (a.type === 'qr-renewed') {
          hourlyData[hourStr].ren++;
          totalQrRenewals++;
        } else if (a.type === 'qr-expired') {
          totalQrExpired++;
        }
      });

      for (let h = 0; h < 24; h++) {
        const hourStr = h.toString().padStart(2, '0');
        const ampm = h === 0 ? '12AM' : h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h - 12}PM`;

        hourlyTimeline.push({
          hour: hourStr,
          label: ampm,
          checkIns: hourlyData[hourStr].ci,
          checkOuts: hourlyData[hourStr].co,
        });

        qrRenewalTimeline.push({
          hour: hourStr,
          label: ampm,
          renewals: hourlyData[hourStr].ren,
        });
      }

      const { count: totalRegistrations } = await supabase.from('passengers').select('*', { count: 'exact', head: true }).like('qr_generated_at', `${dateParam}%`);

      res.json({
        date: dateParam,
        hourlyTimeline,
        qrRenewalTimeline,
        summary: {
          totalCheckIns,
          totalCheckOuts,
          totalQrRenewals,
          totalQrExpired,
          totalRegistrations: totalRegistrations || 0,
          netFlow: totalCheckIns - totalCheckOuts,
        },
      });
    } catch (error) {
      console.error('Failed to fetch daily stats:', error);
      res.status(500).json({ error: 'Failed to fetch daily stats' });
    }
  });


  // ───── Activity Feed ─────
  app.get('/api/activity-feed', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);
      const { data: activities } = await supabase.from('activity_log').select('*').order('timestamp', { ascending: false }).limit(limit);
      res.json(activities || []);
    } catch (error) {
      console.error('Failed to fetch activity feed:', error);
      res.status(500).json({ error: 'Failed to fetch activity feed' });
    }
  });


  // ───── Broadcast Messages ─────
  app.get('/api/broadcasts', async (req, res) => {
    const { data: broadcasts } = await supabase.from('broadcast_messages').select('*').order('sent_at', { ascending: false });
    res.json(broadcasts || []);
  });

  app.post('/api/broadcasts', async (req, res) => {
    const { title, message, target_type, target_airline, target_destination } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required and must be a non-empty string' });
    }
    if (!target_type || !['all', 'airline', 'destination'].includes(target_type)) {
      return res.status(400).json({ error: 'Target type must be one of: all, airline, destination' });
    }
    if (target_type === 'airline' && (!target_airline || target_airline.trim().length === 0)) {
      return res.status(400).json({ error: 'Target airline is required when targeting by airline' });
    }
    if (target_type === 'destination' && (!target_destination || target_destination.trim().length === 0)) {
      return res.status(400).json({ error: 'Target destination is required when targeting by destination' });
    }

    const sent_at = new Date().toISOString();

    try {
      // Count targeted passengers
      let passengerCount = 0;
      if (target_type === 'all') {
        const { count } = await supabase.from('passengers').select('*', { count: 'exact', head: true });
        passengerCount = count || 0;
      } else if (target_type === 'airline') {
        const { count } = await supabase.from('passengers').select('*', { count: 'exact', head: true }).ilike('departure_airline', target_airline!.trim());
        passengerCount = count || 0;
      } else if (target_type === 'destination') {
        const { count } = await supabase.from('passengers').select('*', { count: 'exact', head: true }).ilike('final_destination', target_destination!.trim());
        passengerCount = count || 0;
      }

      const { data: newBroadcast, error } = await supabase.from('broadcast_messages').insert({
        title: title.trim(),
        message: message.trim(),
        target_type,
        target_airline: target_type === 'airline' ? target_airline!.trim() : null,
        target_destination: target_type === 'destination' ? target_destination!.trim() : null,
        sent_at
      }).select().single();

      if (error) throw error;
      res.status(201).json({ ...newBroadcast, recipients: passengerCount });
    } catch (error) {
      console.error('Failed to send broadcast:', error);
      res.status(500).json({ error: 'Failed to send broadcast' });
    }
  });

  app.delete('/api/broadcasts/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid broadcast ID' });
    }

    const { data: existing } = await supabase.from('broadcast_messages').select('*').eq('id', id).single();
    if (!existing) {
      return res.status(404).json({ error: 'Broadcast not found' });
    }

    try {
      await supabase.from('broadcast_messages').delete().eq('id', id);
      res.json({ success: true, message: 'Broadcast deleted successfully' });
    } catch (error) {
      console.error('Failed to delete broadcast:', error);
      res.status(500).json({ error: 'Failed to delete broadcast' });
    }
  });

  // ───── Dropdown Options Cache ─────
  let dropdownCache: { data: Record<string, string[]>, timestamp: number } | null = null;
  const DROPDOWN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // ───── Dropdown Options (Public — active only) ─────
  app.get('/api/dropdown-options', async (req, res) => {
    // Add cache headers for browser
    res.setHeader('Cache-Control', 'public, max-age=300');

    // Return from in-memory cache if valid
    if (dropdownCache && Date.now() - dropdownCache.timestamp < DROPDOWN_CACHE_TTL) {
      return res.json(dropdownCache.data);
    }

    try {
      const { data: options } = await supabase
        .from('dropdown_options')
        .select('*')
        .eq('active', 1)
        .order('category')
        .order('sort_order')
        .order('label');

      const grouped: Record<string, string[]> = {};
      for (const opt of options || []) {
        if (!grouped[opt.category]) grouped[opt.category] = [];
        grouped[opt.category].push(opt.label);
      }

      // Update cache
      dropdownCache = {
        data: grouped,
        timestamp: Date.now()
      };

      res.json(grouped);
    } catch (error) {
      console.error('Failed to fetch dropdown options:', error);
      res.status(500).json({ error: 'Failed to fetch dropdown options' });
    }
  });

  // ───── Dropdown Options Admin CRUD ─────
  app.get('/api/admin/dropdown-options', async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      let query = supabase.from('dropdown_options').select('*').order('sort_order').order('label');

      if (category && typeof category === 'string') {
        query = query.eq('category', category);
      } else {
        query = query.order('category', { ascending: true });
      }

      const { data: options } = await query;
      res.json(options || []);
    } catch (error) {
      console.error('Failed to fetch admin dropdown options:', error);
      res.status(500).json({ error: 'Failed to fetch dropdown options' });
    }
  });

  app.post('/api/admin/dropdown-options', async (req, res) => {
    const { category, label } = req.body;

    if (!category || typeof category !== 'string' || !['nationality', 'airline', 'destination'].includes(category)) {
      return res.status(400).json({ error: 'Category must be one of: nationality, airline, destination' });
    }
    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      return res.status(400).json({ error: 'Label is required and must be a non-empty string' });
    }

    try {
      // Get max sort_order for this category
      const { data: maxOrderData } = await supabase
        .from('dropdown_options')
        .select('sort_order')
        .eq('category', category)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      const sortOrder = (maxOrderData?.sort_order ?? -1) + 1;

      const { data: newOption, error } = await supabase
        .from('dropdown_options')
        .insert({ category, label: label.trim(), sort_order: sortOrder })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // UNIQUE constraint violation
          return res.status(409).json({ error: `"${label.trim()}" already exists in ${category}` });
        }
        throw error;
      }

      // Invalidate cache
      dropdownCache = null;

      res.status(201).json(newOption);
    } catch (error) {
      console.error('Failed to create dropdown option:', error);
      res.status(500).json({ error: 'Failed to create dropdown option' });
    }
  });

  app.put('/api/admin/dropdown-options/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid option ID' });
    }

    const { data: existing } = await supabase.from('dropdown_options').select('*').eq('id', id).single();
    if (!existing) {
      return res.status(404).json({ error: 'Dropdown option not found' });
    }

    const { label, active } = req.body;

    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      return res.status(400).json({ error: 'Label is required and must be a non-empty string' });
    }

    try {
      const { data: updated, error } = await supabase
        .from('dropdown_options')
        .update({
          label: label.trim(),
          active: active !== undefined ? (active ? 1 : 0) : 1
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({ error: `"${label.trim()}" already exists in this category` });
        }
        throw error;
      }

      // Invalidate cache
      dropdownCache = null;

      res.json(updated);
    } catch (error) {
      console.error('Failed to update dropdown option:', error);
      res.status(500).json({ error: 'Failed to update dropdown option' });
    }
  });

  app.delete('/api/admin/dropdown-options/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid option ID' });
    }

    const { data: existing } = await supabase.from('dropdown_options').select('*').eq('id', id).single();
    if (!existing) {
      return res.status(404).json({ error: 'Dropdown option not found' });
    }

    try {
      await supabase.from('dropdown_options').delete().eq('id', id);

      // Invalidate cache
      dropdownCache = null;

      res.json({ success: true, message: 'Dropdown option deleted successfully' });
    } catch (error) {
      console.error('Failed to delete dropdown option:', error);
      res.status(500).json({ error: 'Failed to delete dropdown option' });
    }
  });

  // Get distinct airlines and destinations for filter dropdowns
  app.get('/api/passengers/filters/options', async (req, res) => {
    try {
      const { data: passengers } = await supabase
        .from('passengers')
        .select('departure_airline, final_destination');

      const airlinesSet = new Set<string>();
      const destinationsSet = new Set<string>();

      passengers?.forEach((p: any) => {
        if (p.departure_airline) airlinesSet.add(p.departure_airline);
        if (p.final_destination) destinationsSet.add(p.final_destination);
      });

      res.json({
        airlines: Array.from(airlinesSet).sort(),
        destinations: Array.from(destinationsSet).sort(),
      });
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
      res.status(500).json({ error: 'Failed to fetch filter options' });
    }
  });

  // ───── Renew QR Code ─────
  app.post('/api/passengers/:qr_token/renew-qr', async (req, res) => {
    const { data: passenger } = await supabase.from('passengers').select('*').eq('qr_token', req.params.qr_token).single();
    if (!passenger) {
      return res.status(404).json({ error: 'Passenger not found' });
    }

    const newGeneratedAt = new Date().toISOString();
    const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    try {
      await supabase.from('passengers').update({ qr_token: newToken, qr_generated_at: newGeneratedAt }).eq('id', passenger.id);

      // Log QR renewal activity
      await supabase.from('activity_log').insert({
        type: 'qr-renewed',
        description: `${passenger.name} renewed their QR code`,
        passenger_id: passenger.id,
        passenger_name: passenger.name,
        timestamp: newGeneratedAt
      });

      res.json({ success: true, qr_token: newToken, qr_generated_at: newGeneratedAt });
    } catch (error) {
      console.error('Failed to renew QR code:', error);
      res.status(500).json({ error: 'Failed to renew QR code' });
    }
  });

  // ───── Admin Chat / Support Management ─────
  // List all conversations (grouped by passenger) with filters
  app.get('/api/admin/conversations', async (req, res) => {
    try {
      const { status, airline, country, date_from, date_to, search } = req.query;

      const { data: messages } = await supabase.from('messages').select('*').order('timestamp', { ascending: false });
      const { data: passengers } = await supabase.from('passengers').select('*');

      if (!messages || !passengers) {
        return res.json([]);
      }

      // Group messages by passenger_id
      const passengerMessages: Record<number, any[]> = {};
      for (const msg of messages) {
        if (!passengerMessages[msg.passenger_id]) passengerMessages[msg.passenger_id] = [];
        passengerMessages[msg.passenger_id].push(msg);
      }

      let conversations = passengers
        .filter(p => passengerMessages[p.id] && passengerMessages[p.id].length > 0)
        .map(p => {
          const pMsgs = passengerMessages[p.id];
          const lastMsg = pMsgs[0]; // descending order means first is the latest

          return {
            passenger_id: p.id,
            name: p.name,
            flight_number: p.flight_number,
            country: p.country,
            nationality: p.nationality,
            departure_airline: p.departure_airline,
            final_destination: p.final_destination,
            departure_date: p.departure_date,
            qr_token: p.qr_token,
            total_messages: pMsgs.length,
            passenger_messages: pMsgs.filter(m => m.sender === 'passenger').length,
            admin_messages: pMsgs.filter(m => m.sender === 'admin').length,
            last_message: lastMsg.text,
            last_sender: lastMsg.sender,
            last_message_time: lastMsg.timestamp,
            conversation_status: lastMsg.status,
          };
        });

      // Filter by conversation status
      if (status && typeof status === 'string' && status !== 'all') {
        conversations = conversations.filter(c => c.conversation_status === status);
      }

      // Filter by airline
      if (airline && typeof airline === 'string' && airline.trim().length > 0) {
        const sAirline = airline.trim().toLowerCase();
        conversations = conversations.filter(c => (c.departure_airline || '').toLowerCase() === sAirline);
      }

      // Filter by country/nationality
      if (country && typeof country === 'string' && country.trim().length > 0) {
        const sCountry = country.trim().toLowerCase();
        conversations = conversations.filter(c =>
          (c.country || '').toLowerCase() === sCountry ||
          (c.nationality || '').toLowerCase() === sCountry
        );
      }

      // Filter by date range
      if (date_from && typeof date_from === 'string') {
        const fromTime = new Date(date_from).getTime();
        conversations = conversations.filter(c => new Date(c.last_message_time).getTime() >= fromTime);
      }
      if (date_to && typeof date_to === 'string') {
        const toTime = new Date(date_to + 'T23:59:59.999Z').getTime();
        conversations = conversations.filter(c => new Date(c.last_message_time).getTime() <= toTime);
      }

      // Search by name, flight number, passport
      if (search && typeof search === 'string' && search.trim().length > 0) {
        const term = search.trim().toLowerCase();
        conversations = conversations.filter(c => {
          const p = passengers.find(px => px.id === c.passenger_id);
          return (c.name || '').toLowerCase().includes(term) ||
            (c.flight_number || '').toLowerCase().includes(term) ||
            (p?.passport_number || '').toLowerCase().includes(term);
        });
      }

      conversations.sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());

      res.json(conversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  // Get conversation detail for a specific passenger
  app.get('/api/admin/conversations/:passenger_id', async (req, res) => {
    const passenger_id = parseInt(req.params.passenger_id, 10);
    if (isNaN(passenger_id)) {
      return res.status(400).json({ error: 'Invalid passenger ID' });
    }

    try {
      const { data: passenger } = await supabase.from('passengers').select('*').eq('id', passenger_id).single();
      if (!passenger) {
        return res.status(404).json({ error: 'Passenger not found' });
      }

      const { data: messages } = await supabase.from('messages').select('*').eq('passenger_id', passenger_id).order('timestamp', { ascending: true });

      res.json({ passenger, messages: messages || [] });
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  });

  // Admin reply to a passenger's conversation
  app.post('/api/admin/conversations/:passenger_id/reply', async (req, res) => {
    const passenger_id = parseInt(req.params.passenger_id, 10);
    if (isNaN(passenger_id)) {
      return res.status(400).json({ error: 'Invalid passenger ID' });
    }

    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Message text is required and must be a non-empty string' });
    }

    try {
      const { data: passenger } = await supabase.from('passengers').select('id').eq('id', passenger_id).single();
      if (!passenger) {
        return res.status(404).json({ error: 'Passenger not found' });
      }

      const timestamp = new Date().toISOString();

      await supabase.from('messages').insert({
        passenger_id,
        text: text.trim(),
        sender: 'admin',
        timestamp,
        status: 'replied'
      });

      // Update status of the latest passenger message to 'replied'
      await supabase.from('messages')
        .update({ status: 'replied' })
        .eq('passenger_id', passenger_id)
        .eq('sender', 'passenger')
        .eq('status', 'open');

      const { data: messages } = await supabase.from('messages').select('*').eq('passenger_id', passenger_id).order('timestamp', { ascending: true });

      res.json({ success: true, messages: messages || [] });
    } catch (error) {
      console.error('Failed to send admin reply:', error);
      res.status(500).json({ error: 'Failed to send reply' });
    }
  });

  // Update conversation status
  app.put('/api/admin/conversations/:passenger_id/status', async (req, res) => {
    const passenger_id = parseInt(req.params.passenger_id, 10);
    if (isNaN(passenger_id)) {
      return res.status(400).json({ error: 'Invalid passenger ID' });
    }

    const { status } = req.body;
    if (!status || !['open', 'replied', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Status must be one of: open, replied, resolved' });
    }

    try {
      await supabase.from('messages').update({ status }).eq('passenger_id', passenger_id);
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to update conversation status:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  });

  // ───── Chat Default Responses CRUD ─────
  app.get('/api/admin/chat-responses', async (req, res) => {
    try {
      const { data: responses, error } = await supabase
        .from('chat_default_responses')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('title', { ascending: true });

      if (error) throw error;
      res.json(responses || []);
    } catch (error) {
      console.error('Failed to fetch chat responses:', error);
      res.status(500).json({ error: 'Failed to fetch chat responses' });
    }
  });

  app.post('/api/admin/chat-responses', async (req, res) => {
    const { title, message, category } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required and must be a non-empty string' });
    }
    if (category && typeof category !== 'string') {
      return res.status(400).json({ error: 'Category must be a string' });
    }

    try {
      const { data: maxOrderData } = await supabase
        .from('chat_default_responses')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      const sortOrder = (maxOrderData?.sort_order ?? -1) + 1;

      const { data: newResponse, error } = await supabase
        .from('chat_default_responses')
        .insert({
          title: title.trim(),
          message: message.trim(),
          category: (category || 'general').trim(),
          sort_order: sortOrder
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(newResponse);
    } catch (error) {
      console.error('Failed to create chat response:', error);
      res.status(500).json({ error: 'Failed to create chat response' });
    }
  });

  app.put('/api/admin/chat-responses/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid response ID' });
    }

    const { title, message, category, active } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required and must be a non-empty string' });
    }

    try {
      const { data: existing } = await supabase.from('chat_default_responses').select('id').eq('id', id).single();
      if (!existing) {
        return res.status(404).json({ error: 'Chat response not found' });
      }

      const { data: updated, error } = await supabase
        .from('chat_default_responses')
        .update({
          title: title.trim(),
          message: message.trim(),
          category: (category || 'general').trim(),
          active: active !== undefined ? !!active : true
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json(updated);
    } catch (error) {
      console.error('Failed to update chat response:', error);
      res.status(500).json({ error: 'Failed to update chat response' });
    }
  });

  app.delete('/api/admin/chat-responses/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid response ID' });
    }

    try {
      const { error } = await supabase.from('chat_default_responses').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true, message: 'Chat response deleted successfully' });
    } catch (error) {
      console.error('Failed to delete chat response:', error);
      res.status(500).json({ error: 'Failed to delete chat response' });
    }
  });


  // ───── Admin Passengers List & Statistics ─────
  app.get('/api/admin/passengers', async (req, res) => {
    try {
      const {
        search, status, airline, nationality, destination, tags,
        date_from, date_to, sort_by, sort_order,
        page, per_page,
      } = req.query;

      let query = supabase.from('passengers').select('*, events(name), locations(name)', { count: 'exact' });

      // Apply filters
      if (search && typeof search === 'string' && search.trim()) {
        const s = `%${search.trim()}%`;
        query = query.or(`name.ilike.${s},passport_number.ilike.${s},flight_number.ilike.${s},country.ilike.${s},tags.ilike.${s}`);
      }

      // Filter by exclude_from_reports
      const exclude_filter = req.query.exclude_filter as string;
      const hide_excluded = req.query.hide_excluded === 'true';

      if (exclude_filter === 'excluded') {
        query = query.eq('exclude_from_reports', true);
      } else if (exclude_filter === 'hidden' || hide_excluded) {
        query = query.eq('exclude_from_reports', false);
      }
      // If exclude_filter is 'all', do not add any condition and show both.

      if (status && typeof status === 'string' && status !== 'all') {
        query = query.eq('status', status);
      }
      if (airline && typeof airline === 'string' && airline !== 'all') {
        query = query.eq('departure_airline', airline);
      }
      if (nationality && typeof nationality === 'string' && nationality !== 'all') {
        query = query.eq('nationality', nationality);
      }
      if (destination && typeof destination === 'string' && destination !== 'all') {
        query = query.eq('final_destination', destination);
      }
      if (tags && typeof tags === 'string' && tags.trim() !== '') {
        const tagList = tags.split(',').map(t => t.trim());
        const tagConditions = tagList.map(t => `tags.ilike.%${t}%`).join(',');
        query = query.or(tagConditions);
      }
      if (date_from && typeof date_from === 'string') {
        query = query.gte('qr_generated_at', date_from);
      }
      if (date_to && typeof date_to === 'string') {
        query = query.lte('qr_generated_at', date_to + 'T23:59:59.999Z');
      }

      // Sorting
      const allowedSorts = ['name', 'status', 'nationality', 'departure_airline', 'departure_date', 'final_destination', 'id'];
      const sortField = allowedSorts.includes(sort_by as string) ? sort_by as string : 'id';
      const sortDir = sort_order === 'asc';

      query = query.order(sortField, { ascending: sortDir });

      // Pagination
      const currentPage = Math.max(1, parseInt(page as string, 10) || 1);
      const itemsPerPage = Math.min(100000, Math.max(1, parseInt(per_page as string, 10) || 25));
      const offset = (currentPage - 1) * itemsPerPage;

      query = query.range(offset, offset + itemsPerPage - 1);

      const { data, count, error } = await query;
      if (error) throw error;

      // Add message count
      const passengerIds = (data || []).map(p => p.id);

      let messageCounts: Record<number, number> = {};
      if (passengerIds.length > 0) {
        const { data: msgs } = await supabase.from('messages').select('passenger_id').in('passenger_id', passengerIds);
        if (msgs) {
          msgs.forEach(m => {
            messageCounts[m.passenger_id] = (messageCounts[m.passenger_id] || 0) + 1;
          });
        }
      }

      const passengers = (data || []).map((p: any) => {
        const pObj = { ...p, event_name: p.events?.name, location_name: p.locations?.name, message_count: messageCounts[p.id] || 0 };
        delete pObj.events;
        delete pObj.locations;
        return pObj;
      });

      res.json({
        passengers,
        pagination: {
          total: count || 0,
          page: currentPage,
          per_page: itemsPerPage,
          total_pages: Math.ceil((count || 0) / itemsPerPage),
        },
      });
    } catch (error) {
      console.error('Failed to fetch admin passengers:', error);
      res.status(500).json({ error: 'Failed to fetch passengers' });
    }
  });

  // ───── Update Passenger Location ─────
  app.patch('/api/admin/passengers/:id/location', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid passenger ID' });
    }

    try {
      const { data: passenger } = await supabase.from('passengers').select('*').eq('id', id).single();
      if (!passenger) {
        return res.status(404).json({ error: 'Passenger not found' });
      }

      const { location_id } = req.body;
      const newLocationId = location_id ? parseInt(String(location_id), 10) : null;
      let locationName = 'Unassigned';

      if (newLocationId !== null) {
        if (isNaN(newLocationId)) {
          return res.status(400).json({ error: 'Invalid location ID' });
        }
        const { data: location } = await supabase.from('locations').select('name').eq('id', newLocationId).single();
        if (!location) {
          return res.status(404).json({ error: 'Location not found' });
        }
        locationName = location.name;
      }

      await supabase.from('passengers').update({ location_id: newLocationId }).eq('id', id);

      await supabase.from('activity_log').insert({
        type: 'location-update',
        description: `${passenger.name} location updated to ${locationName}`,
        passenger_id: passenger.id,
        passenger_name: passenger.name,
        metadata: { location_id: newLocationId },
        timestamp: new Date().toISOString()
      });

      res.json({ success: true, location_id: newLocationId, location_name: locationName });
    } catch (error) {
      console.error('Failed to update passenger location:', error);
      res.status(500).json({ error: 'Failed to update passenger location' });
    }
  });

  // ───── Exclude Passenger from Reports ─────
  app.patch('/api/admin/passengers/:id/exclude', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid passenger ID' });
    }

    try {
      const { data: passenger } = await supabase.from('passengers').select('*').eq('id', id).single();
      if (!passenger) {
        return res.status(404).json({ error: 'Passenger not found' });
      }

      const { exclude_from_reports } = req.body;
      const newValue = !!exclude_from_reports;

      await supabase.from('passengers').update({ exclude_from_reports: newValue }).eq('id', id);

      res.json({ success: true, exclude_from_reports: newValue });
    } catch (error) {
      console.error('Failed to update passenger exclude status:', error);
      res.status(500).json({ error: 'Failed to update passenger exclude status' });
    }
  });

  // ───── Update Passenger Tags ─────
  app.patch('/api/admin/passengers/:id/tags', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid passenger ID' });
    }

    try {
      const { data: passenger } = await supabase.from('passengers').select('*').eq('id', id).single();
      if (!passenger) {
        return res.status(404).json({ error: 'Passenger not found' });
      }

      const { tags } = req.body;
      const newTags = typeof tags === 'string' ? tags : '';

      await supabase.from('passengers').update({ tags: newTags }).eq('id', id);

      res.json({ success: true, tags: newTags });
    } catch (error) {
      console.error('Failed to update passenger tags:', error);
      res.status(500).json({ error: 'Failed to update passenger tags' });
    }
  });

  // ───── Update Passenger Details ─────
  app.patch('/api/admin/passengers/:id/details', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid passenger ID' });
    }

    try {
      const { data: passenger } = await supabase.from('passengers').select('*').eq('id', id).single();
      if (!passenger) {
        return res.status(404).json({ error: 'Passenger not found' });
      }

      const {
        name,
        country,
        passport_number,
        nationality,
        departure_airline,
        departure_date,
        final_destination,
        flight_number
      } = req.body;

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (country !== undefined) updates.country = country;
      if (passport_number !== undefined) updates.passport_number = passport_number;
      if (nationality !== undefined) updates.nationality = nationality;
      if (departure_airline !== undefined) updates.departure_airline = departure_airline;
      if (departure_date !== undefined) updates.departure_date = departure_date;
      if (final_destination !== undefined) updates.final_destination = final_destination;
      if (flight_number !== undefined) updates.flight_number = flight_number;

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('passengers').update(updates).eq('id', id);
        if (error) throw error;

        await supabase.from('activity_log').insert({
          type: 'details-update',
          description: `${passenger.name} details updated by admin`,
          passenger_id: passenger.id,
          passenger_name: passenger.name,
          metadata: { updates },
          timestamp: new Date().toISOString()
        });
      }

      res.json({ success: true, updates });
    } catch (error) {
      console.error('Failed to update passenger details:', error);
      res.status(500).json({ error: 'Failed to update passenger details' });
    }
  });

  app.get('/api/admin/passengers/stats', async (req, res) => {
    try {
      const { date_from, date_to } = req.query;

      let query = supabase.from('passengers').select('status, departure_airline, nationality, final_destination, qr_generated_at');

      query = query.eq('exclude_from_reports', false);

      if (date_from && typeof date_from === 'string') {
        query = query.gte('qr_generated_at', date_from);
      }
      if (date_to && typeof date_to === 'string') {
        query = query.lte('qr_generated_at', date_to + 'T23:59:59.999Z');
      }

      const { data: passengers, error } = await query;
      if (error) throw error;

      let total = 0;
      let registered = 0;
      let checkedIn = 0;
      let checkedOut = 0;

      const airlineCounts: Record<string, number> = {};
      const nationalityCounts: Record<string, number> = {};
      const destinationCounts: Record<string, number> = {};
      const timelineCounts: Record<string, number> = {};

      for (const p of passengers || []) {
        total++;
        if (p.status === 'registered') registered++;
        if (p.status === 'checked-in') checkedIn++;
        if (p.status === 'checked-out') checkedOut++;

        if (p.departure_airline) airlineCounts[p.departure_airline] = (airlineCounts[p.departure_airline] || 0) + 1;
        if (p.nationality) nationalityCounts[p.nationality] = (nationalityCounts[p.nationality] || 0) + 1;
        if (p.final_destination) destinationCounts[p.final_destination] = (destinationCounts[p.final_destination] || 0) + 1;

        if (p.qr_generated_at) {
          const dateStr = p.qr_generated_at.split('T')[0];
          timelineCounts[dateStr] = (timelineCounts[dateStr] || 0) + 1;
        }
      }

      const getTop10 = (counts: Record<string, number>) =>
        Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10);

      const byAirline = getTop10(airlineCounts);
      const byNationality = getTop10(nationalityCounts);
      const byDestination = getTop10(destinationCounts);

      const byStatus = [
        { label: 'Registered', value: registered, color: '#6366f1' },
        { label: 'Checked In', value: checkedIn, color: '#10b981' },
        { label: 'Checked Out', value: checkedOut, color: '#f59e0b' },
      ];

      const registrationTimeline = Object.entries(timelineCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30);

      const { count: totalMessages } = await supabase.from('messages').select('*', { count: 'exact', head: true });

      const { data: allPassengers } = await supabase.from('passengers').select('departure_airline, nationality, final_destination, tags').eq('exclude_from_reports', false);
      const allAirlines = new Set(allPassengers?.map(p => p.departure_airline).filter(Boolean));
      const allNationalities = new Set(allPassengers?.map(p => p.nationality).filter(Boolean));
      const allDestinations = new Set(allPassengers?.map(p => p.final_destination).filter(Boolean));

      const allTags = new Set<string>();
      allPassengers?.forEach(p => {
        if (p.tags) {
          p.tags.split(',').forEach((tag: string) => {
            const trimmed = tag.trim();
            if (trimmed) allTags.add(trimmed);
          });
        }
      });

      res.json({
        total, registered, checkedIn, checkedOut,
        totalMessages: totalMessages || 0,
        byAirline, byNationality, byDestination, byStatus,
        registrationTimeline: registrationTimeline.reverse(),
        filterOptions: {
          airlines: Array.from(allAirlines).sort(),
          nationalities: Array.from(allNationalities).sort(),
          destinations: Array.from(allDestinations).sort(),
          tags: Array.from(allTags).sort()
        }
      });
    } catch (error) {
      console.error('Failed to fetch passenger stats:', error);
      res.status(500).json({ error: 'Failed to fetch passenger stats' });
    }
  });

  app.get('/api/stakeholder/stats', async (req, res) => {
    try {
      const { data: passengers, error } = await supabase.from('passengers').select('id, status, nationality, departure_airline, final_destination, country, location_id, qr_generated_at, departure_date').eq('exclude_from_reports', false);
      if (error) throw error;
      const pxList = passengers || [];

      let totalPassengers = 0;
      let checkedIn = 0;

      const nationalityCounts: Record<string, number> = {};
      const airlineCounts: Record<string, number> = {};
      const destinationCounts: Record<string, number> = {};
      const countryCounts: Record<string, number> = {};
      const locOccupancyMap: Record<number, number> = {};
      const regTimelineMap: Record<string, number> = {};
      const departureMap: Record<string, number> = {};

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      for (const p of pxList) {
        totalPassengers++;
        if (p.status === 'checked-in') {
          checkedIn++;
          if (p.location_id) {
            locOccupancyMap[p.location_id] = (locOccupancyMap[p.location_id] || 0) + 1;
          }
        }

        if (p.nationality) nationalityCounts[p.nationality] = (nationalityCounts[p.nationality] || 0) + 1;
        if (p.departure_airline) airlineCounts[p.departure_airline] = (airlineCounts[p.departure_airline] || 0) + 1;
        if (p.final_destination) destinationCounts[p.final_destination] = (destinationCounts[p.final_destination] || 0) + 1;
        if (p.country) countryCounts[p.country] = (countryCounts[p.country] || 0) + 1;

        if (p.qr_generated_at) {
          const dStr = p.qr_generated_at.split('T')[0];
          regTimelineMap[dStr] = (regTimelineMap[dStr] || 0) + 1;
        }

        if (p.departure_date && p.departure_date >= todayStr) {
          departureMap[p.departure_date] = (departureMap[p.departure_date] || 0) + 1;
        }
      }

      const getTop10 = (counts: Record<string, number>) =>
        Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

      const nationalities = getTop10(nationalityCounts);
      const airlines = getTop10(airlineCounts);
      const destinations = getTop10(destinationCounts);
      const countries = getTop10(countryCounts);

      const { data: locations } = await supabase.from('locations').select('id, name, capacity');
      const locationsOccupancy = (locations || []).map(l => ({
        name: l.name,
        capacity: l.capacity,
        occupancy: locOccupancyMap[l.id] || 0
      }));

      const { data: trans } = await supabase.from('transactions').select('passenger_id, type, timestamp').gte('timestamp', new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString());

      const timeline = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const seenIn = new Set<number>(); const seenOut = new Set<number>();
        (trans || []).forEach(t => {
          if (t.timestamp.split('T')[0] <= dateStr) {
            if (t.type === 'check-in') seenIn.add(t.passenger_id);
            if (t.type === 'check-out') seenOut.add(t.passenger_id);
          }
        });

        timeline.push({
          date: dateStr,
          registrations: regTimelineMap[dateStr] || 0,
          occupancy: Math.max(0, seenIn.size - seenOut.size)
        });
      }

      const departures = Object.entries(departureMap).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 14);

      res.json({
        summary: { totalPassengers, checkedIn },
        nationalities, airlines, destinations, countries,
        timeline, departures
      });
    } catch (error) {
      console.error('Failed to fetch stakeholder stats:', error);
      res.status(500).json({ error: 'Failed to fetch stakeholder stats' });
    }
  });

  // ───── Export Summary Report ─────
  app.get('/api/admin/export-summary', async (req, res) => {
    try {
      const { data: event } = await supabase.from('events').select('*').eq('status', 'active').limit(1).maybeSingle();

      const { count: totalPassengers } = await supabase.from('passengers').select('*', { count: 'exact', head: true });
      const { count: registered } = await supabase.from('passengers').select('*', { count: 'exact', head: true }).eq('status', 'registered');
      const { count: checkedIn } = await supabase.from('passengers').select('*', { count: 'exact', head: true }).eq('status', 'checked-in');
      const { count: checkedOut } = await supabase.from('passengers').select('*', { count: 'exact', head: true }).eq('status', 'checked-out');

      const { data: allPassengersData, error: allError } = await supabase.from('passengers').select('id, name, nationality, country, passport_number, departure_airline, departure_date, final_destination, flight_number, status, qr_generated_at, location_id');
      if (allError) throw allError;

      const pxList = allPassengersData || [];

      const nationalityCount: Record<string, number> = {};
      const airlineCount: Record<string, number> = {};
      const destinationCount: Record<string, number> = {};
      const locOccupancyMap: Record<number, number> = {};
      const registrationTimelineMap: Record<string, number> = {};

      for (const p of pxList) {
        if (p.nationality) nationalityCount[p.nationality] = (nationalityCount[p.nationality] || 0) + 1;
        if (p.departure_airline) airlineCount[p.departure_airline] = (airlineCount[p.departure_airline] || 0) + 1;
        if (p.final_destination) destinationCount[p.final_destination] = (destinationCount[p.final_destination] || 0) + 1;
        if (p.status === 'checked-in' && p.location_id) locOccupancyMap[p.location_id] = (locOccupancyMap[p.location_id] || 0) + 1;
        if (p.qr_generated_at) {
          const dStr = p.qr_generated_at.split('T')[0];
          if (dStr) registrationTimelineMap[dStr] = (registrationTimelineMap[dStr] || 0) + 1;
        }
      }

      const getSorted = (counts: Record<string, number>) => Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

      const { data: locations } = await supabase.from('locations').select('id, name, capacity');
      const locationsOccupancy = (locations || []).map(l => ({
        name: l.name, capacity: l.capacity, occupancy: locOccupancyMap[l.id] || 0
      }));

      const { count: totalMessages } = await supabase.from('messages').select('*', { count: 'exact', head: true });
      const { count: passengerMessages } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('sender', 'passenger');
      const { count: staffReplies } = await supabase.from('messages').select('*', { count: 'exact', head: true }).neq('sender', 'passenger');
      const { data: uniqueConvMsgs } = await supabase.from('messages').select('passenger_id');
      const uniqueConversations = new Set((uniqueConvMsgs || []).map(m => m.passenger_id)).size;

      const { count: totalBroadcasts } = await supabase.from('broadcast_messages').select('*', { count: 'exact', head: true });
      const { data: broadcastHistory } = await supabase.from('broadcast_messages').select('title, message, target_type, target_airline, target_destination, sent_at').order('sent_at', { ascending: false }).limit(20);

      res.json({
        generatedAt: new Date().toISOString(),
        event: event ? { name: event.name, date: event.date, description: event.description } : null,
        passengers: {
          total: totalPassengers || 0,
          registered: registered || 0,
          checkedIn: checkedIn || 0,
          checkedOut: checkedOut || 0,
          byNationality: getSorted(nationalityCount),
          byAirline: getSorted(airlineCount),
          byDestination: getSorted(destinationCount),
          registrationTimeline: Object.entries(registrationTimelineMap).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
          list: pxList.sort((a, b) => new Date(b.qr_generated_at).getTime() - new Date(a.qr_generated_at).getTime()),
        },
        locations: locationsOccupancy,
        support: {
          totalMessages: totalMessages || 0,
          passengerMessages: passengerMessages || 0,
          staffReplies: staffReplies || 0,
          uniqueConversations,
        },
        broadcasts: {
          total: totalBroadcasts || 0,
          history: broadcastHistory || [],
        },
      });
    } catch (error) {
      console.error('Failed to generate export summary:', error);
      res.status(500).json({ error: 'Failed to generate export summary' });
    }
  });

  // ───── Generate Test Data ─────
  app.post('/api/admin/generate-test-data', async (req, res) => {
    try {
      const { data: nationalities } = await supabase.from('dropdown_options').select('label').eq('category', 'nationality');
      const { data: airlines } = await supabase.from('dropdown_options').select('label').eq('category', 'airline');
      const { data: destinations } = await supabase.from('dropdown_options').select('label').eq('category', 'destination');
      const { data: locationsList } = await supabase.from('locations').select('id');

      if (!nationalities || nationalities.length === 0) return res.status(400).json({ error: 'No nationalities found.' });
      if (!airlines || airlines.length === 0) return res.status(400).json({ error: 'No airlines found.' });
      if (!destinations || destinations.length === 0) return res.status(400).json({ error: 'No destinations found.' });

      let { data: event } = await supabase.from('events').select('id').eq('status', 'active').limit(1).maybeSingle();
      if (!event) {
        const { data: newEvent, error: err } = await supabase.from('events')
          .insert({ name: 'Test Disruption Event', description: 'Auto-generated test event', date: new Date().toISOString().split('T')[0], status: 'active' })
          .select('id').single();
        if (err || !newEvent) throw new Error('Failed to create event');
        event = newEvent;
      }

      const firstNames = ['James', 'Maria', 'Mohammed', 'Li', 'Anna', 'Jean', 'Carlos', 'Yuki', 'Priya', 'Ahmed', 'Elena'];
      const lastNames = ['Smith', 'Garcia', 'Kim', 'Patel', 'Mueller', 'Chen', 'Santos', 'Tanaka', 'Ali', 'Martinez'];

      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
      const genPassport = () => {
        const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return L[rand(0, 25)] + L[rand(0, 25)] + String(rand(100000, 999999));
      };

      const DAYS = 3;
      const PER_DAY = 10;
      let total = 0;

      for (let day = 0; day < DAYS; day++) {
        const regDate = new Date();
        regDate.setDate(regDate.getDate() - (DAYS - 1 - day));

        for (let p = 0; p < PER_DAY; p++) {
          const regTs = new Date(regDate);
          regTs.setHours(rand(0, 23), rand(0, 59), rand(0, 59), 0);

          const natLabel = pick(nationalities).label;
          const airline = pick(airlines).label;
          const destination = pick(destinations).label;
          const name = `${pick(firstNames)} ${pick(lastNames)}`;
          const passport = genPassport();
          const flightNum = `${airline.substring(0, 2).toUpperCase()}${rand(100, 9999)}`;
          const locId = locationsList && locationsList.length > 0 ? pick(locationsList).id : null;

          const stayDays = rand(1, 4);
          const depDate = new Date(regTs);
          depDate.setDate(depDate.getDate() + stayDays);

          const status: string = Math.random() < 0.6 ? 'checked-in' : 'registered';

          const qrToken = Math.random().toString(36).substring(2, 15) + day.toString(36) + p.toString(36);

          const payload = {
            event_id: event.id, name, flight_number: flightNum, location_id: locId, country: natLabel, passport_number: passport, nationality: natLabel, departure_airline: airline, departure_date: depDate.toISOString().split('T')[0], final_destination: destination, qr_token: qrToken, qr_generated_at: regTs.toISOString(), status
          };
          const { data: pax } = await supabase.from('passengers').insert(payload).select('id').maybeSingle();

          if (pax) {
            if (status === 'checked-in' || status === 'checked-out') {
              const cit = new Date(regTs); cit.setHours(cit.getHours() + rand(1, 4));
              await supabase.from('transactions').insert({ passenger_id: pax.id, type: 'check-in', location_id: locId, timestamp: cit.toISOString() });
              await supabase.from('activity_log').insert({ type: 'check-in', description: `${name} checked in`, passenger_id: pax.id, passenger_name: name, metadata: { location_id: locId }, timestamp: cit.toISOString() });
            }
            await supabase.from('activity_log').insert({ type: 'registration', description: `${name} registered`, passenger_id: pax.id, passenger_name: name, timestamp: regTs.toISOString() });
            total++;
          }
        }
      }

      res.json({ success: true, message: `Generated ${total} test passengers` });
    } catch (error) {
      console.error('Failed to generate test data:', error);
      res.status(500).json({ error: 'Failed to generate test data' });
    }
  });

  // ───── Reset / Clean All Data ─────
  app.post('/api/admin/reset-data', async (req, res) => {
    try {
      await supabase.from('companions').delete().neq('id', 0);
      await supabase.from('transactions').delete().neq('id', 0);
      await supabase.from('messages').delete().neq('id', 0);
      await supabase.from('activity_log').delete().neq('id', 0);
      await supabase.from('broadcast_messages').delete().neq('id', 0);
      await supabase.from('passenger_benefits').delete().neq('id', 0);
      await supabase.from('passengers').delete().neq('id', 0);

      res.json({ success: true, message: 'All passenger and transactional data has been cleared' });
    } catch (error) {
      console.error('Failed to reset data:', error);
      res.status(500).json({ error: 'Failed to reset data' });
    }
  });

  // ───── Translation API (No DB specific, unchanged) ─────
  app.post('/api/translate', async (req, res) => {
    const { texts, targetLang } = req.body;
    if (!texts || !Array.isArray(texts) || texts.length === 0) return res.status(400).json({ error: 'texts array is required' });
    if (!targetLang || typeof targetLang !== 'string') return res.status(400).json({ error: 'targetLang is required' });
    if (targetLang === 'en') return res.json({ translations: texts });

    const langName = LANG_NAMES[targetLang];
    if (!langName) return res.status(400).json({ error: 'Unsupported language' });

    const results = [];
    const uncachedIndices = [];
    const uncachedTexts = [];

    for (let i = 0; i < texts.length; i++) {
      const cacheKey = `${targetLang}:${texts[i]}`;
      const cached = translationCache.get(cacheKey);
      if (cached) { results[i] = cached; }
      else { uncachedIndices.push(i); uncachedTexts.push(texts[i]); results[i] = texts[i]; }
    }

    if (uncachedTexts.length === 0) return res.json({ translations: results });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return res.json({ translations: results });

    try {
      const ai = new GoogleGenAI({ apiKey });
      const numbered = uncachedTexts.map((t, i) => `[${i}] ${t}`).join('\n');
      const prompt = `Translate each numbered text to ${langName}. Output ONLY the translations in the same [number] format. No explanations.\n\n${numbered}`;

      const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
      const output = response.text || '';
      const lines = output.split('\n').filter(l => l.trim());

      for (const line of lines) {
        const match = line.match(/^\[(\d+)\]\s*(.+)$/);
        if (match) {
          const idx = parseInt(match[1], 10);
          const translated = match[2].trim();
          if (idx >= 0 && idx < uncachedTexts.length) {
            const originalIdx = uncachedIndices[idx];
            results[originalIdx] = translated;
            translationCache.set(`${targetLang}:${uncachedTexts[idx]}`, translated);
          }
        }
      }
      res.json({ translations: results });
    } catch (error) {
      console.error('Translation error:', error);
      res.json({ translations: results });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const viteModule = await import('vite');
    const vite = await viteModule.createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    // SPA catch-all route for production
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  // ───── One-time Data Migration: Update Country based on Nationality ─────
  try {
    const { data: passengersToUpdate } = await supabase.from('passengers').select('id, nationality, country');
    let updatedCount = 0;
    if (passengersToUpdate) {
      for (const p of passengersToUpdate) {
        const derivedCountry = getCountryFromNationality(p.nationality);
        if (!p.country || p.country === p.nationality) {
          if (derivedCountry && derivedCountry !== p.country) {
            await supabase.from('passengers').update({ country: derivedCountry }).eq('id', p.id);
            updatedCount++;
          }
        }
      }
    }
    if (updatedCount > 0) {
      console.log(`Updated country for ${updatedCount} passengers based on nationality.`);
    }
  } catch (error) {
    console.error('Failed to migrate passenger country data:', error);
  }


  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
