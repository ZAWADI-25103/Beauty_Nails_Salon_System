interface AppointmentData {
  id: string;
  serviceName: string;
  clientName: string;
  date: string;
  time: string;
  price: number;
  status: string;
}

interface CommissionHtmlProps {
  worker: {
    name: string;
    position: string;
    commissionType?: string;
    commissionFrequency?: string;
    commissionDay?: number;
  };
  periodLabel: string;
  periodRange: { from: string; to: string };
  aggregated: {
    totalRevenue: number;
    commissionAmount: number;
    businessEarnings: number;
    materialsCost: number;
    operationalCost: number;
    appointmentsCount: number;
    commissionRate: number;
    pendingCount: number;
    paidCount: number;
  };
  appointments: AppointmentData[];
  generatedAt: string;
  isWithinPaymentWindow: boolean;
  nextPaymentDate?: string;
}

export function CommissionReportHtmlV2(data: CommissionHtmlProps) {
  const {
    worker,
    periodLabel,
    periodRange,
    aggregated,
    appointments,
    generatedAt,
    isWithinPaymentWindow,
    nextPaymentDate,
  } = data;

  const hasPending = aggregated.pendingCount > 0;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Rapport de Commission • ${worker.name}</title>
  <style>
    :root {
      --pink-50: #fdf2f8;
      --pink-100: #fce7f3;
      --pink-200: #fbcfe8;
      --pink-400: #f472b6;
      --pink-500: #ec4899;
      --pink-600: #db2777;
      --pink-700: #be185d;
      --gray-50: #f9fafb;
      --gray-100: #f3f4f6;
      --gray-200: #e5e7eb;
      --gray-400: #9ca3af;
      --gray-600: #4b5563;
      --gray-700: #374151;
      --gray-900: #111827;
      --success-bg: #ecfdf5;
      --success-text: #065f46;
      --warning-bg: #fffbeb;
      --warning-text: #92400e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #fff;
      color: var(--gray-900);
      line-height: 1.6;
      padding: 20px;
    }
    .container {
      max-width: 850px;
      margin: 0 auto;
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(236, 72, 153, 0.12);
      overflow: hidden;
      border: 1px solid var(--pink-100);
    }
    .header {
      background: linear-gradient(135deg, var(--pink-500), var(--pink-700));
      color: #fff;
      padding: 36px 40px 28px;
      text-align: center;
      position: relative;
    }
    .header::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    }
    .header h1 {
      font-size: 26px;
      font-weight: 800;
      margin-bottom: 6px;
      letter-spacing: -0.02em;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header .subtitle {
      font-size: 14px;
      opacity: 0.95;
      font-weight: 400;
    }
    .header .period-badge {
      display: inline-block;
      margin-top: 14px;
      padding: 6px 20px;
      background: rgba(255,255,255,0.15);
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 500;
      backdrop-filter: blur(4px);
    }
    .content { padding: 32px 40px; }
    .section { margin-bottom: 28px; }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--pink-600);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 2px solid var(--pink-100);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title::before {
      content: "";
      width: 4px;
      height: 16px;
      background: var(--pink-500);
      border-radius: 2px;
    }
    .worker-card {
      background: linear-gradient(135deg, var(--pink-50), #fff);
      border-radius: 16px;
      padding: 20px 24px;
      border: 1px solid var(--pink-200);
      border-left: 4px solid var(--pink-500);
    }
    .worker-name {
      font-size: 20px;
      font-weight: 700;
      color: var(--gray-900);
      margin-bottom: 4px;
    }
    .worker-position {
      font-size: 14px;
      color: var(--gray-600);
      margin-bottom: 12px;
    }
    .config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 10px;
    }
    .config-item {
      background: #fff;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid var(--gray-200);
      text-align: center;
      transition: border-color 0.2s;
    }
    .config-item:hover { border-color: var(--pink-400); }
    .config-label {
      font-size: 11px;
      color: var(--gray-600);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .config-value {
      font-size: 16px;
      font-weight: 700;
      color: var(--pink-700);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      margin-top: 8px;
    }
    .stat-card {
      background: var(--gray-50);
      padding: 16px 18px;
      border-radius: 14px;
      text-align: center;
      border: 1px solid var(--gray-200);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .stat-label {
      font-size: 12px;
      color: var(--gray-600);
      margin-bottom: 6px;
      font-weight: 500;
    }
    .stat-value {
      font-size: 22px;
      font-weight: 800;
      color: var(--pink-700);
      letter-spacing: -0.02em;
    }
    .stat-value.small { font-size: 18px; }
    .commission-highlight {
      background: linear-gradient(135deg, var(--pink-100), var(--pink-50));
      border: 2px solid var(--pink-400);
      border-radius: 18px;
      padding: 24px 28px;
      text-align: center;
      margin: 28px 0;
      position: relative;
      overflow: hidden;
    }
    .commission-highlight::before {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%);
      pointer-events: none;
    }
    .commission-label {
      font-size: 14px;
      color: var(--gray-700);
      margin-bottom: 10px;
      font-weight: 600;
      position: relative;
    }
    .commission-value {
      font-size: 36px;
      font-weight: 900;
      color: var(--pink-700);
      letter-spacing: -0.03em;
      position: relative;
      text-shadow: 0 2px 4px rgba(236,72,153,0.1);
    }
    .commission-sub {
      font-size: 13px;
      color: var(--gray-600);
      margin-top: 8px;
      position: relative;
    }
    .status-banner {
      ${hasPending 
        ? `background: var(--warning-bg); border: 2px dashed #fcd34d; color: var(--warning-text);` 
        : `background: var(--success-bg); border: 2px solid #6ee7b7; color: var(--success-text);`}
      border-radius: 14px;
      padding: 18px 22px;
      margin: 24px 0;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      font-size: 14px;
      line-height: 1.5;
    }
    .status-banner .icon {
      font-size: 20px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .proof-section {
      ${!hasPending ? "display:none;" : "display:block;"}
      background: #fff;
      border: 2px solid var(--pink-200);
      border-radius: 16px;
      padding: 20px;
      margin: 24px 0;
    }
    .proof-header {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 700;
      color: var(--pink-700);
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px dashed var(--pink-200);
    }
    .proof-header::before {
      content: "📋";
      font-size: 18px;
    }
    .proof-description {
      font-size: 13px;
      color: var(--gray-600);
      margin-bottom: 16px;
      line-height: 1.5;
    }
    .appointments-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .appointments-table th {
      text-align: left;
      padding: 12px 14px;
      background: var(--pink-50);
      color: var(--pink-700);
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border-bottom: 2px solid var(--pink-200);
    }
    .appointments-table td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--gray-200);
      color: var(--gray-900);
      vertical-align: middle;
    }
    .appointments-table tr:last-child td { border-bottom: none; }
    .appointments-table tr:hover { background: var(--pink-50); }
    .appointments-table .service-name {
      font-weight: 600;
      color: var(--pink-700);
    }
    .appointments-table .amount {
      text-align: right;
      font-weight: 700;
      color: var(--gray-900);
      white-space: nowrap;
    }
    .payment-info {
      ${hasPending ? "display:none;" : "display:block;"}
      background: var(--success-bg);
      border-radius: 14px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
      border: 1px solid #6ee7b7;
    }
    .payment-info .label {
      font-size: 14px;
      color: var(--success-text);
      margin-bottom: 6px;
      font-weight: 600;
    }
    .payment-info .date {
      font-size: 15px;
      font-weight: 700;
      color: var(--gray-900);
    }
    .payment-window {
      background: var(--gray-50);
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
      border-left: 4px solid var(--pink-400);
    }
    .payment-window-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--gray-700);
      margin-bottom: 8px;
    }
    .payment-window-dates {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: var(--gray-600);
    }
    .payment-window-dates span {
      font-weight: 600;
      color: var(--pink-700);
    }
    .footer {
      background: var(--gray-50);
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid var(--gray-200);
      font-size: 12px;
      color: var(--gray-600);
    }
    .footer .generated {
      font-weight: 600;
      color: var(--gray-900);
      margin-bottom: 6px;
    }
    .footer .disclaimer {
      font-style: italic;
      opacity: 0.85;
      line-height: 1.4;
    }
    .footer .warning {
      margin-top: 10px;
      color: var(--warning-text);
      font-weight: 500;
      ${!hasPending ? "display:none;" : "display:block;"}
    }
    .watermark {
      position: fixed;
      bottom: 16px;
      right: 20px;
      font-size: 11px;
      color: var(--pink-400);
      opacity: 0.25;
      pointer-events: none;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    @media print {
      body { padding: 0; background: #fff; }
      .container { box-shadow: none; border: none; border-radius: 0; }
      .watermark { display: none; }
      .stat-card:hover { transform: none; box-shadow: none; }
    }
    @media (max-width: 640px) {
      .content { padding: 24px 20px; }
      .header { padding: 28px 24px 22px; }
      .stats-grid { grid-template-columns: 1fr; }
      .appointments-table { font-size: 12px; }
      .appointments-table th,
      .appointments-table td { padding: 10px 8px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>Beauty Nails Management System</h1>
      <div class="subtitle">Rapport de Commission • ${periodLabel}</div>
      <div class="period-badge">
        ${periodRange.from} → ${periodRange.to}
      </div>
    </div>

    <div class="content">
      <!-- Worker Info -->
      <div class="section">
        <div class="section-title">Travailleur</div>
        <div class="worker-card">
          <div class="worker-name">${worker.name}</div>
          <div class="worker-position">${worker.position}</div>
          <div class="config-grid">
            <div class="config-item">
              <div class="config-label">Taux</div>
              <div class="config-value">${aggregated.commissionRate}%</div>
            </div>
            <div class="config-item">
              <div class="config-label">Type</div>
              <div class="config-value">${worker.commissionType || "percentage"}</div>
            </div>
            <div class="config-item">
              <div class="config-label">Fréquence</div>
              <div class="config-value">${worker.commissionFrequency || "daily"}</div>
            </div>
            ${worker.commissionDay ? `
            <div class="config-item">
              <div class="config-label">Jour de paiement</div>
              <div class="config-value">${worker.commissionDay}</div>
            </div>` : ''}
          </div>
        </div>
      </div>

      <!-- Payment Window Info -->
      <div class="payment-window">
        <div class="payment-window-title">📅 Fenêtre de Paiement</div>
        <div class="payment-window-dates">
          <div>Début: <span>${periodRange.from}</span></div>
          <div>Fin: <span>${periodRange.to}</span></div>
        </div>
        ${nextPaymentDate ? `
        <div style="margin-top:10px;font-size:13px;color:var(--pink-700);font-weight:600;">
          🎯 Prochain paiement prévu: ${nextPaymentDate}
        </div>` : ''}
      </div>

      <!-- Financial Summary -->
      <div class="section">
        <div class="section-title">Résumé Financier Agrégé</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Revenu Total</div>
            <div class="stat-value">${aggregated.totalRevenue.toLocaleString()} CDF</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">RDV Complétés</div>
            <div class="stat-value">${aggregated.appointmentsCount}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">En Attente</div>
            <div class="stat-value small" style="color:var(--warning-text)">${aggregated.pendingCount}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Payés</div>
            <div class="stat-value small" style="color:var(--success-text)">${aggregated.paidCount}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Coûts Opérationnels</div>
            <div class="stat-value small">${aggregated.operationalCost.toLocaleString()} CDF</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Matériel</div>
            <div class="stat-value small">${aggregated.materialsCost.toLocaleString()} CDF</div>
          </div>
        </div>
        <div class="stat-card" style="margin-top:14px;">
          <div class="stat-label">Gains Entreprise (Net)</div>
          <div class="stat-value">${aggregated.businessEarnings.toLocaleString()} CDF</div>
        </div>
      </div>

      <!-- Commission Amount -->
      <div class="commission-highlight">
        <div class="commission-label">Montant Total de Commission</div>
        <div class="commission-value">${aggregated.commissionAmount.toLocaleString()} CDF</div>
        <div class="commission-sub">
          ${aggregated.pendingCount > 0 
            ? `Dont ${aggregated.pendingCount} commission(s) en attente de paiement` 
            : '✓ Toutes les commissions de cette période ont été payées'}
        </div>
      </div>

      <!-- Status Banner -->
      <div class="status-banner">
        <span class="icon">${hasPending ? '⏳' : '✅'}</span>
        <div>
          ${hasPending
            ? `<strong>Commission en attente :</strong> Ce document sert de preuve officielle que les ${aggregated.appointmentsCount} prestations listées ci-dessous ont été complétées par ${worker.name}. Le paiement de ${aggregated.commissionAmount.toLocaleString()} CDF sera effectué selon la fréquence configurée (${worker.commissionFrequency || 'daily'}).`
            : `<strong>Paiement confirmé :</strong> Toutes les commissions de cette période ont été réglées avec succès par l'administration.`
          }
        </div>
      </div>

      <!-- Proof of Completion (Only if pending) -->
      ${hasPending ? `
      <div class="proof-section">
        <div class="proof-header">Preuve d'Achèvement des Prestations</div>
        <p class="proof-description">
          Les services suivants ont été complétés par <strong>${worker.name}</strong> durant la période indiquée. 
          Ce document peut être utilisé comme justificatif en attendant le traitement du paiement.
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
                <td><span class="service-name">${apt.serviceName}</span></td>
                <td>${apt.clientName}</td>
                <td>${new Date(apt.date).toLocaleDateString("fr-FR", { 
                  day: '2-digit', month: 'short', year: 'numeric' 
                })}</td>
                <td>${apt.time}</td>
                <td class="amount">${apt.price.toLocaleString()} CDF</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>` : ''}

      <!-- Paid Confirmation -->
      ${!hasPending && aggregated.paidCount > 0 ? `
      <div class="payment-info">
        <div class="label">✅ Paiement effectué avec succès</div>
        <div class="date">Dernier paiement: ${new Date().toLocaleDateString("fr-FR", {
          day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })}</div>
      </div>` : ''}
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="generated">📄 Généré automatiquement • Système ERP K-Corp</div>
      <div class="disclaimer">
        Document généré le ${generatedAt}<br/>
        Toute reproduction non autorisée est interdite • Réf: COMM-${Date.now().toString(36).toUpperCase()}
      </div>
      ${hasPending ? `
      <div class="warning">
        ⚠️ Ce document ne constitue pas un reçu de paiement — il atteste uniquement de l'achèvement des services
      </div>` : ''}
    </div>
  </div>
  
  <div class="watermark">K-Corp • Confidential</div>
</body>
</html>
  `;
}