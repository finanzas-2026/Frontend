// Entornos y almacenamiento de la demo: docs/decisions/0001-demo-api-environments.md
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const Decimal = require('decimal.js');
const { build } = require('esbuild');
const jsonServer = require('json-server');

const money = (value) => new Decimal(value).toFixed(2);
const sum = (values) => values.reduce((total, value) => total.plus(value), new Decimal(0));
const nextId = (rows) => Math.max(0, ...rows.map((row) => row.id)) + 1;
const dateOnly = (date) => date.toISOString().slice(0, 10);
const seed = (name) => JSON.parse(readFileSync(join(__dirname, name), 'utf8'));
const fail = (message, status = 422) => { throw Object.assign(new Error(message), { status }); };

async function start() {
  const bundle = await build({
    entryPoints: [join(__dirname, '../src/app/financing/domain/rules/french-amortization.rule.ts'),
      join(__dirname, '../src/app/financing/domain/rules/french-rate-normalization.ts')],
    bundle: true, write: false, format: 'esm', platform: 'node', outdir: 'finance',
  });
  const [schedule, rates] = await Promise.all(bundle.outputFiles.map((file) =>
    import('data:text/javascript;base64,' + Buffer.from(file.contents).toString('base64'))));
  const db = seed('db.json');
  for (const customer of db.customers) {
    for (const prefix of ['compensatory', 'penalty']) {
      const period = { TEM: 30, TED: 1 }[customer[prefix + '_rate_type']];
      if (period) {
        customer[prefix + '_rate_type'] = 'EFECTIVA';
        customer[prefix + '_rate_period_days'] = period;
        customer[prefix + '_capitalization_days'] = null;
      }
    }
  }
  const legacyMonthly = db.sales.find((sale) => sale.payment_mode === 'SINGLE_CREDIT');
  if (legacyMonthly) legacyMonthly.settlement_id = 2;
  const router = jsonServer.router(db);
  const app = jsonServer.create();
  let now = new Date('2026-11-26T12:00:00Z');
  const names = (customer) => {
    const user = db.users.find((row) => row.id === customer?.user_id);
    return user ? [user.first_name, user.last_name].join(' ') : 'Venta sin ficha';
  };
  const pact = (customer, prefix) => ({
    rateType: customer?.[prefix + '_rate_type'],
    rateValue: customer?.[prefix + '_rate_value'],
    ratePeriodDays: customer?.[prefix + '_rate_period_days'],
    compoundingDays: customer?.[prefix + '_capitalization_days'] ?? undefined,
  });
  function today() { return dateOnly(now); }
  function customerById(id) { return db.customers.find((row) => row.id === id); }
  function paymentMode(mode) {
    return { MONTHLY_INSTALLMENTS: 'FINANCIADO_CUOTAS', SINGLE_CREDIT: 'FINANCIADO_MENSUAL' }[mode] ?? mode;
  }
  function debt(customerId) {
    const pending = db.amortization_schedules.filter((item) =>
      item.installment_status !== 'PAID' && db.sales.some((sale) =>
        sale.id === item.sale_id && sale.customer_id === customerId));
    const monthly = db.sales.filter((sale) => sale.customer_id === customerId &&
      paymentMode(sale.payment_mode) === 'FINANCIADO_MENSUAL' &&
      !db.monthly_settlements.some((row) => row.id === sale.settlement_id && row.settlement_status === 'PAID'));
    return sum([...pending.map((row) => row.principal_amount), ...monthly.map((row) => row.total_amount)]);
  }
  function projectedCustomer(customer) {
    return { id: customer.id, full_name: names(customer), document_number: String(customer.id),
      credit_limit: money(customer.credit_limit), current_debt: money(debt(customer.id)),
      allows_monthly_payments: true, max_credit_months: customer.max_credit_months,
      compensatory_rate_type: customer.compensatory_rate_type,
      compensatory_rate_value: String(customer.compensatory_rate_value),
      compensatory_rate_period_days: customer.compensatory_rate_period_days,
      compensatory_capitalization_days: customer.compensatory_capitalization_days };
  }
  function saleView(sale) {
    return { ...sale, code: 'VTA-' + sale.id, issue_date: sale.sale_datetime, status: sale.sale_status,
      payment_mode: paymentMode(sale.payment_mode), total_amount: money(sale.total_amount),
      customer_name: names(customerById(sale.customer_id)),
      installments_count: sale.number_of_months || undefined,
      details: db.sale_details.filter((item) => item.sale_id === sale.id).map((item) => ({
        ...item, product_name: db.products.find((row) => row.id === item.product_id)?.name ?? 'Producto',
        sku: String(item.product_id), unit_price: money(item.unit_price), subtotal: money(item.subtotal),
      })) };
  }
  function visible(req, customer) {
    return customer && customer.store_id === req.actor.store_id &&
      (req.actor.user_type !== 'CUSTOMER' || customer.user_id === req.actor.id);
  }
  function storeSales(req) {
    return db.sales.filter((sale) => sale.store_id === req.actor.store_id &&
      (req.actor.user_type !== 'CUSTOMER' || visible(req, customerById(sale.customer_id))));
  }
  function settlementRows(req) {
    return db.monthly_settlements.filter((row) => visible(req, customerById(row.customer_id)));
  }
  function getSettlement(req) {
    return settlementRows(req).find((row) => row.id === Number(req.params.id)) ?? fail('Liquidación no encontrada.', 404);
  }
  function cutoffDate(row) { return row.cutoff_date ?? row.cutoff_Date; }
  function quote(row) {
    const days = Math.max(0, Math.floor((Date.parse(today()) - Date.parse(row.payment_due_date)) / 86400000));
    const previous = db.payments.find((item) => item.settlement_id === row.id);
    const interest = new Decimal(row.compensatory_interest_amount);
    const principal = new Decimal(row.total_amount_due).minus(interest);
    const moratorium = previous ? previous.allocated_to_penalty : days === 0 ? 0 :
      rates.calculateOverdueInterest(principal.toString(),
        rates.normalizeRates(row.penalty_pact ?? pact(customerById(row.customer_id), 'penalty')).tea, days);
    const fee = new Decimal(money(moratorium));
    return { settlement_id: row.id, calculation_date: today(),
      days_overdue: previous?.calculated_overdue_days ?? days, overdue_principal: money(principal),
      compensatory_interest: money(interest), moratorium_interest: money(fee),
      total_payoff_amount: money(principal.plus(interest).plus(fee)) };
  }
  function settlementView(row) {
    const current = quote(row);
    const paid = db.payments.find((item) => item.settlement_id === row.id);
    return { id: row.id, code: 'LIQ-' + row.id, customer_id: row.customer_id,
      customer_name: names(customerById(row.customer_id)), cutoff_date: cutoffDate(row),
      due_date: row.payment_due_date, principal_amount: current.overdue_principal,
      compensatory_interest: current.compensatory_interest, penalty_amount: current.moratorium_interest,
      total_due: current.total_payoff_amount, status: paid ? 'PAID' : current.days_overdue ? 'OVERDUE' : 'PENDING',
      paid_date: paid?.payment_datetime };
  }
  function periodDate(year, month, day) {
    const date = new Date(Date.UTC(year, month, 1));
    const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, last));
    return dateOnly(date);
  }
  function customerCycle(customer, tradeDate) {
    const date = new Date(tradeDate);
    const month = date.getUTCMonth() + Number(date.getUTCDate() > customer.cutoff_day);
    const year = date.getUTCFullYear();
    return { cutoff: periodDate(year, month, customer.cutoff_day),
      due: periodDate(year, month + Number(customer.payment_due_day <= customer.cutoff_day), customer.payment_due_day) };
  }
  function financedDueDate(cycle, grace) {
    return schedule.formatDate(schedule.addCommercialMonths(new Date(cycle.due), Math.ceil(grace / 30)));
  }
  function createSale(req) {
    const body = req.body;
    const customer = customerById(body.customer_id);
    const mode = body.payment_mode;
    if (!visible(req, customer) || req.actor.store_id !== body.store_id) fail('Cliente o tienda inválidos.', 403);
    if (!['CONTADO', 'FINANCIADO_MENSUAL', 'FINANCIADO_CUOTAS'].includes(mode) ||
        !Array.isArray(body.details) || !body.details.length) fail('Venta inválida.');
    const quantities = new Map();
    const prices = new Map();
    for (const item of body.details) {
      if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) fail('Cantidad inválida.');
      quantities.set(item.product_id, (quantities.get(item.product_id) ?? 0) + item.quantity);
      if (item.unit_price !== undefined) prices.set(item.product_id, item.unit_price);
    }
    const id = nextId(db.sales);
    const lines = [...quantities].map(([productId, quantity], index) => {
      const product = db.products.find((entry) => entry.id === productId &&
        entry.store_id === customer.store_id && entry.status === 'ACTIVE');
      if (!product || product.current_stock < quantity) fail('Existencias insuficientes.', 409);
      if (mode === 'FINANCIADO_MENSUAL' && !product.allows_monthly_payments) fail('Producto sin crédito mensual.');
      const price = mode === 'CONTADO' ? product.cash_price : product.credit_list_price;
      if (prices.has(productId) && prices.get(productId) !== money(price)) {
        fail('El precio cambió. Actualiza el catálogo antes de confirmar.', 409);
      }
      return { id: nextId(db.sale_details) + index, sale_id: id, product_id: productId,
        quantity, unit_price: money(price), subtotal: money(new Decimal(price).times(quantity)) };
    });
    const total = sum(lines.map((line) => line.subtotal));
    if (mode !== 'CONTADO' && debt(customer.id).plus(total).gt(customer.credit_limit)) fail('Cupo insuficiente.', 409);
    const terms = mode === 'FINANCIADO_CUOTAS' ? body.installments_count : mode === 'CONTADO' ? 0 : 1;
    if (!Number.isInteger(terms) || terms > customer.max_credit_months ||
        (mode === 'FINANCIADO_CUOTAS' && terms < 1)) fail('Plazo fuera de la ficha crediticia.');
    const conditions = mode === 'CONTADO' ? null : pact(customer, 'compensatory');
    const penalty = mode === 'CONTADO' ? null : pact(customer, 'penalty');
    if (penalty) rates.normalizeRates(penalty);
    if (conditions) rates.normalizeRates(conditions);
    const cycle = customerCycle(customer, today());
    const grace = body.grace_days ?? 0;
    const firstDueDate = financedDueDate(cycle, grace);
    const plan = mode === 'FINANCIADO_CUOTAS' ? schedule.calculateFrenchSchedule({
      ...conditions, initialCapital: total.toFixed(2), totalInstallments: terms, graceDays: grace, firstDueDate,
    }) : null;
    if (plan && (body.tea !== plan.tea || body.first_due_date !== firstDueDate)) {
      fail('Las condiciones cambiaron. Vuelve a calcular la vista previa.', 409);
    }
    const sale = { id, store_id: customer.store_id, customer_id: customer.id, sale_datetime: now.toISOString(),
      total_amount: money(total), payment_mode: mode, number_of_months: terms, sale_status: 'COMPLETED',
      grace_days: grace, tea: plan?.tea, compensatory_pact: conditions, penalty_pact: penalty };
    const firstInstallmentId = nextId(db.amortization_schedules);
    const installments = (plan?.installments ?? []).filter((row) => !row.is_grace_period).map((row, index) => ({
      id: firstInstallmentId + index, sale_id: id, installment_number: row.installment_number,
      due_date: row.due_date, principal_amount: row.principal_amount, compensatory_interest: row.interest_amount,
      fixed_installment: row.payment_amount, ending_balance: row.balance_amount, installment_status: 'PENDING',
      cutoff_date: schedule.formatDate(schedule.addCommercialMonths(new Date(cycle.cutoff), index + Math.ceil(grace / 30))),
    }));
    for (const line of lines) db.products.find((row) => row.id === line.product_id).current_stock -= line.quantity;
    db.sales.push(sale);
    db.sale_details.push(...lines);
    db.amortization_schedules.push(...installments);
    return saleView(sale);
  }
  function runCutoff(req) {
    const drafts = [];
    let nextSettlement = nextId(db.monthly_settlements);
    for (const customer of db.customers.filter((row) => visible(req, row))) {
      const sales = storeSales(req).filter((row) => row.customer_id === customer.id);
      const installments = db.amortization_schedules.filter((row) =>
        !row.settlement_id && row.cutoff_date < today() && sales.some((sale) => sale.id === row.sale_id));
      const monthly = sales.filter((row) =>
        paymentMode(row.payment_mode) === 'FINANCIADO_MENSUAL' && !row.settlement_id &&
        customerCycle(customer, row.sale_datetime).cutoff < today());
      const periods = new Set([...installments.map((row) => row.cutoff_date),
        ...monthly.map((row) => customerCycle(customer, row.sale_datetime).cutoff)]);
      for (const cutoff of periods) {
        if (db.monthly_settlements.some((row) => row.customer_id === customer.id && cutoffDate(row) === cutoff)) continue;
        const selected = installments.filter((row) => row.cutoff_date === cutoff);
        const purchases = monthly.filter((row) => customerCycle(customer, row.sale_datetime).cutoff === cutoff);
        const purchasesTotal = sum(purchases.map((row) => row.total_amount));
        const installmentsTotal = sum(selected.map((row) => row.fixed_installment));
        if (purchasesTotal.plus(installmentsTotal).isZero()) continue;
        const due = customerCycle(customer, cutoff).due;
        const snapshots = [...new Set([...selected.map((row) => sales.find((sale) => sale.id === row.sale_id)),
          ...purchases].map((sale) => JSON.stringify(sale.penalty_pact)))];
        if (snapshots.length !== 1 || snapshots[0] === undefined) fail('El período contiene pactos moratorios distintos.');
        const row = { id: nextSettlement++, customer_id: customer.id, cutoff_date: cutoff,
          period_year: Number(cutoff.slice(0, 4)), period_month: Number(cutoff.slice(5, 7)),
          payment_due_date: due, month_purchases_amount: money(purchasesTotal),
          month_installments_amount: money(installmentsTotal),
          compensatory_interest_amount: money(sum(selected.map((item) => item.compensatory_interest))),
          total_amount_due: money(purchasesTotal.plus(installmentsTotal)), settlement_status: 'PENDING',
          paid_amount: '0.00', pending_balance: money(purchasesTotal.plus(installmentsTotal)),
          penalty_pact: JSON.parse(snapshots[0]), };
        drafts.push({ row, related: [...selected, ...purchases] });
      }
    }
    for (const { row, related } of drafts) {
      db.monthly_settlements.push(row);
      for (const item of related) item.settlement_id = row.id;
    }
    return { message: 'Cierre ejecutado', generatedCount: drafts.length };
  }
  function paymentView(item, row) {
    return { id: item.id, code: 'PAG-' + item.id, settlement_id: row.id, customer_id: row.customer_id,
      amount: money(item.amount_paid), payment_date: item.payment_datetime, payment_method: item.payment_method,
      reference_number: item.reference_number, receipt_number: 'REC-' + item.id };
  }
  function pay(req) {
    const row = getSettlement(req);
    const existing = db.payments.find((item) => item.settlement_id === row.id);
    const { amount, payment_method, reference_number } = req.body;
    if (!/^\d+\.\d{2}$/.test(amount) || !['EFECTIVO', 'TRANSFERENCIA', 'YAPE'].includes(payment_method)) {
      fail('Importe o medio de pago inválido.');
    }
    if (existing) {
      if (money(existing.amount_paid) !== amount || existing.payment_method !== payment_method ||
          existing.reference_number !== reference_number) fail('La liquidación ya tiene un pago registrado.', 409);
      return paymentView(existing, row);
    }
    const current = quote(row);
    if (current.total_payoff_amount !== amount) fail('El pago debe coincidir con la cotización vigente.');
    const item = { id: nextId(db.payments), settlement_id: row.id, payment_datetime: now.toISOString(),
      amount_paid: amount, payment_method, reference_number, calculated_overdue_days: current.days_overdue,
      allocated_to_penalty: current.moratorium_interest, allocated_to_interest: current.compensatory_interest,
      allocated_to_principal: current.overdue_principal };
    db.payments.push(item);
    Object.assign(row, { settlement_status: 'PAID', paid_amount: amount, pending_balance: '0.00',
      penalty_interest_amount: current.moratorium_interest });
    for (const installment of db.amortization_schedules.filter((entry) => entry.settlement_id === row.id)) {
      installment.installment_status = 'PAID';
    }
    return paymentView(item, row);
  }
  function dashboard(req) {
    const active = settlementRows(req).filter((row) => row.settlement_status !== 'PAID').map(settlementView);
    const overdue = active.filter((row) => row.status === 'OVERDUE');
    const total = sum(active.map((row) => row.total_due));
    const delinquent = sum(overdue.map((row) => row.total_due));
    return { total_revenue: money(sum(storeSales(req).map((row) => row.total_amount))),
      overdue_portfolio: money(delinquent), active_accounts: new Set(active.map((row) => row.customer_id)).size,
      default_rate: total.isZero() ? '0.0000000' : delinquent.div(total).toFixed(7) };
  }
  function movements(req) {
    const sales = storeSales(req).map((row) => ({ id: row.id * 3, timestamp: row.sale_datetime, event_type: 'SALE_CREATED',
      customer_name: names(customerById(row.customer_id)), amount: money(row.total_amount), description: 'Venta VTA-' + row.id }));
    const settlements = settlementRows(req);
    const cutoffs = settlements.map((row) => ({ id: row.id * 3 + 1, timestamp: cutoffDate(row) + 'T12:00:00Z', event_type: 'SETTLEMENT_CUTOFF',
      customer_name: names(customerById(row.customer_id)), amount: money(row.total_amount_due), description: 'Cierre LIQ-' + row.id }));
    const payments = db.payments.flatMap((row) => {
      const settlement = settlements.find((item) => item.id === row.settlement_id);
      return settlement ? [{ id: row.id * 3 + 2, timestamp: row.payment_datetime, event_type: 'PAYMENT_RECEIVED',
        customer_name: names(customerById(settlement.customer_id)), amount: money(row.amount_paid),
        description: 'Recibo REC-' + row.id }] : [];
    });
    return [...sales, ...cutoffs, ...payments]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
  function monthlyFlows(req) {
    const events = movements(req);
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), index, 1));
      const entries = events.filter((row) => row.timestamp.startsWith(dateOnly(date).slice(0, 7)));
      const amount = (type) => money(sum(entries.filter((row) => row.event_type === type).map((row) => row.amount)));
      return { month: new Intl.DateTimeFormat('es-PE', { month: 'short', timeZone: 'UTC' }).format(date),
        sales_amount: amount('SALE_CREATED'), collected_amount: amount('PAYMENT_RECEIVED') };
    });
  }
  function endpoint(method, path, handler, { status = 200, roles = ['STORE_ADMIN', 'SUPER_ADMIN'] } = {}) {
    app[method]('/api/v1' + path, (req, res) => {
      try {
        req.actor = db.users.find((user) => user.id === Number(req.get('X-Demo-User-Id')) && user.status === 'ACTIVE');
        if (roles && (!req.actor || !roles.includes(req.actor.user_type))) fail('Acceso no disponible para esta sesión de demo.', 403);
        res.status(status).json(handler(req));
      } catch (error) {
        res.status(error.status ?? 422).json({ code: 'DEMO_OPERATION_REJECTED', message: error.message });
      }
    });
  }
  const customerSession = ['STORE_ADMIN', 'SUPER_ADMIN', 'CUSTOMER'];
  app.use(jsonServer.defaults({ logger: false }));
  app.use(jsonServer.bodyParser);
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  endpoint('post', '/finance/simulate', (req) => {
    const body = req.body;
    let terms = { rateValue: body.rate_value, rateType: body.rate_type,
      ratePeriodDays: body.rate_period_days, compoundingDays: body.compounding_days };
    let firstDueDate = body.first_due_date ?? customerCycle({ cutoff_day: 25, payment_due_day: 5 }, today()).due;
    if (body.customer_id !== undefined) {
      const customer = customerById(body.customer_id);
      if (!req.actor || !visible(req, customer)) fail('Ficha no disponible.', 403);
      terms = pact(customer, 'compensatory');
      firstDueDate = financedDueDate(customerCycle(customer, today()), body.grace_days ?? 0);
    }
    return schedule.calculateFrenchSchedule({
      ...terms, initialCapital: body.initial_capital, totalInstallments: body.total_installments,
      graceDays: body.grace_days, firstDueDate,
    });
  }, { roles: null });
  endpoint('get', '/sales/customers', (req) => db.customers.filter((row) => visible(req, row)).map(projectedCustomer));
  endpoint('get', '/catalog/products', (req) => db.products.filter((row) =>
    row.store_id === req.actor.store_id && row.status === 'ACTIVE').map((row) => ({
    id: row.id, name: row.name, sku: String(row.id), category: row.brand ?? '',
    unit_price: money(row.cash_price), allows_monthly_payments: row.allows_monthly_payments, credit_unit_price: money(row.credit_list_price), stock: row.current_stock,
  })));
  endpoint('get', '/sales', (req) => storeSales(req).map(saleView));
  endpoint('get', '/sales/:id', (req) => saleView(storeSales(req).find((row) =>
    row.id === Number(req.params.id)) ?? fail('Venta no encontrada.', 404)));
  endpoint('post', '/sales', createSale, { status: 201 });
  endpoint('get', '/settlements', (req) => settlementRows(req).map(settlementView), { roles: customerSession });
  endpoint('get', '/settlements/:id', (req) => settlementView(getSettlement(req)), { roles: customerSession });
  endpoint('get', '/settlements/:id/payoff-quote', (req) => quote(getSettlement(req)));
  endpoint('post', '/settlements/:id/pay', pay);
  endpoint('post', '/settlements/cutoff', runCutoff);
  endpoint('post', '/__mock/advance-date', ({ body }) => {
    if (!Number.isInteger(body.days) || body.days < 1 || body.days > 360) fail('Avance inválido.');
    now = new Date(now.valueOf() + body.days * 86400000);
    return { newDate: today() };
  });
  endpoint('get', '/analytics/kpis', dashboard);
  endpoint('get', '/analytics/monthly-flows', monthlyFlows);
  endpoint('get', '/analytics/movements', movements);
  app.use(jsonServer.rewriter(seed('routes.json')));
  app.use(router);
  app.listen(8080, '127.0.0.1', () => console.log('Demo API en http://localhost:8080'));
}

start().catch((error) => { console.error(error); process.exitCode = 1; });
