export function generateReceiptHTML({
  paymentIntent,
  appointment,
  serviceName,
  workerName,
  clientName,
  subtotal,
  discount,
  tax,
  tip,
  total,
  qrBase64,
  logoUrl
}: any) {
  const hasAppointment = !!appointment;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 40px;
        background: #f9fafb;
      }

      .container {
        max-width: 750px;
        margin: auto;
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      }

      .header {
        text-align: center;
        margin-bottom: 30px;
      }

      .logo {
        width: 90px;
        margin-bottom: 10px;
      }

      .title {
        font-size: 20px;
        font-weight: bold;
        color: #C71585;
      }

      .section {
        margin-top: 25px;
      }

      .section-title {
        font-weight: bold;
        margin-bottom: 10px;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
      }

      .row {
        display: flex;
        justify-content: space-between;
        margin: 6px 0;
        font-size: 14px;
      }

      .total {
        font-size: 18px;
        font-weight: bold;
        color: #C71585;
      }

      .qr {
        text-align: center;
        margin-top: 30px;
      }

      .muted {
        color: #888;
        font-size: 12px;
        text-align: center;
      }

      .badge {
        padding: 4px 10px;
        background: #e6f7ee;
        color: #0a8f4c;
        border-radius: 6px;
        font-size: 12px;
      }
    </style>
  </head>

  <body>
    <div class="container">

      <!-- HEADER -->
      <div class="header">
        <img src="${logoUrl}" class="logo" />
        <div class="title">Beauty Nails Management System</div>
        <div class="muted">Luxury Nail Care & Beauty</div>
      </div>

      <!-- PAYMENT INFO -->
      <div class="section">
        <div class="section-title">Payment Info</div>

        <div class="row"><span>Phone</span><span>${paymentIntent.phoneNumber}</span></div>
        <div class="row"><span>Status</span><span class="badge">${paymentIntent.status}</span></div>
        <div class="row"><span>Date</span><span>${new Date(paymentIntent.createdAt).toLocaleString()}</span></div>
        <div class="row"><span>Transaction</span><span>${paymentIntent.transactionId || paymentIntent.id}</span></div>
      </div>

      <!-- CLIENT / SERVICE INFO -->
      <div class="section">
        <div class="section-title">Details</div>

        <div class="row"><span>Client</span><span>${clientName || appointment?.client?.user?.name || "N/A"}</span></div>
        <div class="row"><span>Service</span><span>${serviceName || appointment?.service?.name || "N/A"}</span></div>
        <div class="row"><span>Worker</span><span>${workerName || appointment?.worker?.user?.name || "N/A"}</span></div>
      </div>

      ${
        hasAppointment
          ? `
      <!-- APPOINTMENT -->
      <div class="section">
        <div class="section-title">Appointment</div>

        <div class="row"><span>Date</span><span>${new Date(appointment.date).toLocaleDateString()}</span></div>
        <div class="row"><span>Time</span><span>${appointment.time}</span></div>
      </div>

      ${
        appointment.addOns?.length
          ? `
      <div class="section">
        <div class="section-title">Add-ons</div>
        ${appointment.addOns.map((a: any) => `
          <div class="row"><span>${a.name}</span><span>${a.price} CDF</span></div>
        `).join("")}
      </div>
      `
          : ""
      }
      `
          : `
      <div class="muted">⏳ Appointment not yet scheduled</div>
      `
      }

      <!-- PAYMENT SUMMARY -->
      <div class="section">
        <div class="section-title">Summary</div>

        ${subtotal ? `<div class="row"><span>Subtotal</span><span>${subtotal} CDF</span></div>` : ""}
        ${discount ? `<div class="row"><span>Discount</span><span>-${discount} CDF</span></div>` : ""}
        ${tax ? `<div class="row"><span>Tax</span><span>${tax} CDF</span></div>` : ""}
        ${tip ? `<div class="row"><span>Tip</span><span>${tip} CDF</span></div>` : ""}

        ${total ? `<div class="row total"><span>Total</span><span>${total} CDF</span></div>` : ""}
      </div>

      <!-- QR -->
      <div class="qr">
        <img src="${qrBase64}" width="120" />
        <div class="muted">Scan to verify transaction</div>
      </div>

    </div>
  </body>
  </html>
  `;
}