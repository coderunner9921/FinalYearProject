-- Insert sample questions for HR domain
INSERT INTO questions (domain, question_text, expected_keywords) VALUES
('HR', 'Tell me about yourself.', '{"experience", "background", "skills", "education", "achievements"}'),
('HR', 'What are your strengths and weaknesses?', '{"strengths", "weaknesses", "improvement", "self-awareness", "growth"}'),
('HR', 'Why do you want to work for our company?', '{"values", "mission", "culture", "contribution", "alignment"}'),
('HR', 'Describe a challenging situation and how you handled it.', '{"challenge", "solution", "problem-solving", "teamwork", "results"}');

-- Insert sample questions for Technical domain
INSERT INTO questions (domain, question_text, expected_keywords) VALUES
('Technical', 'Explain the difference between stack and queue.', '{"LIFO", "FIFO", "data structures", "operations", "push", "pop", "enqueue", "dequeue"}'),
('Technical', 'What is object-oriented programming?', '{"encapsulation", "inheritance", "polymorphism", "abstraction", "classes", "objects"}'),
('Technical', 'How does a hash table work?', '{"hashing", "key-value", "collision", "buckets", "time complexity"}'),
('Technical', 'Explain the concept of recursion.', '{"base case", "recursive case", "stack", "termination", "efficiency"}');

-- Insert sample questions for Marketing domain
INSERT INTO questions (domain, question_text, expected_keywords) VALUES
('Marketing', 'What is the difference between B2B and B2C marketing?', '{"business", "consumer", "strategy", "target audience", "sales cycle", "relationships"}'),
('Marketing', 'How do you measure marketing campaign success?', '{"ROI", "KPIs", "metrics", "conversion rates", "engagement", "analytics"}'),
('Marketing', 'What is a marketing funnel?', '{"awareness", "consideration", "conversion", "retention", "journey", "stages"}');