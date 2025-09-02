const express = require('express');
const cors = require('cors');
require('dotenv').config();

require('./models/database');

const app = express();

const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'https://oralvis-frontend-beige.vercel.app' // your deployed frontend domain
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'OralVis API working!' }));

const { router: authRouter } = require('./routes/auth');
app.use('/api/auth', authRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
