const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS simplificado
app.use(cors({
  origin: [
    'https://operabase-main.vercel.app',
    'https://operabase-frontend.vercel.app',
    'https://operabase-main-git-main-caioapfelbaums-projects.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Ultra Simple Server is running!',
    timestamp: new Date().toISOString(),
    version: 'ultra-simple-v1.0',
    port: PORT,
    env: process.env.NODE_ENV || 'production'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Ultra Simple API is working!',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

// Mock appointments endpoint (temporary)
app.get('/api/appointments', (req, res) => {
  res.json({
    message: 'Appointments endpoint - Ultra Simple Mode',
    note: 'This is a temporary response. Full TypeScript server coming soon.',
    mock_data: [
      {
        id: 1,
        clinic_id: 1,
        scheduled_date: '2025-07-10T10:00:00Z',
        status: 'agendada',
        doctor_name: 'Dr. Amanda Costa',
        specialty: 'Psicologia'
      }
    ],
    timestamp: new Date().toISOString()
  });
});

// Catch all
app.get('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    available_routes: ['/health', '/api/test', '/api/appointments'],
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Ultra Simple Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
}); 