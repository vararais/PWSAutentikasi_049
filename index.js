require('dotenv').config();

const express = require('express');
const crypto = require('crypto');
const path = require('path');
const mysql = require('mysql2/promise');
const express = require('express');
const crypto = require('crypto')

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json()); 
app.use(express.static('public')); 

const pool = mysql.createPool({
    host: process.env.DB_HOST,           
    user: process.env.DB_USER,           
    password: process.env.DB_PASSWORD,   
    database: process.env.DB_NAME,       
    port: process.env.DB_PORT,           
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const KEY_PREFIX = 'Vara_R4is_';


app.get('/generate-apikey', async (req, res) => {
  try {

    const randomToken = crypto.randomBytes(16).toString('hex');
    const newApiKey = KEY_PREFIX + randomToken;
    

    const sql = "INSERT INTO api_keys (api_key) VALUES (?)";
    await pool.query(sql, [newApiKey]);
    
    console.log("Key baru dibuat & disimpan di DB:", newApiKey);
    res.json({ apiKey: newApiKey });
    
  } catch (error) {
    console.error("Error saat generate key:", error);
    res.status(500).json({ error: 'Gagal membuat API key di database' });
  }
});


app.post('/validate-apikey', async (req, res) => {
  try {
    const { apiKeyToValidate } = req.body;

    if (!apiKeyToValidate) {
      return res.status(400).json({ error: 'API key dibutuhkan' });
    }


    const sql = "SELECT COUNT(*) as count FROM api_keys WHERE api_key = ?";
    const [rows] = await pool.query(sql, [apiKeyToValidate]);
    const count = rows[0].count;

    if (count > 0) {
      res.json({ valid: true, message: 'API Key Valid' });
    } else {
      res.status(401).json({ valid: false, message: 'API Key Tidak Valid atau Tidak Ditemukan' });
    }
  } catch (error) {
    console.error("Error saat validasi key:", error);
    res.status(500).json({ error: 'Gagal memvalidasi key di database' });
  }
});


app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  console.log(`Terhubung ke database MySQL 'daftarapikey'`);
});