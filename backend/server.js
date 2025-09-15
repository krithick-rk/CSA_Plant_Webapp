// server.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send('Backend is alive!');
});

app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
});
