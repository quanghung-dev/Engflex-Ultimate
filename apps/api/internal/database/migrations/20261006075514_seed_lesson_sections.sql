-- +goose Up
INSERT INTO lesson_sections (id, slug, title, description, cefr_band, position) VALUES
    ('11111111-0000-4000-8000-0000000000a1','a1','A1 Breakthrough','First steps: essential phrases and simple exchanges.','A1',1),
    ('11111111-0000-4000-8000-0000000000a2','a2','A2 Waystage','Everyday topics in simple, direct exchanges.','A2',2),
    ('11111111-0000-4000-8000-0000000000b1','b1','B1 Threshold','Independent talk about work, plans, and opinions.','B1',3),
    ('11111111-0000-4000-8000-0000000000b2','b2','B2 Vantage','Confident debate with technical depth.','B2',4),
    ('11111111-0000-4000-8000-0000000000c1','c1','C1 Mastery','Executive fluency and presence under pressure.','C1',5),
    ('11111111-0000-4000-8000-0000000000c2','c2','C2 Precision','Near-native precision in any professional setting.','C2',6)
ON CONFLICT (slug) DO NOTHING;

-- +goose Down
DELETE FROM lesson_sections WHERE slug IN ('a1','a2','b1','b2','c1','c2');
