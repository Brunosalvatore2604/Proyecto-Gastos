


document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();


    const nombre = document.getElementById("login-nombre").value;
    const contraseña = document.getElementById("login-contraseña").value;

    const values = {
        nombre,
        contraseña
    };

    try {
        const respuesta = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values)
        });

        const data = await respuesta.json();
        console.log("Respuesta del servidor: ",data);

        if(respuesta.ok){
            alert(`Bienvenido: ${data.nombre}`);
        }else{
            alert(data.mensaje);
        }

    } catch (error) {
        console.error("Error en fetch:", error);
    }
});


document.getElementById("form-register").addEventListener("submit",async(e)=>{

    e.preventDefault();
    const nombre = document.getElementById("register-nombre").value;
    const contraseña = document.getElementById("register-contraseña").value;
    const repetir = document.getElementById("register-repetir").value;

    if(contraseña!=repetir){
        alert("Las contraseñas no coiniciden");
        return;
    };

    const values = {
        nombre,
        contraseña,
        repetir
    };
 
    try{
        const respuesta = await fetch("http://localhost:3000/register",{
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(values)
        });

        const data = await respuesta.json();
        console.log("Respuesta del servidor:", data);

        if (respuesta.ok) {
            alert("Usuario registrado con éxito 🚀");
        } else {
            alert(data.mensaje);
        }
    } catch (error) {
        console.error("Error:", error);
    }
    
})