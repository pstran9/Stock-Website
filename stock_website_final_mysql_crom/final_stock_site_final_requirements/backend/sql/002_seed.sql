INSERT IGNORE INTO users (email, username, password_hash, full_name, role, cash_balance)
VALUES (
  'admin@example.com',
  'admin',
  '$2a$12$ZsrIYw4Fuk6M7OTQfHq7mORmPmd0meHfZg2.9mVQH5cF5QWqKcV9q',
  'Admin User',
  'ADMIN',
  50000.00
);

INSERT IGNORE INTO stocks (ticker, name, volume, opening_price, last_price, day_high, day_low, volatility, drift) VALUES
('AAPL','Apple Inc.', 1000000, 185.2500, 185.2500, 185.2500, 185.2500, 0.025000, 0.000120),
('MSFT','Microsoft Corp.', 900000, 410.7800, 410.7800, 410.7800, 410.7800, 0.022000, 0.000110),
('AMZN','Amazon.com Inc.', 850000, 165.4300, 165.4300, 165.4300, 165.4300, 0.030000, 0.000130),
('TSLA','Tesla Inc.', 700000, 215.1200, 215.1200, 215.1200, 215.1200, 0.045000, 0.000150),
('GOOGL','Alphabet Inc.', 950000, 148.2100, 148.2100, 148.2100, 148.2100, 0.024000, 0.000115);

INSERT INTO market_hours (day_of_week, open_time_utc, close_time_utc) VALUES
(1, '13:30:00','20:00:00'),
(2, '13:30:00','20:00:00'),
(3, '13:30:00','20:00:00'),
(4, '13:30:00','20:00:00'),
(5, '13:30:00','20:00:00')
ON DUPLICATE KEY UPDATE open_time_utc=VALUES(open_time_utc), close_time_utc=VALUES(close_time_utc);

INSERT IGNORE INTO market_holidays (holiday_date, name) VALUES
('2026-01-01','New Year''s Day'),
('2026-01-19','Martin Luther King Jr. Day'),
('2026-02-16','Washington''s Birthday'),
('2026-04-03','Good Friday'),
('2026-05-25','Memorial Day'),
('2026-07-03','Independence Day (Observed)'),
('2026-09-07','Labor Day'),
('2026-11-26','Thanksgiving Day'),
('2026-12-25','Christmas Day');
