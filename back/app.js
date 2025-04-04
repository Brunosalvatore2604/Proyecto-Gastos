//ARREGLAR EL TEMA DE QUE SI EL LOCO ES EL PAGADOR SE PONGA EN TRUE SU TABLA CON Pago

const express = require("express"); //alt 96 ``
const app = express();
const path = require("path");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const cors = require("cors");



app.use(cors());
app.use(express.json());


// 📌 Configuración de la base de datos usando variables de entorno de Railway
const db = mysql.createConnection({
    host: process.env.DB_HOST, 
    user: process.env.DB_USER,  
    password: process.env.DB_PASSWORD, 
    database: "gastos_app",
    port: process.env.DB_PORT || 3306
});


// Conectar a la base de datos
db.connect(async err => {

    if (err) {
        console.error("Error al conectar:", err);
        return;
    }

    console.log("✅ Conexión exitosa a la base de datos en Railway 🚀");

});

//-------Verificar Token-----------
const verificarToken = (req,res,next)=>{
    const token = req.headers["authorization"]?.split(" ")[1];

    if(!token) {return res.status(401).json({mensaje:`Token invalido 1`});}

    jwt.verify(token,"124911",(err,decoded)=>{
        if(err) return res.status(401).json({mensaje:"Token invalido 2"});
        req.usuario = decoded;
        next();
    });
}

// 📌 Ruta para getear main con middlewere de chequeo de identidad
app.get("/main",verificarToken,(req,res)=>{
    res.status(200).json({mensaje:req.usuario.nombre,id:req.usuario.id});
});

// 📌 Ruta para login
app.post("/login", (req, res) => {
    const { nombre, contraseña } = req.body;

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
        if(resultado.length == 0){
            return res.status(400).json({mensaje:"No hay grupos"});
        }
        return res.status(200).json({resultado:resultado});
        });
});
   

