const express = require("express"); //alt 96 ``
const app = express();
const path = require("path");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const cors = require("cors");

app.use(cors());
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
            const idGrupo = results.insertId;
            const querry2 = `INSERT INTO Usuarios_Grupos (id_usuario, id_grupo) VALUES (?, ?)`;
            db.query(querry2,[idCreador, idGrupo],(err,results)=>{
                if(err){
                    console.error("Error creando grupos",err);
                    return res.status(500).json({mensaje:`Error: ${err}`});
                }
            });
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

    const querry = `SELECT g.id, g.nombre_grupo, g.id_admin 
                    FROM Grupos g
                    INNER JOIN Usuarios_Grupos ug ON g.id = ug.id_grupo
                    WHERE ug.id_usuario = ?
                    GROUP BY g.id;
                    `
    db.query(querry,[id],(err,resultado)=>{
        if(err){
            return res.status(500).json({mensaje:"Error interno en consulta"});
        }
        console.log(resultado);
        return res.status(200).json({resultado:resultado});
        });
});
   

// 📌 Ruta para get grupos por usuario
app.post("/agregarIntegrante",(req,res)=>{
    console.log(req.body);
    const {idIntegrante,idGrupo} = req.body;
    const checkquerry = `SELECT * FROM Usuarios WHERE id = ?`;
    db.query(checkquerry,[idIntegrante],(err,results)=>{
        if(err){
            console.error("Error Agregando Interantes",err);
            return res.status(500).json({mensaje:`Error: ${err}`});
        }
        if(results.length==0){
            console.log("Usuario no existente");
            return res.status(404).json({mensaje:`Error: Ese Usuario no existe`});
        }
        
        const insertQuerry = `INSERT INTO Usuarios_Grupos (id_usuario, id_grupo) VALUES (?, ?)`;
        db.query(insertQuerry,[idIntegrante,idGrupo],(err,results)=>{
            if(err){
                console.error("Error Agregando Integrante: ",err);
                return res.status(500).json({mensaje:`Error: ${err}`});
            }
            return res.status(201).json({mensaje: `Usuario agregado con exito`});
        });
    });

});

// 📌 Ruta para get grupos por usuario
app.post("/nuevo-gasto",(req,res)=>{
    const {idGrupo,idUsuario,motivo,dinero,fecha} = req.body;

    const checkUsuario = `SELECT * FROM Usuarios WHERE id = ?`;
    db.query(checkUsuario,[idUsuario],(err,res)=>{
        if(err){
            return res.status(500).json({mensaje:`Error creando Gasto: ${err}`});
        }
        if(res.length==0){
            return res.status(400).json({mensaje:`Error ese usuario no existe`});
        }
    });

    const insertQuerry = `INSERT INTO Gastos (id_grupo, id_usuario, motivo_gasto, plata)`;
    db.query(insertQuerry,[idGrupo,idUsuario,motivo,dinero],(err,results)=>{
        if(err){
            return res.status(500).json({mensaje: `Error insertando gasto: ${err}`});
        }
        return res.status(201).json({mensaje:"Gasto agregado correctamente"});
    })


});

app.use(express.static(path.join(__dirname, "../public"))); 

// 📌 Ajustar el puerto para que use el de Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
