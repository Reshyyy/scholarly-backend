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
    methods: ["POST", "GET"],
    credentials: true
}));
app.use(cookieParser());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'scholarly'
})


app.listen(8081, () => {
    console.log(`Server is running...`);
})

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

// Register API for Grantor
app.post('/grantor-register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // Extract the image data from the FormData
        const logoImage = req.body.logo_image[0].buffer;

        const sql = 'INSERT INTO scholarship_providers (organization_name, contact_name, contact_email, phone_number, organization_type, mission_statement, logo_image, website_url, address, username, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [
            req.body.organization_name,
            req.body.contact_name,
            req.body.contact_email,
            req.body.phone_number,
            req.body.organization_type,
            req.body.mission_statement,
            logoImage, // Insert the binary image data
            req.body.website_url,
            req.body.address,
            req.body.username,
            hashedPassword,
        ];

        db.query(sql, values, (err, result) => {
            if (err) {
                return res.json({ Error: 'Error inserting data into database' });
            }
            return res.json({ Status: 'Success' });
        });
    } catch (error) {
        return res.json({ Error: 'Error processing registration' });
    }
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

// //register API for Grantor
// app.post('/grantor-register2', (req, res) => {
//     const sql = 'INSERT INTO grantor_account (organization_name, firstname, lastname, email, password) VALUES (?, ?, ?, ?, ?)';
//     const values = [
//         req.body.organization_name,
//         req.body.firstname,
//         req.body.lastname,
//         req.body.email,
//         req.body.password
//     ];

//     db.query(sql, values, (err, result) => {
//         if (err) {
//             return res.json({ Error: 'Error inserting data into database' });
//         }
//         return res.json({ Status: 'Success' });
//     });
// });

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
