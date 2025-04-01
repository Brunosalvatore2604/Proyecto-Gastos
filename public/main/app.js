//--------- CARGAR COSAS DEL USUARIO -------------------


document.addEventListener("DOMContentLoaded", async()=> {
    
    const token = localStorage.getItem("token");
    if(!token) {
        window.location.href = "/index.html";
        return;
    }
    const payload64 = token.split(".")[1];
    const payload = JSON.parse(atob(payload64));
    const expired = (payload.exp*1000) < Date.now();
    if(expired){
        window.location.href = "/index.html";
        localStorage.removeItem("token");
        return;
    }

    try{
        await fetch("/main",{
            method: "GET",
            headers: {"Authorization" : "Bearer "+token}
        }).then(res => res.json())
        .then(data =>{
            if(data.mensaje){
                document.getElementById("nombre-usuario").textContent = `Nombre de usuario: ${data.mensaje}`;
                document.getElementById("id-usuario").textContent = `ID: ${data.id}`;
            }else{
                window.location.href("/index.html");
            }
        }).catch(err=>{
            console.error("Error:",err);
        })
    }catch(err){
        console.err("Error",err);
    }
    
    try{
        await fetch("/main-getGrupos",{
            method:"GET",
            headers: {"Authorization": " Bearer "+token}
        })
        .then(res =>res.json())
        .then(data =>{
            if(data.mensaje){
                console.error("Error cargando los grupos: ",data.mensaje);
                return;
            }
            const groupSelector = document.querySelector(".group-selector");
            groupSelector.innerHTML = "";

            data.resultado.forEach(grupo =>{

                const grupoeje = document.createElement("div");
                grupoeje.classList.add("group-eje");

                const nombre = document.createElement("h3");
                nombre.textContent = `Nombre:${grupo.nombre_grupo}`;
                grupoeje.appendChild(nombre);

                const admin = document.createElement("h3");
                admin.textContent = `adminID:${grupo.id_admin}`;
                admin.id = "admin";
                grupoeje.appendChild(admin);

                const idGrupo = document.createElement("h3");
                idGrupo.textContent = `IDgrupo:${grupo.id}`;
                idGrupo.id = "idGrupo";
                grupoeje.appendChild(idGrupo);

                const nuevoGasto = document.createElement("button");
                nuevoGasto.classList.add("nuevo-gasto");
                nuevoGasto.textContent = "Agregar gasto";
                nuevoGasto.type = "button"
                grupoeje.appendChild(nuevoGasto);

                const payload64 = token.split(".")[1];
                const payload = JSON.parse(atob(payload64));
                const id = payload.id;

                if(id==grupo.id_admin){
                    
                    const formularioIntegrante = document.createElement("form");
                    formularioIntegrante.id = "form-integrante";
                    
                    const inputNuevointegrante = document.createElement("input");
                    inputNuevointegrante.id = "agregar-integrante";
                    formularioIntegrante.appendChild(inputNuevointegrante);

                    const agregarIntegrantes = document.createElement("button");
                    agregarIntegrantes.textContent = "Agregar Integrante";
                    agregarIntegrantes.id = "submit-integrante";
                    agregarIntegrantes.type = "submit";
                    formularioIntegrante.appendChild(agregarIntegrantes);

                    grupoeje.appendChild(formularioIntegrante);
                }
                
                groupSelector.appendChild(grupoeje);
            });
        })
    }catch(err){
        console.error("Error: ",err);
    }

});

// ----------- CREACION DE GRUPO/API ---------------

document.addEventListener("click", async (e)=>{

    e.preventDefault();
    if(!(e.target.id=="sub-grupo")){
        return;
    }

    const formulario = e.target.closest("form");
    const nombreGrupo = formulario.querySelector("#nombre-grupo").value;
    const token = localStorage.getItem("token");

    if(!token){
        console.error("No hay token redirigiendo...");
        window.location.href = "/";
        return;
    }    
    try{

        const payLoad64 = token.split(".")[1];
        const payLoad = JSON.parse(atob(payLoad64));
        const isExpired = (payLoad.exp *1000) < Date.now();
        if(isExpired){
            console.error("Token expirado");
            localStorage.removeItem("token");
            window.location.href = "/index.html";
            return;
        }
        const idCreador = payLoad.id;

        const values ={
            nombreGrupo,
            idCreador
        }

        const respuesta = await fetch("/crearGrupo",{
            method:"POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(values)
        });

        const data = await respuesta.json();
        console.log(data);
        if(respuesta.ok){
            alert("Grupo creado exitosamente");
        }else{
            alert("Error creando Grupo");
            console.error("Error Creando Grupo: ",data.mensaje);
        }

    }catch(err){
        console.error("ERROR: ",err);
    }


})

