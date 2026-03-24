/**
 * Email Verification Module - Express Server
 * Made by Ansh
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { verifyEmail } = require('./src/verifyEmail');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Email Verification Server is running', author: 'Ansh' });
});

// Email verification endpoint
app.post('/api/verify', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        message: 'Please provide an email address in the request body',
      });
    }

    const result = await verifyEmail(email);
    return res.json(result);
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🔍 Email Verification Server by Ansh`);
    console.log(`   Running on http://localhost:${PORT}`);
    console.log(`   API Endpoint: POST /api/verify`);
    console.log(`   Abstract API: ${process.env.ABSTRACT_API_KEY ? 'Configured ✅' : 'Missing ❌'}\n`);
  });
}

module.exports = app;
