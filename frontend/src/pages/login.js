function initLoginPage() {
    initToast();
    const loginForm = document.getElementById("login-form");
    const submitBtn = document.getElementById("submit-btn");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="spinner"></div> Signing In...';

            try {
                const response = await api.login(email, password);
                const user = response.data.user;
                
                let destination = "./resident.html";
                if (user.role === "ADMIN") destination = "./admin.html";
                else if (user.role === "SECURITY") destination = "./security.html";
                else if (user.role === "STAFF") destination = "./staff.html";

                window.showToast("Login successful! Redirecting...", "success");
                
                setTimeout(() => {
                    window.location.href = destination;
                }, 1000);
            } catch (error) {
                window.showToast(error.message || "Invalid credentials. Please try again.", "info");
                submitBtn.disabled = false;
                submitBtn.innerHTML = "Sign In";
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", initLoginPage);
