const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // for secure connections
  },
});

app.use(express.json());

// API to store appointment data
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

// API to filter appointments by date
app.get('/api/appointments', async (req, res) => {
  const { date } = req.query;

  try {
    const result = await pool.query(
      'SELECT * FROM appointments WHERE date = $1',
      [date]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'No appointments found for the selected date' });
    } else {
      res.status(200).json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
