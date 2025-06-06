require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 4000;

// Configure CORS more securely
const corsOptions = {
  origin: 'http://localhost:3000', // Set to your frontend's URL
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions));
app.use(express.json());

// Input validation middleware
const validateEmailInput = (req, res, next) => {
  const { email, message } = req.body;
  
  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  if (message.length > 1000) {
    return res.status(400).json({
      error: 'Message too long (max 1000 characters)'
    });
  }

  next();
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false 
  }
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Email backend is running.' });
});

app.post('/send-email', validateEmailInput, async (req, res) => {
  const { email, message } = req.body;

  try {
    const mailOptions = {
      from: `"Email Service" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Email Sender sent a message',
      text: message,
      html: `<p>${message.replace(/\n/g, '<br>')}</p>`
    };

    await transporter.sendMail(mailOptions);
    
    res.json({ success: true, message: 'Email sent successfully.' });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send email.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});