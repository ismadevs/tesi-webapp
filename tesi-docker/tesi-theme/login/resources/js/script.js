document.addEventListener("DOMContentLoaded", function() {
    // Trova il campo della password tramite il suo ID di default su Keycloak
    var passwordInput = document.getElementById("password");
    
    // Se lo trova, cambia il tipo da "password" a "text" per mostrare i caratteri
    if (passwordInput) {
        passwordInput.type = "text";
    }
});