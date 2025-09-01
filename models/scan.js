const db = require('./database');

class Scan {
  // Create a new scan record
  static async create(scanData) {
    return new Promise((resolve, reject) => {
      const { patient_name, patient_id, scan_type, region, image_url, uploaded_by } = scanData;
      
      const sql = `
        INSERT INTO scans (patient_name, patient_id, scan_type, region, image_url, uploaded_by) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      db.run(sql, [patient_name, patient_id, scan_type, region, image_url, uploaded_by], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            id: this.lastID, 
            patient_name, 
            patient_id, 
            scan_type, 
            region, 
            image_url,
            upload_date: new Date().toISOString(),
            uploaded_by 
          });
        }
      });
    });
  }

  // Get all scans (for dentist view)
  static async getAll() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT s.*, u.email as uploaded_by_email 
        FROM scans s 
        LEFT JOIN users u ON s.uploaded_by = u.id 
        ORDER BY s.upload_date DESC
      `;
      
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get scan by ID (for PDF generation and full view)
  static async getById(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT s.*, u.email as uploaded_by_email 
        FROM scans s 
        LEFT JOIN users u ON s.uploaded_by = u.id 
        WHERE s.id = ?
      `;
      
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get scans by technician (optional - for tracking who uploaded what)
  static async getByTechnician(technicianId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM scans WHERE uploaded_by = ? ORDER BY upload_date DESC`;
      
      db.all(sql, [technicianId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = Scan;
