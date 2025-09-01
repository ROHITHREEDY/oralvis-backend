const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

require('./models/database');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'OralVis API working!' }));

const { router: authRouter } = require('./routes/auth');
app.use('/api/auth', authRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
