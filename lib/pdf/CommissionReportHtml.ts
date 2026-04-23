export function CommissionReportHtml(data: {
  commission: any;
  appointments?: Array<{
    id: string;
    serviceName: string;
    clientName: string;
    date: string;
    time: string;
    price: number;
    status: string;
  }>;
}) {
  const { commission, appointments = [] } = data;
  const isPaid = commission.status === "paid";
  const generatedAt = new Date().toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "medium",
  });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Commission Report - ${commission.period}</title>
  <style>
    :root {
      --pink-primary: #ec4899;
      --pink-dark: #be185d;
      --pink-light: #fce7f3;
      --gray-50: #f9fafb;
      --gray-200: #e5e7eb;
      --gray-600: #4b5563;
      --gray-900: #111827;
      --success: #10b981;
      --warning: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #fff;
      color: var(--gray-900);
      line-height: 1.6;
      padding: 24px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(236, 72, 153, 0.15);
      overflow: hidden;
      border: 1px solid var(--pink-light);
    }
    .header {
      background: linear-gradient(135deg, var(--pink-primary), var(--pink-dark));
      color: #fff;
      padding: 32px 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.025em;
    }
    .header .period {
      font-size: 14px;
      opacity: 0.95;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      margin-top: 16px;
      ${isPaid 
        ? "background: rgba(16, 185, 129, 0.15); color: var(--success);" 
        : "background: rgba(245, 158, 11, 0.15); color: var(--warning);"}
    }
    .status-badge::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${isPaid ? "var(--success)" : "var(--warning)"};
    }
    .content { padding: 32px 40px; }
    .section { margin-bottom: 28px; }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--pink-primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--pink-light);
    }
    .worker-card {
      background: var(--gray-50);
      border-radius: 12px;
      padding: 20px;
      border-left: 4px solid var(--pink-primary);
    }
    .worker-name {
      font-size: 18px;
      font-weight: 600;
      color: var(--gray-900);
      margin-bottom: 4px;
    }
    .worker-position {
      font-size: 14px;
      color: var(--gray-600);
    }
    .config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-top: 12px;
    }
    .config-item {
      background: #fff;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid var(--gray-200);
      text-align: center;
    }
    .config-label {
      font-size: 11px;
      color: var(--gray-600);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .config-value {
      font-size: 15px;
      font-weight: 600;
      color: var(--gray-900);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 12px;
    }
    .stat-card {
      background: var(--gray-50);
      padding: 16px;
      border-radius: 12px;
      text-align: center;
      border: 1px solid var(--gray-200);
    }
    .stat-label {
      font-size: 12px;
      color: var(--gray-600);
      margin-bottom: 6px;
    }
    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: var(--pink-dark);
    }
    .commission-amount {
      background: linear-gradient(135deg, var(--pink-light), #fff);
      border: 2px solid var(--pink-primary);
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .commission-label {
      font-size: 14px;
      color: var(--gray-600);
      margin-bottom: 8px;
    }
    .commission-value {
      font-size: 32px;
      font-weight: 800;
      color: var(--pink-dark);
      letter-spacing: -0.025em;
    }
    .proof-section {
      ${isPaid ? "display: none;" : "display: block;"}
      background: #fffefc;
      border: 2px dashed var(--warning);
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .proof-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: var(--warning);
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .proof-title::before {
      content: "📋";
      font-size: 16px;
    }
    .appointments-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .appointments-table th {
      text-align: left;
      padding: 12px 16px;
      background: var(--pink-light);
      color: var(--pink-dark);
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .appointments-table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--gray-200);
      color: var(--gray-900);
    }
    .appointments-table tr:last-child td { border-bottom: none; }
    .appointments-table tr:hover { background: var(--gray-50); }
    .paid-info {
      ${isPaid ? "display: block;" : "display: none;"}
      background: var(--pink-light);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .paid-info .label {
      font-size: 13px;
      color: var(--gray-600);
      margin-bottom: 4px;
    }
    .paid-info .date {
      font-size: 16px;
      font-weight: 600;
      color: var(--pink-dark);
    }
    .footer {
      background: var(--gray-50);
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid var(--gray-200);
      font-size: 12px;
      color: var(--gray-600);
    }
    .footer .disclaimer {
      margin-top: 8px;
      font-style: italic;
      opacity: 0.8;
    }
    .watermark {
      position: fixed;
      bottom: 20px;
      right: 20px;
      font-size: 11px;
      color: var(--pink-primary);
      opacity: 0.3;
      pointer-events: none;
    }
    @media print {
      body { padding: 0; }
      .container { box-shadow: none; border: none; border-radius: 0; }
      .watermark { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>Beauty Nails Management System</h1>
      <div class="period">Commission Report • ${commission.period}</div>
      <div class="status-badge">
        ${isPaid ? "PAYÉ" : "EN ATTENTE DE PAIEMENT"}
      </div>
    </div>

    <div class="content">
      <!-- Worker Info -->
      <div class="section">
        <div class="section-title">Travailleur</div>
        <div class="worker-card">
          <div class="worker-name">${commission.user.name}</div>
          <div class="worker-position">${commission.worker.position}</div>
          <div class="config-grid">
            <div class="config-item">
              <div class="config-label">Taux</div>
              <div class="config-value">${commission.commissionRate}%</div>
            </div>
            <div class="config-item">
              <div class="config-label">Type</div>
              <div class="config-value">${commission.worker.commissionType || "percentage"}</div>
            </div>
            <div class="config-item">
              <div class="config-label">Fréquence</div>
              <div class="config-value">${commission.worker.commissionFrequency || "N/A"}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Financial Summary -->
      <div class="section">
        <div class="section-title">Résumé Financier</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Revenu Total</div>
            <div class="stat-value">${commission.totalRevenue.toLocaleString()} CDF</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Rendez-vous Complétés</div>
            <div class="stat-value">${commission.appointmentsCount}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Coûts Opérationnels</div>
            <div class="stat-value">${commission.operationalCost.toLocaleString()} CDF</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Matériel</div>
            <div class="stat-value">${commission.materialsCost.toLocaleString()} CDF</div>
          </div>
        </div>
        <div class="stat-card" style="margin-top: 16px;">
          <div class="stat-label">Gains Entreprise</div>
          <div class="stat-value">${commission.businessEarnings.toLocaleString()} CDF</div>
        </div>
      </div>

      <!-- Commission Amount -->
      <div class="commission-amount">
        <div class="commission-label">Montant de Commission</div>
        <div class="commission-value">${commission.commissionAmount.toLocaleString()} CDF</div>
      </div>

      <!-- Payment Status -->
      ${isPaid 
        ? `
        <div class="paid-info">
          <div class="label">✅ Paiement effectué avec succès par l'administration</div>
          <div class="date">${new Date(commission.paidAt).toLocaleString("fr-FR")}</div>
        </div>` 
        : `
        <div class="proof-section">
          <div class="proof-title">Preuve d'Achèvement des Services</div>
          <p style="font-size:13px;color:var(--gray-600);margin-bottom:16px;">
            Ce document sert de preuve officielle que les services ci-dessous ont été complétés par le travailleur. 
            Le paiement de la commission est en attente de traitement.
          </p>
          <table class="appointments-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Client</th>
                <th>Date</th>
                <th>Heure</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              ${appointments.map(apt => `
                <tr>
                  <td><strong>${apt.serviceName}</strong></td>
                  <td>${apt.clientName}</td>
                  <td>${new Date(apt.date).toLocaleDateString("fr-FR")}</td>
                  <td>${apt.time}</td>
                  <td style="text-align:right;font-weight:600;">${apt.price.toLocaleString()} CDF</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>`
      }

      <!-- Paid At (if applicable) -->
      ${isPaid && commission.paidAt ? `
        <div style="text-align:center;margin-top:20px;font-size:13px;color:var(--gray-600);">
          Référence de paiement: <strong style="color:var(--pink-dark);">${commission.id.slice(-8).toUpperCase()}</strong>
        </div>` : ""}
    </div>

    <!-- Footer -->
    <div class="footer">
      <div><strong>Généré automatiquement</strong> • Système ERP K-Corp</div>
      <div class="disclaimer">Document généré le ${generatedAt} • Toute reproduction non autorisée est interdite</div>
      ${!isPaid ? `<div style="margin-top:8px;color:var(--warning);font-weight:500;">⚠️ Ce document ne constitue pas un reçu de paiement</div>` : ""}
    </div>
  </div>
  
  <div class="watermark">K-Corp • Confidential</div>
</body>
</html>
  `;
}