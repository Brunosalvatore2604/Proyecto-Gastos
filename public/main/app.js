document.addEventListener("DOMContentLoaded",()=>{
    
    const token = localStorage.getItem("token");
    if(!token) {
        window.location.href = "/index.html";
        return;
    }

    fetch("/main",{
        method: "GET",
        headers: {"Authorization" : "Bearer "+token}
    }).then(res =>res.json())
    .then(data =>{
        if(data.mensaje){
            document.getElementById("nombre-usuario").innerText = data.mensaje;
        }else{
            window.location.href("/index.html");
        }
    }).catch(err=>{
        console.error("Error:",err);
    })
});
