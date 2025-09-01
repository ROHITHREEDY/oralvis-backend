const db = require('./database');
const bcrypt = require('bcryptjs');

class User {
  static async create(email, password, role) {
    return new Promise((resolve, reject) => {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.run(
        `INSERT INTO users (email, password, role) VALUES (?, ?, ?)`,
        [email, hashedPassword, role],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, email, role });
        }
      );
    });
  }

  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM users WHERE email = ?`,
        [email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }
}

module.exports = User;
