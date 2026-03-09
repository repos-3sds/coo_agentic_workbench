-- 07_seed_monitoring.sql
-- Post-launch performance metrics and breach alerts

-- ==========================================
-- PERFORMANCE METRICS (4 launched products)
-- ==========================================

-- NPA #6: Multi-Currency Deposit (Healthy)
INSERT INTO npa_performance_metrics (project_id, days_since_launch, total_volume, volume_currency, realized_pnl, active_breaches, counterparty_exposure, var_utilization, collateral_posted, next_review_date, health_status) VALUES
('NPA-2026-006', 133, 42800000.00, 'SGD', 1200000.00, 0, 0.00, 22.50, 0.00, '2026-04-01', 'healthy');

-- NPA #7: FX Accumulator USD/SGD (Warning - 2 breaches)
INSERT INTO npa_performance_metrics (project_id, days_since_launch, total_volume, volume_currency, realized_pnl, active_breaches, counterparty_exposure, var_utilization, collateral_posted, next_review_date, health_status) VALUES
('NPA-2026-007', 149, 128500000.00, 'USD', 3800000.00, 2, 87000000.00, 68.00, 12500000.00, '2026-03-15', 'warning');

-- Historical Product A: Green Bond Framework (Critical - 3 breaches, negative P&L)
INSERT INTO npa_performance_metrics (project_id, days_since_launch, total_volume, volume_currency, realized_pnl, active_breaches, counterparty_exposure, var_utilization, collateral_posted, next_review_date, health_status) VALUES
('NPA-2026-003', 90, 85200000.00, 'USD', -400000.00, 3, 42000000.00, 78.50, 8500000.00, '2026-02-28', 'critical');

-- Historical Product B: Digital Custody (Early stage, healthy so far)
INSERT INTO npa_performance_metrics (project_id, days_since_launch, total_volume, volume_currency, realized_pnl, active_breaches, counterparty_exposure, var_utilization, collateral_posted, next_review_date, health_status) VALUES
('NPA-2026-001', 30, 15000000.00, 'USD', 450000.00, 0, 12000000.00, 15.00, 3000000.00, '2026-06-15', 'healthy');

-- ==========================================
-- BREACH ALERTS (7 alerts: 3 CRITICAL, 4 WARNING)
-- ==========================================

-- FX Accumulator breaches
INSERT INTO npa_breach_alerts (id, project_id, title, severity, description, threshold_value, actual_value, escalated_to, sla_hours, status, triggered_at) VALUES
('BR-001', 'NPA-2026-007', 'Volume Threshold Exceeded', 'CRITICAL', 'Daily trading volume $192M exceeds approved cap of $128M.', '$128M daily cap', '$192M actual', 'Head of FX Trading', 4, 'OPEN', '2026-02-11 06:30:00'),
('BR-002', 'NPA-2026-007', 'Concentration Limit Warning', 'WARNING', 'Single counterparty exposure approaching 80% of approved limit.', '80% of $110M limit', '78% utilized ($85.8M)', 'RMG-Credit Team', 24, 'ACKNOWLEDGED', '2026-02-09 14:00:00');

-- Green Bond Framework breaches
INSERT INTO npa_breach_alerts (id, project_id, title, severity, description, threshold_value, actual_value, escalated_to, sla_hours, status, triggered_at) VALUES
('BR-003', 'NPA-2026-003', 'Counterparty Rating Downgrade', 'CRITICAL', 'Moody\'s downgraded primary counterparty from A- to BBB+.', 'Minimum A- rating', 'BBB+ (downgraded)', 'Credit Risk Team', 4, 'ESCALATED', '2026-02-10 18:00:00'),
('BR-004', 'NPA-2026-003', 'Collateral Coverage Below Threshold', 'WARNING', 'Collateral coverage ratio 92% vs required minimum 95%.', '95% coverage', '92% coverage', 'Operations Team', 24, 'OPEN', '2026-02-10 09:00:00'),
('BR-005', 'NPA-2026-003', 'P&L Drawdown Alert', 'WARNING', 'Cumulative P&L drawdown -$0.4M exceeds warning threshold of -$0.3M.', '-$0.3M threshold', '-$0.4M actual', 'Finance PC', 48, 'ACKNOWLEDGED', '2026-02-08 16:00:00');

-- Multi-Currency Deposit (historical, resolved)
INSERT INTO npa_breach_alerts (id, project_id, title, severity, description, threshold_value, actual_value, escalated_to, sla_hours, status, triggered_at, resolved_at) VALUES
('BR-006', 'NPA-2026-006', 'Early Withdrawal Spike', 'WARNING', 'Early withdrawal rate 8.2% exceeds expected 5% for Q4.', '5% quarterly', '8.2% actual', 'Consumer Banking Head', 48, 'RESOLVED', '2025-12-20 10:00:00', '2025-12-22 14:00:00');

-- FX Accumulator additional
INSERT INTO npa_breach_alerts (id, project_id, title, severity, description, threshold_value, actual_value, escalated_to, sla_hours, status, triggered_at) VALUES
('BR-007', 'NPA-2026-007', 'Knock-Out Barrier Proximity', 'CRITICAL', 'USD/SGD spot rate within 0.5% of knock-out barrier. High risk of barrier event.', '1.3450 barrier', '1.3385 current (0.48% away)', 'FX Trading Desk Head + RMG', 2, 'OPEN', '2026-02-11 08:15:00');