// 📌 Ruta para get grupos por usuario
app.post("/agregarIntegrante",(req,res)=>{
    const {idIntegrante,idGrupo} = req.body;
    const checkquerry = `SELECT * FROM Usuarios WHERE id = ?`;
    db.query(checkquerry,[idIntegrante],(err,results)=>{
        if(err){
            console.error("Error Agregando Interantes",err);
            return res.status(500).json({mensaje:`Error: ${err}`});
        }
        if(results.length==0){
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

// 📌 Ruta para nuevo gasto

app.post("/nuevo-gasto", (req, res) => {
    const { idGrupo, idUsuario, motivo, dinero, fecha } = req.body;

    const checkUsuario = `SELECT * FROM Usuarios_Grupos WHERE id_usuario = ? AND id_grupo = ?`;
    db.query(checkUsuario, [idUsuario, idGrupo], (err, result) => {
        if (err) {
            return res.status(500).json({ mensaje: `Error verificando usuario: ${err}` });
        }
        if (result.length === 0) {
            return res.status(400).json({ mensaje: `Error: ese usuario no existe` });
        }

        // Insertar el gasto solo si el usuario es válido
        const insertQuerry = `INSERT INTO Gastos (id_grupo, id_usuario, motivo_gasto, plata) VALUES (?, ?, ?, ?)`;
        db.query(insertQuerry, [idGrupo, idUsuario, motivo, dinero], (err, results) => {
            if (err) {
                return res.status(500).json({ mensaje: `Error insertando gasto: ${err}` });
            }
            const idGasto = results.insertId;

            // Seleccionar los usuarios del grupo
            const selectUsuarios = `SELECT id_usuario FROM Usuarios_Grupos WHERE id_grupo = ?`;
            db.query(selectUsuarios, [idGrupo], (err, results) => {
                if (err) {
                    return res.status(500).json({ mensaje: `Error seleccionando usuarios: ${err}` });
                }

                // Insertar en "Pago" para cada usuario
                const insertQuerry2 = `INSERT INTO Pago (id_gasto, id_usuario) VALUES (?, ?)`;
                const promises = results.map(usuario => {
                    return new Promise((resolve, reject) => {
                        db.query(insertQuerry2, [idGasto, usuario.id_usuario], (err) => {
                            if (err) {
                                reject(`Error agregando a pago usuario: ${usuario.id_usuario}`);
                            }else{
                                resolve();
                            }
                        });
                    });
                });

                // Ejecutar todas las inserciones y responder solo una vez
                Promise.all(promises)
                    .then(() => { 
                        db.query(`UPDATE Pago SET esta_pago = TRUE WHERE id_usuario = ? AND id_gasto = ?`,[idUsuario,idGasto],(err,results)=>{
                            if(err){
                                return res.status(200).json({mensaje: "gasto agregado correctamente pero comprador no"});
                            }else{
                                return res.status(200).json({ mensaje: "Gasto agregado correctamente y comprador tambien" });
                            }
                        })
                        
                    })
                    .catch(error => {
                        res.status(500).json({ mensaje: error });
                    });
            });
        });
    });
});


// 📌 Ruta para get gastos por grupo

app.post("/get-gastos",(req,res)=>{
    const {idGrupo,id} = req.body;
    const querry = `SELECT id, id_grupo, id_usuario, motivo_gasto, plata, pago FROM Gastos WHERE id_grupo = ?`;
    db.query(querry,[idGrupo],(err,resultado)=>{
        if(err){
            return res.status(500).json({mensaje:`Error geteando gastos: ${err}`});
        }
        if(resultado.length==0){
            return res.status(404).json({mensaje:`No hay gastos para este grupo`});
        }
        return res.status(200).json({resultado:resultado});
       
    });
});


// 📌 Ruta para pagar gastos

app.post("/pago-gasto",(req,res)=>{
    var estaPago =1;
    const {idu,idGasto} = req.body;
    //Chequear si usuario ya pago
    const checkquerry = `SELECT esta_pago FROM Pago WHERE id_gasto = ? AND id_usuario = ?`;
    db.query(checkquerry,[idGasto,idu],(err,result)=>{
        if(err){
            return res.status(500).json({mensaje:`Error comprobando si esta pago: ${err}`});
        }
        if(result.length > 0 && result[0].esta_pago == 1){
            return res.status(400).json({mensaje:"Este Usuario ya pago"});
        }

        //Si no esta pago updatea la tabla Pago por usuario
        const updateQuerry = `UPDATE Pago SET esta_pago = TRUE WHERE id_usuario = ? AND id_gasto = ?`;
        db.query(updateQuerry,[idu, idGasto],(err,result)=>{
            if(err){
                return res.status(500).json({mensaje:`Error Pagando: ${err}`});
            }else{
                //Update hecho, verificando si ya pagaron todo
                const checkPago = `SELECT id_usuario,esta_pago,id FROM Pago WHERE id_gasto = ?`;
                db.query(checkPago,[idGasto],(err,result)=>{
                    if(err){
                        return res.status(201).json({mensaje:"Gasto pagado con exito, pero error en update de esta pago 1"});
                    }
                    
                    const checkPago2 = `SELECT esta_pago FROM Pago WHERE id = ?`;
                    const promesas = result.map(pagos=>{
                        return new Promise((resolve,reject)=>{
                            db.query(checkPago2,[pagos.id],(err,result)=>{
                                if(err){
                                    reject(`ERROR en el pago `);
                                }else if(result[0].esta_pago==0){
                                    estaPago = 0;
                                    resolve();
                                }else{
                                    resolve();
                                }
                            });
                        });
                    });
                    Promise.all(promesas)
                    .then(()=>{
                        if(estaPago==1){
                            const updatePago = `UPDATE Gastos SET pago = TRUE WHERE id = ?`;
                            db.query(updatePago,[idGasto],(err,result)=>{
                                if(err){
                                    return res.status(201).json({mensaje:"Gasto pagado con exito, pero error en update de esta pago"});
                                }
                                res.status(201).json({mensaje:"Gasto pago y gasto pagado"});
                            });
                        }else{
                            res.status(201).json({mensaje:"Gasto pago y gasto no pagado"});
                        }
                    }).catch((err)=>{
                        console.log(err);
                        return res.status(500).json({mensaje:"Error pamba"});
                    })                    
                });
            }

        });

    });
        
});

// 📌 Ruta para getear quien pago
app.post("/get-quien-pago",(req,res)=>{
    const {idGasto} = req.body;
    const queryNoPago = `SELECT u.nombre_usuario
                            FROM Pago p
                            JOIN Usuarios u ON p.id_usuario = u.id
                            WHERE p.id_gasto = ? AND p.esta_pago = FALSE`;
    const queryPago = `SELECT u.nombre_usuario
                            FROM Pago p
                            JOIN Usuarios u ON p.id_usuario = u.id
                            WHERE p.id_gasto = ? AND p.esta_pago = TRUE`;
    db.query(queryNoPago,[idGasto],(err,result1)=>{
        if(err){
            return res.status(500).json({mensaje:`Error geteando quien no pago: ${err}`});
        }else{
            db.query(queryPago,[idGasto],(err,result2)=>{
                if(err){
                    return res.status(500).json({mensaje:`Error geteando quien pago: ${err}`});
                }else{
                    console.log("resultado 1: ",result1,"resultado 2: ",result2);
                    return res.status(200).json({noPagaron:result1,siPagaron:result2});
                }
            })
        }
    });
    
});

app.use(express.static(path.join(__dirname, "../public"))); 

// 📌 Ajustar el puerto para que use el de Railway

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
