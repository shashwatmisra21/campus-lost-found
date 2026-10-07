const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

process.env.JWT_SECRET = 'test-secret-please-change';
process.env.SEED_ON_EMPTY = 'false';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';

const app = require('../app');
const User = require('../models/User');
const Item = require('../models/Item');

let memory;
let adminToken;
let aliceToken;
let bobToken;
let raviToken;
let lostId;
let foundId;
let claimId;
let suspiciousId;

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

before(async () => {
  memory = await MongoMemoryServer.create();
  await mongoose.connect(memory.getUri());
  await User.create({
    name: 'Admin',
    email: 'admin@campus.edu',
    password: 'CampusAdmin123',
    role: 'admin',
  });
});

after(async () => {
  await mongoose.disconnect();
  if (memory) await memory.stop();
});

describe('auth', () => {
  it('registers a user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice Sharma',
      email: 'alice@campus.edu',
      password: 'Alice123!',
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, 'alice@campus.edu');
    assert.equal(res.body.user.password, undefined);
    aliceToken = res.body.token;
  });

  it('rejects duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@campus.edu',
      password: 'Alice123!',
    });
    assert.equal(res.status, 409);
  });

  it('logs in', async () => {
    const bob = await request(app).post('/api/auth/register').send({
      name: 'Bob Mensah',
      email: 'bob@campus.edu',
      password: 'Bob123!',
    });
    const ravi = await request(app).post('/api/auth/register').send({
      name: 'Ravi Patel',
      email: 'ravi@campus.edu',
      password: 'Ravi123!',
    });
    bobToken = bob.body.token;
    raviToken = ravi.body.token;

    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@campus.edu',
      password: 'Alice123!',
    });
    assert.equal(res.status, 200);
    aliceToken = res.body.token;
  });

  it('rejects bad password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@campus.edu',
      password: 'wrong-pass',
    });
    assert.equal(res.status, 401);
  });

  it('returns current user', async () => {
    const res = await request(app).get('/api/auth/me').set(auth(aliceToken));
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, 'alice@campus.edu');
    assert.ok(!res.body.user.password);
  });

  it('logs in admin', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@campus.edu',
      password: 'CampusAdmin123',
    });
    assert.equal(res.status, 200);
    adminToken = res.body.token;
  });
});

