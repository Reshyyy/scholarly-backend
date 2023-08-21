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

//register API
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

//login API
app.post('/login', (req, res) => {
    const sql = 'SELECT * FROM applicant_account WHERE email = ?';
    db.query(sql, [req.body.email], (err, data) => {
        if (err) return res.json({ Error: "Login error in server" });
        if (data.length > 0) {
            bcrypt.compare(req.body.password.toString(), data[0].password, (err, response) => {
                if (err) return res.json({ Error: "Password compare error" });
                if (response) {
                    const firstname = data[0].firstname;
                    const token = jwt.sign({firstname}, "jwt-secret-key", {expiresIn: '1d'});
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