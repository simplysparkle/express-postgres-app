const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Set up PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(express.json());  // Middleware to parse incoming JSON data

// Root route to avoid raw code display
app.get('/', (req, res) => {
  res.send('API is working. Use appropriate endpoints.');
});

// Endpoint for appointments submission
app.post('/api/appointments', async (req, res) => {
  const { firstName, lastName, mobileNumber, email, service, date, time } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO appointments (first_name, last_name, mobile_number, email, service, date, time)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [firstName, lastName, mobileNumber, email, service, date, time]
    );
    res.status(201).json({ message: 'Appointment booked successfully', appointment: result.rows[0] });
  } catch (error) {
    console.error('Error saving appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint for fetching appointment details
app.get('/api/appointment-details', async (req, res) => {
  const { mobileNumber, date } = req.query;
  try {
    let query;
    let queryParams;

    if (mobileNumber && date) {
      query = `SELECT * FROM appointments WHERE mobile_number = $1 AND date = $2`;
      queryParams = [mobileNumber, date];
    } else if (mobileNumber) {
      query = `SELECT * FROM appointments WHERE mobile_number = $1`;
      queryParams = [mobileNumber];
    } else if (date) {
      query = `SELECT * FROM appointments WHERE date = $1`;
      queryParams = [date];
    } else {
      return res.status(400).json({ message: 'Please provide a mobile number or date to filter the appointments' });
    }

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'No appointments found' });
    } else {
      res.status(200).json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching appointment details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
