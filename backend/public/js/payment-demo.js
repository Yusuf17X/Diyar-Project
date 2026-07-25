const checkoutBtn = document.getElementById("checkoutBtn");
const statusEl = document.getElementById("status");
const invoiceInput = document.getElementById("invoiceId");
const tokenInput = document.getElementById("token");

const setStatus = (message, isError) => {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", Boolean(isError));
};

checkoutBtn.addEventListener("click", async () => {
  const invoiceId = invoiceInput.value.trim();
  const token = tokenInput.value.trim();

  if (!invoiceId) {
    setStatus("Invoice id is required.", true);
    return;
  }

  if (!token) {
    setStatus("JWT token is required.", true);
    return;
  }

  checkoutBtn.disabled = true;
  setStatus("Creating Stripe session...", false);

  try {
    const response = await fetch("/api/v1/payments/payment-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ invoiceId }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.message || "Failed to create session.", true);
      checkoutBtn.disabled = false;
      return;
    }

    if (!data.session || !data.session.url) {
      setStatus("Stripe session URL missing.", true);
      checkoutBtn.disabled = false;
      return;
    }

    window.location.href = data.session.url;
  } catch (error) {
    setStatus("Network error. Check your server logs.", true);
    checkoutBtn.disabled = false;
  }
});
