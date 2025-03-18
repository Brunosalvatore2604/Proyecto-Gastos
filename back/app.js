const express = require("express");
const app = express();
const path = require("path");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public"))); // Asegura que los archivos estáticos sean accesibles

// 📌 Configuración de la base de datos usando variables de entorno de Railway
const db = mysql.createConnection({
    host: process.env.DB_HOST, 
    user: process.env.DB_USER,  
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});

// Conectar a la base de datos
db.connect(err => {
    if (err) {
        console.error("Error al conectar:", err);
        return;
    }
    console.log("✅ Conexión exitosa a la base de datos en Railway 🚀");

        // Usar la base de datos
        db.changeUser({ database: 'gastos_app' }, err => {
            if (err) {
                console.error("❌ Error al seleccionar la base de datos:", err);
                return;
            }
            console.log("✅ Base de datos seleccionada");
        });
            const queries = [
                `CREATE TABLE IF NOT EXISTS Usuarios (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
                    contrasena TEXT NOT NULL
                );`,
                
                `CREATE TABLE IF NOT EXISTS Grupos (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre_grupo VARCHAR(100) NOT NULL,
                    cant_integrantes INT DEFAULT 1,
                    id_admin INT,
                    FOREIGN KEY (id_admin) REFERENCES Usuarios(id) ON DELETE CASCADE
                );`,
            
                `CREATE TABLE IF NOT EXISTS Usuarios_Grupos (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    id_usuario INT,
                    id_grupo INT,
                    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id) ON DELETE CASCADE,
                    FOREIGN KEY (id_grupo) REFERENCES Grupos(id) ON DELETE CASCADE,
                    UNIQUE(id_usuario, id_grupo)
                );`,
            
                `CREATE TABLE IF NOT EXISTS Gastos (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    id_grupo INT,
                    id_usuario INT,
                    motivo_gasto TEXT NOT NULL,
                    plata DECIMAL(10,2) NOT NULL,
                    pago BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY (id_grupo) REFERENCES Grupos(id) ON DELETE CASCADE,
                    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id) ON DELETE CASCADE
                );`
            ];
            
            // Ejecutar cada consulta individualmente
            queries.forEach(query => {
                connection.query(query, (err, results) => {
                    if (err) {
                        console.error("❌ Error al ejecutar consulta:", err.message);
                    } else {
                        console.log("✅ Tabla creada o ya existente");
                    }
                });
            });
            
            // Cerrar conexión después de ejecutar todo
            connection.end();
        });



// 📌 Ruta para login
app.post("/login", (req, res) => {
    const { nombre, contraseña } = req.body;
    console.log("Login: Nombre: ", nombre, "Contraseña: ", contraseña);

    const checkQuery = "SELECT nombre_usuario, contraseña FROM usuarios WHERE nombre_usuario=? AND contraseña=?";
    db.query(checkQuery, [nombre, contraseña], (err, results) => {
        if (err) {
            console.error("Error en la consulta", err);
            return res.status(500).json({ mensaje: `Error en la consulta: ${err}` });
        }
        if (results.length == 0) {
            return res.status(400).json({ mensaje: "Contraseña o Usuario Incorrecto" });
        }
        const token = jwt.sign({nombre},"124911",{expiresIn:"1h"});
        return res.status(200).json({token});
    });
});

const verificarToken = (req,res,next)=>{

    const token = req.headers["authorization"]?.split(" ")[1];

    if(!token) return res.status(401).json({mensaje:"Token invalido"});

    jwt.verify(token,"124911",(err,debug)=>{
        if(err) return res.status(401).json({mensaje:"Token invalido"});
        req.usuario = decoded;
        next();
    });
}

app.get("/main",verificarToken,(req,res)=>{
    res.json({mensjae:`Bienvenido ${req.usuario.nombre}`});
});

// 📌 Ruta para register
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

// 📌 Ajustar el puerto para que use el de Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
