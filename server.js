import express from 'express';
import mysql from 'mysql'
import cors from 'cors'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser';

const salt = 10;

const app = express();
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5173"],
    methods: ["POST", "GET", "PUT"],
    credentials: true
}));

app.use(cookieParser());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'scholarly'
});

// db.connect((err) => {
//     if (err) {
//         console.error('Error connecting to the database:', err);
//     } else {
//         console.log('Connected to the database');
//     }
// });



// const port = 8081;
// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });

app.listen(8081, () => {
    console.log('Server is running on port 8081');
});

//register API for Applicant
app.post('/signup', (req, res) => {
    const sql = "INSERT INTO applicant_account (firstname, lastname, email, password) VALUES (?, ?, ?, ?)";
    bcrypt.hash(req.body.password.toString(), salt, (err, hash) => {
        if(err) return res.json({Errpr: "Error for hashing password"});
        const values = [
            req.body.firstname,
            req.body.lastname,
            req.body.email,
            hash
        ];
        db.query(sql, values, (err, result) => {
            if (err) {
                return res.json({ Error: "Inserting data Error in server" });
            }
            return res.json({ Status: "Success" });
        });
    })
});

//login API for Applicant
app.post('/login', (req, res) => {
    const sql = 'SELECT * FROM applicant_account WHERE email = ?';
    db.query(sql, [req.body.email], (err, data) => {
        if (err) return res.json({ Error: "Login error in server" });
        if (data.length > 0) {
            bcrypt.compare(req.body.password.toString(), data[0].password, (err, response) => {
                if (err) return res.json({ Error: "Password compare error" });
                if (response) {
                    const firstname = data[0].firstname;
                    const token = jwt.sign({ firstname }, "jwt-secret-key", { expiresIn: '1d' });
                    res.cookie('token', token);

                    return res.json({ Status: "Success" });
                } else {
                    return res.json({ Error: "Password not matched" });
                }
            });
        } else {
            return res.json({ Error: "No Email Existed" });
        }
    });
});


//login API for admin
app.post('/admin-login', (req, res) => {
    const sql = 'SELECT * FROM admin WHERE email = ?';
    db.query(sql, [req.body.email], (err, data) => {
        if (err) return res.json({ Error: "Login error in server" });
        if (data.length > 0) {
            if (req.body.password === data[0].password) {
                return res.json({ Status: "Success" });
            } else {
                return res.json({ Error: "Password not matched" });
            }
        } else {
            return res.json({ Error: "No Email Existed" });
        }
    });
});


//register API for Grantor
app.post('/grantor-register2', (req, res) => {
    const sql = 'INSERT INTO grantor_account (organization_name, firstname, lastname, email, password) VALUES (?, ?, ?, ?, ?)';
    const values = [
        req.body.organization_name,
        req.body.firstname,
        req.body.lastname,
        req.body.email,
        req.body.password
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            return res.json({ Error: 'Error inserting data into database' });
        }
        console.log('Registration successful:', result);
        return res.json({ Status: 'Success' });
    });
});

// Grantor login API
app.post('/grantor-login', (req, res) => {
    const sql = 'SELECT * FROM grantor_account WHERE email = ?';
    db.query(sql, [req.body.email], (err, data) => {
        if (err) return res.json({ Error: "Login error in server" });
        if (data.length > 0) {
            if (req.body.password === data[0].password) {
                return res.json({ Status: "Success" });
            } else {
                return res.json({ Error: "Password not matched" });
            }
        } else {
            return res.json({ Error: "No Email Existed" });
        }
    });
});

// Add Scholarship API
app.post('/add_scholarship', (req, res) => {
    const sql = 'INSERT INTO scholarships (scholarship_name, provider, category, description, eligibility, location, amount) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [
        req.body.scholarship_name,
        req.body.provider,
        req.body.category,
        req.body.description,
        req.body.eligibility,
        req.body.location,
        req.body.amount,
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            return res.json({ Error: 'Error adding scholarship'  });
        }
        console.log('Add Scholarship successful:', result);
        return res.json({ Status: 'Success' });
    });

});



// Create an API endpoint to fetch scholarship data
app.get('/api/data', (req, res) => {
    const query = 'SELECT * FROM scholarships';
    
    db.query(query, (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching data' });
      } else {
        res.json(results);
      }
    });
  });

// Delete Scholarship API
app.delete('/api/scholarships/:id', (req, res) => {
    const scholarshipId = req.params.id;
    const sql = 'DELETE FROM scholarships WHERE id = ?';

    db.query(sql, [scholarshipId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error deleting scholarship' });
        }
        console.log('Scholarship deleted successfully:', result);
        return res.json({ status: 'Success' });
    });
});

// API endpoint to fetch applicants' data
app.get('/api/applicants', (req, res) => {
    const sql = 'SELECT * FROM applicant_account';
  
    db.query(sql, (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching data' });
      } else {
        res.json(results);
      }
    });
});

// API endpoint to fetch providers' data
app.get('/api/provider', (req, res) => {
    const sql = 'SELECT * FROM grantor_account'; // Use the correct table name for providers
  
    db.query(sql, (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching data' });
      } else {
        res.json(results);
      }
    });
});


// Update Applicant API
app.put('/api/update-applicant/:applicantId', (req, res) => {
    const applicantId = req.params.applicantId;
    const { firstname, lastname, email } = req.body;
  
    const sql = 'UPDATE applicant_account SET firstname = ?, lastname = ?, email = ? WHERE id = ?';
  
    db.query(sql, [firstname, lastname, email, applicantId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error updating applicant' });
      }
      console.log('Applicant updated successfully:', result);
      return res.json({ status: 'Success' });
    });
});


// Update Provider API
app.put('/api/update-provider/:providerId', (req, res) => {
    const providerId = req.params.providerId;
    const { organization_name, firstname, lastname, email } = req.body;
    
    const sql = 'UPDATE grantor_account SET organization_name = ?, firstname = ?, lastname = ?, email = ? WHERE id = ?';
    
    db.query(sql, [organization_name, firstname, lastname, email, providerId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error updating provider' });
      }
      console.log('Provider updated successfully:', result);
      return res.json({ status: 'Success' });
    });
});


  
