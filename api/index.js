const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Vercel's PostgreSQL setup
  },
});

app.use(express.json());  // Middleware to parse incoming JSON

// POST endpoint to create a new appointment
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

// GET endpoint to fetch appointment details
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
      return res.status(400).json({ message: 'Please provide a mobile number or date' });
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
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