//------------ AGREGAR INTEGRANTE/FRONT ----------------

document.addEventListener("click",async event =>{

    event.preventDefault();
    const target = event.target;
    const contenedor = target.closest("div");

    if(!(event.target.id == "submit-integrante")){
        return;
    }

    const formulario = target.closest("form");
    if(!formulario) return;

    const idIntegrante = parseInt(formulario.querySelector("#agregar-integrante")?.value);
    const idGrupo = contenedor.querySelector("#idGrupo").textContent.split(":")[1];

    const value ={
        idIntegrante,
        idGrupo
    };
    
    console.log(JSON.stringify(value));

    if(!value.idIntegrante){
        alert("Campo vacio");
        return;
    }

    const respuesta = await fetch("/agregarIntegrante",{
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(value)
    });

    const data =  await respuesta.json();
    console.log("Respuesta del servidor: ",data);

    if(respuesta.ok){
        alert("Usuario Agregado con exito");
    }else{
        alert("Error Agregando Integrante");
        console.error(data.mensaje);
        console.error(respuesta.status);
    }
});

//------------- AGREGAR GASTO/FRONT ----------------

document.addEventListener("click",async e =>{

    e.preventDefault();

    const gastoExists = document.querySelector("#gasto-nuevo");
    if(gastoExists){
        return;
    }

    const target = e.target;
    if(!(target.classList == "nuevo-gasto")){
        return;
    }

    const div = e.target.closest("div");

    const divGastos = document.querySelector(".gastos");
    const gasto = document.createElement("div");
    gasto.classList.add("gasto-ejemplo");
    gasto.id = "gasto-nuevo";
    divGastos.appendChild(gasto);

    const nombreGrupo = div.querySelector("h3").textContent.split(":")[1];
    const idgrupo = div.querySelector("#idGrupo").textContent.split(":")[1];
    const creadorGasto = div.querySelector("#admin").textContent.split(":")[1];

    const grupo = document.createElement("h3");
    grupo.textContent = `Grupo: ${nombreGrupo}`;
    gasto.appendChild(grupo);

    const grupoid = document.createElement("h3");
    grupoid.id = "grupo-id";
    grupoid.textContent = `ID grupo:${idgrupo}`;
    gasto.appendChild(grupoid);

    const creador = document.createElement("h3");
    creador.textContent = `id Creador:${creadorGasto}`;
    creador.id = "creador-gasto"
    gasto.appendChild(creador);

    const formGasto = document.createElement("form");
    formGasto.id = "form-gasto";
    
    const textComprador = document.createElement("h3");
    textComprador.textContent = "Comprador:";
    formGasto.appendChild(textComprador);

    const inputComprador = document.createElement("input");
    inputComprador.id = "input-comprador";
    formGasto.appendChild(inputComprador);

    const textMotivo = document.createElement("h3");
    textMotivo.textContent = "Motivo:";
    formGasto.appendChild(textMotivo);

    const inputMotivo = document.createElement("input");
    inputMotivo.id = "input-motivo";
    formGasto.appendChild(inputMotivo);

    const textDinero = document.createElement("h3");
    textDinero.textContent = "Dinero:";
    formGasto.appendChild(textDinero);

    const inputDinero = document.createElement("input");
    inputDinero.id = "input-dinero";
    formGasto.appendChild(inputDinero);

    const textFecha = document.createElement("h3");
    textFecha.textContent = "Fechas:";
    formGasto.appendChild(textFecha);

    const inputFecha = document.createElement("input");
    inputFecha.id = "input-fecha";
    formGasto.appendChild(inputFecha);

    const submitGasto = document.createElement("button");
    submitGasto.type = "submit";
    submitGasto.textContent = "Nuevo Gasto";
    submitGasto.id = "agregar-gasto";
    formGasto.appendChild(submitGasto);

    const cancelarGasto = document.createElement("button");
    cancelarGasto.type = "submit";
    cancelarGasto.id = "cancelar-gasto";
    cancelarGasto.textContent = "X";
    gasto.appendChild(cancelarGasto);

    gasto.appendChild(formGasto);

});

//------------ AGREGAR GASTO/API --------------

