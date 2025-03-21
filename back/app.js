const express = require("express"); //alt 96 ``
const app = express();
const path = require("path");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");

app.use(express.json());

//verificar token
const verificarToken = (req,res,next)=>{
    const token = req.headers["authorization"]?.split(" ")[1];

    if(!token) {return res.status(401).json({mensaje:`Token invalido 1`});}

    jwt.verify(token,"124911",(err,decoded)=>{
        if(err) return res.status(401).json({mensaje:"Token invalido 2"});
        req.usuario = decoded;
        next();
    });
}

app.get("/main",verificarToken,(req,res)=>{
    console.log("llegamos al main xd");
    res.status(200).json({mensaje:req.usuario.nombre,id:req.usuario.id});
});

app.use(express.static(path.join(__dirname, "../public"))); // Asegura que los archivos estáticos sean accesibles

// 📌 Configuración de la base de datos usando variables de entorno de Railway
const db = mysql.createConnection({
    host: process.env.DB_HOST, 
    user: process.env.DB_USER,  
    password: process.env.DB_PASSWORD, 
    database: "gastos_app",
    port: process.env.DB_PORT || 3306
});

// Conectar a la base de datos
db.connect(err => {
    if (err) {
        console.error("Error al conectar:", err);
        return;
    }
    console.log("✅ Conexión exitosa a la base de datos en Railway 🚀");
    });


// 📌 Ruta para login
app.post("/login", (req, res) => {
    const { nombre, contraseña } = req.body;
    console.log("Login: Nombre: ", nombre, "Contraseña: ", contraseña);

    const checkQuery = "SELECT nombre_usuario, contrasena,id FROM Usuarios WHERE nombre_usuario=? AND contrasena=?";
    db.query(checkQuery, [nombre, contraseña], (err, results) => {
        if (err) {
            console.error("Error en la consulta", err);
            return res.status(500).json({ mensaje: `Error en la consulta: ${err}` });
        }
        if (results.length == 0) {
            return res.status(400).json({ mensaje: "Contraseña o Usuario Incorrecto" });
        }
        const id = results[0].id;
        const token = jwt.sign({nombre,id},"124911",{expiresIn:"1h"});
        return res.status(200).json({token});
    });
});

app.get("/main",verificarToken,(req,res)=>{
    console.log("llegamos al main xd");
    res.status(200).json({mensaje:req.usuario.nombre,id:req.usuario.id});
});

// 📌 Ruta para register
app.post("/register", (req, res) => {
    const { nombre, contraseña } = req.body;

    if (!nombre || !contraseña) {
        return res.status(400).json({ mensaje: "Faltan datos: nombre o contraseña" });
    }
    const checkQuery = "SELECT * FROM Usuarios WHERE nombre_usuario = ?";
    db.query(checkQuery, [nombre], (err, results) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return res.status(500).json({ mensaje: "Error en el servidor" });
        }

        if (results.length > 0) {
            return res.status(400).json({ mensaje: "El nombre de usuario ya está en uso" });
        }

        const insertQuery = "INSERT INTO Usuarios (nombre_usuario, contrasena) VALUES (?, ?)";
        db.query(insertQuery, [nombre, contraseña], (err, result) => {
            if (err) {
                console.error("Error al registrar usuario:", err);
                return res.status(500).json({ mensaje: "Error al registrar usuario" });
            }
            res.json({ mensaje: "Usuario registrado con éxito 🚀" });
        });
    });
});

// 📌 Ruta para crear grupo
app.post("/crearGrupo",(req,res)=>{
    const {nombreGrupo,idCreador} = req.body;

    if (!nombreGrupo || !idCreador) {
        return res.status(400).json({ mensaje: "Faltan datos: nombreGrupo o idCreador" });
    }
    const checkquerry = `SELECT * FROM Grupos WHERE nombre_grupo = ?`;
    db.query(checkquerry,[nombreGrupo],(err,results)=>{
        if(err){
            console.error("Error Creando Grupo",err);
            return res.status(500).json({mensaje:`Error ${err}`});
        }
        if(results.length>0){
            return res.status(409).json({mensaje:"Ya existe un grupo con ese nombre"});
        }
        const querry = `INSERT INTO Grupos (nombre_grupo, id_admin) VALUES (?, ?)`;
        db.query(querry,[nombreGrupo, idCreador],(err,results)=>{
            if(err) {
                console.error("Error Creando Grupo",err);
                return res.status(500).json({mensaje:`Error: ${err}`});
            }
            return res.status(201).json({mensaje:"Grupo creado exitosamente"});
        });
    });
});

// 📌 Ruta para get grupos por usuario
app.get("/main-getGrupos",(req,res)=>{
    const token = req.headers["authorization"]?.split(" ")[1];
    const payload64 = token.split(".")[1];
    const payload = JSON.parse(atob(payload64));
    const id = payload.id;

    const querry = `SELECT nombre_grupo,id FROM Grupos WHERE id_admin = ?`;
    db.query(querry,[id],(err,resultado)=>{
        if(err){
            return res.status(500).json({mensaje:"Error interno en consulta"});
        }
        
        return res.status(200).json({resultado});
    })
});

// 📌 Ajustar el puerto para que use el de Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