describe('items', () => {
  it('creates a lost item', async () => {
    const res = await request(app)
      .post('/api/items')
      .set(auth(aliceToken))
      .field('type', 'lost')
      .field('title', 'Black Samsung Galaxy phone')
      .field('category', 'Electronics')
      .field('description', 'Black Samsung phone lost near Block A after a lecture.')
      .field('date', '2026-10-04')
      .field('approximateTime', '14:30')
      .field('location', 'Block A')
      .field('color', 'Black')
      .field('brand', 'Samsung')
      .field('publicFeatures', 'Cracked screen protector, black case.')
      .field('uniqueMarks', 'Hairline crack top-right and faded university sticker')
      .field('contents', 'Clear pop-socket, SIM tray red nail polish')
      .field('hiddenDetails', 'Wallpaper is a golden retriever named Milo')
      .field('extraNotes', 'Matte black case chip bottom-left');
    assert.equal(res.status, 201);
    lostId = res.body.item._id;
    assert.equal(res.body.item.privateVerificationData, undefined);
  });

  it('creates a found item that can match the lost phone', async () => {
    const res = await request(app)
      .post('/api/items')
      .set(auth(bobToken))
      .field('type', 'found')
      .field('title', 'Black Samsung phone')
      .field('category', 'Electronics')
      .field('description', 'Black Samsung phone found near Block A lecture halls.')
      .field('date', '2026-10-04')
      .field('approximateTime', '15:10')
      .field('location', 'Block A')
      .field('color', 'Black')
      .field('brand', 'Samsung')
      .field('publicFeatures', 'Black case, visible screen protector damage.')
      .field('storageInfo', 'Block A reception drawer 3')
      .field('uniqueMarks', 'Hairline crack on the top-right of the screen protector and a faded university sticker on the back')
      .field('contents', 'Clear pop-socket still attached. SIM tray marked with red nail polish.')
      .field('hiddenDetails', 'Wallpaper is a golden retriever named Milo.')
      .field('extraNotes', 'Matte black case with a chip on the bottom-left corner.');
    assert.equal(res.status, 201);
    foundId = res.body.item._id;
    assert.ok(res.body.matches.length >= 1);
    assert.ok(res.body.matches[0].score >= 50);
  });

  it('never returns private verification on public get', async () => {
    const res = await request(app).get(`/api/items/${foundId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.item.privateVerificationData, undefined);
    const raw = JSON.stringify(res.body);
    assert.equal(raw.includes('Milo'), false);
    assert.equal(raw.includes('nail polish'), false);
  });

  it('returns matches for the lost item', async () => {
    const res = await request(app)
      .get(`/api/items/${lostId}/matches`)
      .set(auth(aliceToken));
    assert.equal(res.status, 200);
    assert.ok(res.body.matches.some((m) => String(m.item._id) === String(foundId)));
  });

  it('requires auth to create items', async () => {
    const res = await request(app).post('/api/items').send({
      type: 'lost',
      title: 'Nope',
      category: 'Other',
      description: 'Should fail without token here',
      date: '2026-10-01',
      location: 'Library',
    });
    assert.equal(res.status, 401);
  });
});

describe('claims', () => {
  it('scores a legitimate claim highly', async () => {
    const res = await request(app)
      .post('/api/claims')
      .set(auth(aliceToken))
      .field('itemId', foundId)
      .field('lostItemId', lostId)
      .field('uniqueMarks', 'Hairline crack on the top-right of the screen protector and a faded university sticker')
      .field('contents', 'Clear pop-socket, SIM tray has red nail polish')
      .field('hiddenDetails', 'Wallpaper is a golden retriever named Milo')
      .field('extraNotes', 'Matte black case chip on the bottom-left');
    assert.equal(res.status, 201);
    claimId = res.body.claim.id;
    assert.ok(res.body.evaluation.score >= 70);
    assert.ok(['pending', 'under_review'].includes(res.body.claim.status));
    assert.equal(JSON.stringify(res.body).includes('privateVerificationData'), false);
  });

  it('marks a fake claim as suspicious', async () => {
    const res = await request(app)
      .post('/api/claims')
      .set(auth(raviToken))
      .field('itemId', foundId)
      .field('uniqueMarks', 'Just a normal black phone')
      .field('contents', 'I think some cards were inside')
      .field('hiddenDetails', 'Default mountain wallpaper')
      .field('extraNotes', 'Lost near the library last month');
    assert.equal(res.status, 201);
    suspiciousId = res.body.claim.id;
    assert.ok(res.body.evaluation.score < 50);
    assert.equal(res.body.claim.status, 'suspicious');
  });

  it('lists my claims', async () => {
    const res = await request(app).get('/api/claims/my').set(auth(aliceToken));
    assert.equal(res.status, 200);
    assert.ok(res.body.claims.length >= 1);
  });

  it('blocks a user from another user claim', async () => {
    const res = await request(app).get(`/api/claims/${claimId}`).set(auth(bobToken));
    assert.equal(res.status, 403);
  });
});

describe('admin and authorization', () => {
  it('blocks non-admin from admin routes', async () => {
    const res = await request(app).get('/api/admin/claims').set(auth(aliceToken));
    assert.equal(res.status, 403);
  });

  it('lists claims for admin', async () => {
    const res = await request(app).get('/api/admin/claims').set(auth(adminToken));
    assert.equal(res.status, 200);
    assert.ok(res.body.claims.length >= 2);
  });

  it('rejects the suspicious claim', async () => {
    const res = await request(app)
      .put(`/api/admin/claims/${suspiciousId}/reject`)
      .set(auth(adminToken))
      .send({ adminNotes: 'Answers do not match the item.' });
    assert.equal(res.status, 200);
    assert.equal(res.body.claim.status, 'rejected');
  });

  it('approves the legitimate claim and updates status', async () => {
    const res = await request(app)
      .put(`/api/admin/claims/${claimId}/approve`)
      .set(auth(adminToken))
      .send({ adminNotes: 'Owner verified.' });
    assert.equal(res.status, 200);
    assert.equal(res.body.claim.status, 'approved');

    const found = await Item.findById(foundId);
    const lost = await Item.findById(lostId);
    assert.equal(found.status, 'returned');
    assert.equal(lost.status, 'recovered');
  });

  it('can mark an item returned via admin endpoint', async () => {
    const extra = await Item.create({
      type: 'found',
      title: 'Keys',
      category: 'Keys',
      description: 'Key ring found at sports complex entrance area.',
      date: new Date(),
      location: 'Sports Complex',
      reporter: (await User.findOne({ email: 'bob@campus.edu' }))._id,
      status: 'found',
    });
    const res = await request(app)
      .put(`/api/admin/items/${extra._id}/returned`)
      .set(auth(adminToken));
    assert.equal(res.status, 200);
    assert.equal(res.body.item.status, 'returned');
  });
});
