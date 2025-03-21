
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
            }
            const groupSelector = document.querySelector(".group-selector");
            groupSelector.innerHTML = "";

            data.resultado.forEach(grupo =>{

                const grupoeje = document.createElement("div");
                grupoeje.classList.add("group-eje");

                const nombre = document.createElement("h3");
                nombre.textContent = `Nombre: ${grupo.nombre_grupo}`;
                grupoeje.appendChild(nombre);

                const integrantes = document.createElement("h3");
                integrantes.textContent = `adminID: ${grupo.id}`;
                grupoeje.appendChild(integrantes);

                const formularioIntegrante = document.createElement("form");
                formularioIntegrante.id.add("form-integrante");

                const inputNuevointegrante = document.createElement("input");
                inputNuevointegrante.id.add("agregar-integrante");
                formularioIntegrante.appendChild(inputNuevointegrante);

                const agregarIntegrantes = document.createElement("button");
                agregarIntegrantes.textContent = "Agregar Integrante";
                agregarIntegrantes.id.add("submit-integrante");
                agregarIntegrantes.type.add("submit");
                formularioIntegrante.appendChild(agregarIntegrantes);

                grupoeje.appendChild(formularioIntegrante);
                
                groupSelector.appendChild(grupoeje);
            });
        })
    }catch(err){
        console.error("Error: ",err);
    }

});

document.getElementById("form-group-creation").addEventListener("submit", async (e)=>{
    e.preventDefault();

    const nombreGrupo = document.getElementById("nombre-grupo").value;
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
            alert(data.mensaje);
        }

    }catch(err){
        console.error("ERROR: ",err);
    }


})