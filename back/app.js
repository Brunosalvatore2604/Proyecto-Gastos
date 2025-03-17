const express = require('express');
const app = express();
const path = require("path");
const mysql = require("mysql2");

app.use(express.json());
app.use(express.static("../public"));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "gastos_app" 
})

db.connect((err) => {
    if (err) {
        console.error("Error al conectar a MySQL:", err);
        return;
    }
    console.log("Conectado a la base de datos MySQL 🚀");
});

//login
app.post("/login",(req,res)=>{
    const {nombre,contraseña} = req.body;
    console.log("Login: Nombre: ",nombre,"Contraseña: ",contraseña);

    const checkquerry = "SELECT nombre_usuario,contraseña FROM usuarios WHERE nombre_usuario=? and contraseña=?"
    db.query(checkquerry,[nombre,contraseña],(err,results)=>{
        if(err){
            console.error("Error en la consulta",err);
            return res.status(500).json({mensaje:`Error en la consulta: ${err}`})
        }
        if(results.length==0){
            return res.status(400).json({mensaje:"Contraseña o Usuario Incorrecto"});
        }

        return res.status(200).json({nombre:`${nombre}`})
    });
});

//register
app.post("/register", (req, res) => {
    const { nombre, contraseña } = req.body;

    const checkQuery = "SELECT * FROM Usuarios WHERE nombre_usuario = ?";
    
    db.query(checkQuery, [nombre], (err, results) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return res.status(500).json({ mensaje: "Error en el servidor" });
        }

        if (results.length > 0) {
            return res.status(400).json({ mensaje: "El nombre de usuario ya está en uso" });
        }

        const insertQuery = "INSERT INTO Usuarios (nombre_usuario, contraseña) VALUES (?, ?)";

        db.query(insertQuery, [nombre, contraseña], (err, result) => {
            if (err) {
                console.error("Error al registrar usuario:", err);
                return res.status(500).json({ mensaje: "Error al registrar usuario" });
            }
            res.json({ mensaje: "Usuario registrado con éxito 🚀" });
        });
    });
});


app.listen(3000,()=>{
    console.log("Servidor escuchando en https://localhost:3000/");
});