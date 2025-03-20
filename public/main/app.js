
document.addEventListener("DOMContentLoaded",()=>{
    
    const token = localStorage.getItem("token");
    if(!token) {
        window.location.href = "/index.html";
        return;
    }
    const payload64 = token.split(".")[1];
    const payload = JSON.parse(atob(payload64));
    const expired = payload.exp < Date.now();
    if(expired){
        window.location.href = "/index.html";
        localStorage.removeItem("token");
        return;
    }

    fetch("/main",{
        method: "GET",
        headers: {"Authorization" : "Bearer "+token}
    }).then(res =>res.json())
    .then(data =>{
        if(data.mensaje){
            document.getElementById("nombre-usuario").innerHTML = `<h3 id="nombre-usuario">Nombre de usuario: ${data.mensaje}</h3>`;
        }else{
            window.location.href("/index.html");
        }
    }).catch(err=>{
        console.error("Error:",err);
    })
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
        if(respuesta.ok){
            alert("Grupo creado exitosamente");
        }else{
            alert(data.mensaje);
        }

    }catch(err){
        console.error("ERROR: ",err);
    }


})