function initSignupPage() {
    initToast();
    const signupForm = document.getElementById("signup-form");
    const submitBtn = document.getElementById("submit-btn");
    const roleOptions = document.querySelectorAll(".role-option");

    // Role selection logic
    roleOptions.forEach(option => {
        option.addEventListener("click", () => {
            roleOptions.forEach(opt => opt.classList.remove("active"));
            option.classList.add("active");
            const radio = option.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });

    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const fullname = document.getElementById("fullname").value;
            const email = document.getElementById("email").value;
            const property = document.getElementById("property").value;
            const password = document.getElementById("password").value;
            const confirm = document.getElementById("confirm").value;
            const role = signupForm.querySelector('input[name="role"]:checked').value;

            if (password !== confirm) {
                window.showToast("Passwords do not match!", "info");
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="spinner"></div> Creating Account...';

            try {
                // Call standard API signup
                const response = await api.signup(fullname, email, password, role.toUpperCase(), property);
                
                let destination = "./resident.html";
                if (role === "admin") destination = "./admin.html";
                else if (role === "security") destination = "./security.html";
                else if (role === "staff") destination = "./staff.html";

                window.showToast("Account created successfully!", "success");
                
                setTimeout(() => {
                    window.location.href = destination;
                }, 1000);
            } catch (error) {
                window.showToast(error.message || "Signup failed. Please try again.", "info");
                submitBtn.disabled = false;
                submitBtn.innerHTML = "Create Account";
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", initSignupPage);
