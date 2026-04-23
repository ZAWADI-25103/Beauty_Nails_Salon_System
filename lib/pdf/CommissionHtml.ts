export function CommissionHtml(c: any) {
  const isPaid = c.status === "paid";

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Commission Report</title>

    <style>
      body {
        font-family: 'Inter', sans-serif;
        background: #f4f4f5;
        padding: 40px;
      }

      .container {
        max-width: 900px;
        margin: auto;
        background: white;
        border-radius: 16px;
        padding: 40px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.08);
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
      }

      .badge {
        padding: 8px 16px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: bold;
      }

      .paid {
        background: #dcfce7;
        color: #166534;
      }

      .pending {
        background: #fef3c7;
        color: #92400e;
      }

      .title {
        font-size: 24px;
        font-weight: 700;
      }

      .section {
        margin-top: 25px;
      }

      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .card {
        padding: 16px;
        border-radius: 12px;
        background: #fafafa;
        border: 1px solid #eee;
      }

      .amount {
        font-size: 28px;
        font-weight: bold;
        color: ${isPaid ? "#16a34a" : "#f59e0b"};
      }

      .footer {
        margin-top: 40px;
        text-align: center;
        font-size: 12px;
        color: #777;
      }

      .highlight {
        padding: 20px;
        border-radius: 12px;
        background: ${
          isPaid
            ? "linear-gradient(135deg,#16a34a,#22c55e)"
            : "linear-gradient(135deg,#f59e0b,#fbbf24)"
        };
        color: white;
        text-align: center;
        margin-top: 25px;
      }

    </style>
  </head>

  <body>
    <div class="container">

    <!-- HEADER -->
      <div class="header">
        <div>
            <div class="title">Beauty Nails Management System</div>
            <div class="title">Commission Report</div>
            <div>${c.period}</div>
        </div>
        <div class="badge ${isPaid ? "paid" : "pending"}">
          ${isPaid ? "PAYÉ" : "EN ATTENTE"}
        </div>
      </div>

      <div class="header">
        

        
      </div>

      <div class="section grid">
        <div class="card">
          <strong>Travailleur</strong><br/>
          ${c.worker.user.name}<br/>
          ${c.worker.position}
        </div>

        <div class="card">
          <strong>Configuration</strong><br/>
          Taux: ${c.commissionRate}%<br/>
          Type: ${c.worker.commissionType || "percentage"}<br/>
          Fréquence: ${c.worker.commissionFrequency || "N/A"}
        </div>
      </div>

      <div class="section grid">
        <div class="card">
          <strong>Revenu total</strong><br/>
          ${c.totalRevenue.toLocaleString()} CDF
        </div>

        <div class="card">
          <strong>RDV complétés</strong><br/>
          ${c.appointmentsCount}
        </div>
      </div>

      <div class="section grid">
        <div class="card">
          <strong>Coûts opérationnels</strong><br/>
          ${c.operationalCost.toLocaleString()} CDF
        </div>

        <div class="card">
          <strong>Matériel</strong><br/>
          ${c.materialsCost.toLocaleString()} CDF
        </div>
      </div>

      <div class="section card">
        <strong>Gains entreprise</strong><br/>
        ${c.businessEarnings.toLocaleString()} CDF
      </div>

      <div class="highlight">
        ${
          isPaid
            ? "Paiement effectué avec succès par l'administration"
            : "Cette commission est en attente de paiement"
        }
        <br/>
        <div class="amount">
          ${c.commissionAmount.toLocaleString()} CDF
        </div>
      </div>

      ${
        isPaid
          ? `<div class="section card">
              <strong>Date de paiement</strong><br/>
              ${new Date(c.paidAt).toLocaleString()}
            </div>`
          : ""
      }

      <div class="footer">
        Généré automatiquement • Système ERP K-Corp
      </div>

    </div>
  </body>
  </html>
  `;
};