document.addEventListener("click",async e =>{
    e.preventDefault();

    const target = e.target;
    if(!(target.id=="agregar-gasto")){
        return;
    }

    const divGasto = target.closest("div");
    const form = target.closest("form");
    const idGrupo = target.closest("div").querySelector("#grupo-id").textContent.split(":")[1];
    const idUsuario = form.querySelector("#input-comprador").value;
    const motivo = form.querySelector("#input-motivo").value;
    const dinero = form.querySelector("#input-dinero").value;
    const fecha = form.querySelector("#input-fecha").value;

    const values = {
        idGrupo,
        idUsuario,
        motivo,
        dinero,
        fecha
    }

    try{
        const respuesta = await fetch("/nuevo-gasto",{
            method:"POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(values)
        });

        const data = await respuesta.json();
        console.log("Respuesta del Servidor: ",data.mensaje);

        if(respuesta.ok){
            alert("Gasto agregado correctamente");
            divGasto.remove();
        }else{
            alert("Error Creando gasto");
            console.error("Error creando gasto: ",data.mensaje);
        }
    }catch(err){
        alert(`Error Creando gasto`);
        console.error("Error creando gasto: ",err);
    }
})

document.addEventListener("click", e=>{
    e.preventDefault();

    if(!(e.target.id=="cancelar-gasto")){
        return;
    }
    e.target.closest("div").remove();
});

//--------GETEAR GASTOS POR GRUPO/FRONT-------------------

document.addEventListener("click", async e => {

    if(e.target.classList == "nuevo-gasto" || e.target.id=="submit-integrante"){
        return;
    }

    const div = e.target.closest("div");
    if(!div || !(div.classList=="group-eje")){
        return;
    }
    

    const idGrupo = div.querySelector("#idGrupo").textContent.split(":")[1];
    const token = localStorage.getItem("token");
    const payload64 = token.split(".")[1];
    const payload = JSON.parse(atob(payload64));
    const id = payload.id
    const values = {
        idGrupo,
        id
    }

    try{
        await fetch("/get-gastos",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify(values)
        })
        .then(res =>res.json())
        .then(data =>{
            if(data.mensaje){
                if(data.mensaje == "No hay gastos para este grupo"){
                    const divGastos = document.querySelector(".gastos");
                    divGastos.innerHTML= "";
                    return;
                }
                alert("Error Geteando gastos");
                console.error("Error geteando gastos",data);
                return;
            }
            const divGastos = document.querySelector(".gastos");
            divGastos.innerHTML = "";
            data.resultado.forEach(gastos=>{
                const gasto = document.createElement("div");
                gasto.classList.add("gasto-ejemplo");

                const idGasto = document.createElement("h3");
                idGasto.id = "id-gasto";
                idGasto.textContent = `ID gasto:${gastos.id}`;
                gasto.appendChild(idGasto);

                const titulo = document.createElement("h3");
                titulo.id = "titulo-gasto"
                titulo.textContent = `Motivo gasto:${gastos.motivo_gasto}`
                gasto.appendChild(titulo);

                const grupo = document.createElement("h3");
                grupo.id = "grupo-gasto"
                grupo.textContent = `Grupo:${gastos.id_grupo}`;
                gasto.appendChild(grupo);

                const comprador = document.createElement("h3");
                comprador.id = "comprador-gasto"
                comprador.textContent = `Comprador:${gastos.id_usuario}`;
                gasto.appendChild(comprador);

                const plata = document.createElement("h3");
                plata.id = "plata-gasto"
                comprador.textContent = `Plata:${gastos.plata}$`;
                gasto.appendChild(comprador);
                
                if(!(id==gastos.id_usuario)){
                    const textoPago = document.createElement("h3");
                    comprador.textContent = `¿Pago?:`;
                    gasto.appendChild(textoPago);

                    const pago = document.createElement("button");
                    pago.id = "pago-gasto"
                    pago.textContent= "Pague";
                    gasto.appendChild(pago);
                }
                divGastos.appendChild(gasto);
            });
        })
    }catch(err){
        console.error("Error geteando gastos: ",err);
    }
});

document.addEventListener("click",async e=>{
    e.preventDefault();

    if(!(e.target.id=="pago-gasto")){
        return;
    }

    const token = localStorage.getItem("token");
    if(!token){
        alert("Error no token");
        return;
    }

    const payload64 = token.split(".")[1];
    const payload = JSON.parse(atob(payload64));
    const isExpired = (payload.exp *1000) < Date.now();
        if(isExpired){
            console.error("Token expirado");
            localStorage.removeItem("token");
            window.location.href = "/index.html";
            return;
        }
    const idu = payload.id;
    const idGasto = e.target.closest("div").querySelector("#id-gasto").textContent.split(":")[1];
    const id = {
        idu,
        idGasto
    };    

    try{
        const respuesta = await fetch("/pago-gasto",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify(id)
        })
    
        const data = await respuesta.json();
        if(respuesta.ok){
            alert("Pago Realizado");
            console.log(data.mensaje);
            return;
        }
        alert("Error Realizando Pago");
        console.error(data.mensaje);
    }catch(err){
        console.error("Error realizando Pago: ",err);
    }

});