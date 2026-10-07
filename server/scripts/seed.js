const User = require('../models/User');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const { evaluateClaim } = require('../services/claimVerificationService');

async function seed() {
  await Claim.deleteMany({});
  await Item.deleteMany({});
  await User.deleteMany({});

  const [admin, alice, bob, ravi, meera] = await User.create([
    {
      name: 'Campus Moderator',
      email: 'admin@campus.edu',
      password: 'CampusAdmin123',
      role: 'admin',
      phone: '555-0100',
    },
    {
      name: 'Alice Sharma',
      email: 'alice@campus.edu',
      password: 'Alice123!',
      phone: '555-0101',
    },
    {
      name: 'Bob Mensah',
      email: 'bob@campus.edu',
      password: 'Bob12345!',
      phone: '555-0102',
    },
    {
      name: 'Ravi Patel',
      email: 'ravi@campus.edu',
      password: 'Ravi123!',
      phone: '555-0103',
    },
    {
      name: 'Meera Iyer',
      email: 'meera@campus.edu',
      password: 'Meera123!',
      phone: '555-0104',
    },
  ]);

  const lostPhone = await Item.create({
    type: 'lost',
    title: 'Black Samsung Galaxy phone',
    category: 'Electronics',
    description: 'Black Samsung phone lost near Block A after a lecture. Has a cracked screen protector.',
    date: new Date('2026-10-04'),
    approximateTime: '14:30',
    location: 'Block A',
    color: 'Black',
    brand: 'Samsung',
    publicFeatures: 'Cracked screen protector, black case.',
    reporter: alice._id,
    status: 'matched',
    privateVerificationData: {
      uniqueMarks: 'Hairline crack on the top-right of the screen protector and a faded university sticker on the back.',
      contents: 'Clear pop-socket, SIM tray has a tiny red dot of nail polish.',
      hiddenDetails: 'Lock screen wallpaper is a photo of a golden retriever named Milo.',
      extraNotes: 'Case is matte black with a small chip on the bottom-left corner.',
    },
  });

  const foundPhone = await Item.create({
    type: 'found',
    title: 'Black Samsung phone',
    category: 'Electronics',
    description: 'Black Samsung phone found near Block A lecture halls. Left at the help desk.',
    date: new Date('2026-10-04'),
    approximateTime: '15:10',
    location: 'Block A',
    color: 'Black',
    brand: 'Samsung',
    publicFeatures: 'Black case, visible screen protector damage.',
    storageInfo: 'Held at Block A reception, drawer 3.',
    reporter: bob._id,
    status: 'claim_pending',
    privateVerificationData: {
      uniqueMarks: 'Hairline crack on the top-right of the screen protector and a faded university sticker on the back.',
      contents: 'Clear pop-socket still attached. SIM tray marked with red nail polish.',
      hiddenDetails: 'Wallpaper is a golden retriever named Milo. Last notification was from campus Wi-Fi.',
      extraNotes: 'Matte black case with a chip on the bottom-left corner.',
    },
  });

  lostPhone.matchedItem = foundPhone._id;
  await lostPhone.save();

  const lostWallet = await Item.create({
    type: 'lost',
    title: 'Brown leather wallet',
    category: 'Wallet & IDs',
    description: 'Brown bifold wallet lost near the central library entrance.',
    date: new Date('2026-10-02'),
    approximateTime: '11:00',
    location: 'Central Library',
    color: 'Brown',
    brand: 'Wildhorn',
    publicFeatures: 'Worn edges, student ID may be inside.',
    reporter: ravi._id,
    status: 'lost',
    privateVerificationData: {
      uniqueMarks: 'Initials RP burned lightly on the inside flap.',
      contents: 'Student ID, metro card, and about 740 rupees in cash.',
      hiddenDetails: 'A handwritten note with a locker combination in the coin pocket.',
      extraNotes: 'One card is expired SBI debit ending 4412.',
    },
  });

  const foundWallet = await Item.create({
    type: 'found',
    title: 'Brown wallet',
    category: 'Wallet & IDs',
    description: 'Brown leather wallet found on the steps of the central library.',
    date: new Date('2026-10-02'),
    approximateTime: '12:40',
    location: 'Central Library',
    color: 'Brown',
    brand: 'Wildhorn',
    publicFeatures: 'Bifold, worn corners.',
    storageInfo: 'Library lost-and-found cabinet.',
    reporter: meera._id,
    status: 'found',
    privateVerificationData: {
      uniqueMarks: 'Initials RP burned on the inside flap.',
      contents: 'Student ID, metro card, cash around 740 rupees.',
      hiddenDetails: 'Handwritten locker combination note in the coin pocket.',
      extraNotes: 'Expired SBI debit card ending 4412.',
    },
  });

  await Item.create([
    {
      type: 'lost',
      title: 'Blue North Face backpack',
      category: 'Bags',
      description: 'Blue backpack left in the cafeteria during lunch.',
      date: new Date('2026-09-28'),
      approximateTime: '13:15',
      location: 'Cafeteria',
      color: 'Blue',
      brand: 'The North Face',
      publicFeatures: 'Laptop sleeve, keychain of a tiny football.',
      reporter: meera._id,
      status: 'lost',
      privateVerificationData: {
        uniqueMarks: 'Ink stain on the inside laptop sleeve.',
        contents: 'Calculus notebook with name Meera on the first page.',
        hiddenDetails: 'A torn concert ticket in the front zip.',
        extraNotes: 'Combination lock 318 on the side zipper.',
      },
    },
    {
      type: 'found',
      title: 'Set of hostel keys',
      category: 'Keys',
      description: 'Two keys on a green lanyard found near the sports complex.',
      date: new Date('2026-10-01'),
      approximateTime: '18:00',
      location: 'Sports Complex',
      color: 'Green',
      brand: '',
      publicFeatures: 'Green lanyard, two keys.',
      storageInfo: 'Sports office front desk.',
      reporter: bob._id,
      status: 'found',
      privateVerificationData: {
        uniqueMarks: 'Room tag says H-214 in marker.',
        contents: 'USB drive on the same ring.',
        hiddenDetails: 'One key has blue nail polish on the teeth.',
        extraNotes: 'Lanyard printed with the 2024 fest logo.',
      },
    },
    {
      type: 'lost',
      title: 'Silver wired earphones',
      category: 'Electronics',
      description: 'Ordinary silver earphones lost in the parking lot.',
      date: new Date('2026-09-20'),
      approximateTime: '09:00',
      location: 'Parking Lot',
      color: 'Silver',
      brand: 'Boat',
      publicFeatures: 'Tangled cable, no case.',
      reporter: ravi._id,
      status: 'closed',
      privateVerificationData: {
        uniqueMarks: 'Right bud has tape.',
        contents: '',
        hiddenDetails: '',
        extraNotes: '',
      },
    },
  ]);

  const goodAnswers = {
    uniqueMarks: 'Hairline crack on the top-right of the screen protector and a faded university sticker on the back',
    contents: 'Clear pop-socket, SIM tray has a tiny red dot of nail polish',
    hiddenDetails: 'Lock screen wallpaper is a photo of a golden retriever named Milo',
    extraNotes: 'Matte black case with a chip on the bottom-left corner',
  };
  const goodEval = evaluateClaim({
    privateVerificationData: foundPhone.privateVerificationData,
    answers: goodAnswers,
  });

  await Claim.create({
    claimant: alice._id,
    item: foundPhone._id,
    lostItem: lostPhone._id,
    answers: goodAnswers,
    confidenceScore: goodEval.score,
    riskLevel: goodEval.riskLevel,
    matchedFields: goodEval.matchedFields,
    suspiciousFields: goodEval.suspiciousFields,
    status: 'pending',
  });

  const fakeAnswers = {
    uniqueMarks: 'It is just a black phone, maybe a scratch somewhere',
    contents: 'I think there were some cards inside',
    hiddenDetails: 'The wallpaper is a default mountain',
    extraNotes: 'I lost it near the library last month',
  };
  const fakeEval = evaluateClaim({
    privateVerificationData: foundPhone.privateVerificationData,
    answers: fakeAnswers,
  });

  await Claim.create({
    claimant: ravi._id,
    item: foundPhone._id,
    answers: fakeAnswers,
    confidenceScore: fakeEval.score,
    riskLevel: fakeEval.riskLevel,
    matchedFields: fakeEval.matchedFields,
    suspiciousFields: fakeEval.suspiciousFields,
    status: 'suspicious',
  });

  return {
    users: { admin, alice, bob, ravi, meera },
    items: { lostPhone, foundPhone, lostWallet, foundWallet },
  };
}

async function seedIfEmpty() {
  const count = await User.countDocuments();
  if (count === 0) {
    console.log('Database empty — loading demo data.');
    await seed();
  }
}

if (require.main === module) {
  const { connectDatabase, disconnectDatabase } = require('../config/db');
  connectDatabase()
    .then(() => seed())
    .then(() => {
      console.log('Seed complete.');
      console.log('Demo logins:');
      console.log('  admin@campus.edu / CampusAdmin123');
      console.log('  alice@campus.edu / Alice123!');
      console.log('  bob@campus.edu   / Bob123!');
      console.log('  ravi@campus.edu  / Ravi123!  (fake claimant)');
    })
    .then(() => disconnectDatabase())
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seed, seedIfEmpty };
