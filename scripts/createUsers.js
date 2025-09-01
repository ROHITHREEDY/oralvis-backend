require('dotenv').config();
const db = require('../models/database'); // Use persistent db
const bcrypt = require('bcryptjs');

async function createSampleUsers() {
  const techPassword = bcrypt.hashSync('password123', 10);
  const dentistPassword = bcrypt.hashSync('password123', 10);

  db.serialize(() => {
    db.run(
      `INSERT OR IGNORE INTO users (email, password, role) VALUES (?, ?, ?)`,
      ['tech@oralvis.com', techPassword, 'technician'],
      function (err) {
        if (err) console.error(err.message);
        else console.log('✅ Technician user created');
      }
    );

    db.run(
      `INSERT OR IGNORE INTO users (email, password, role) VALUES (?, ?, ?)`,
      ['dentist@oralvis.com', dentistPassword, 'dentist'],
      function (err) {
        if (err) console.error(err.message);
        else console.log('✅ Dentist user created');
      }
    );
  });
}

createSampleUsers();
