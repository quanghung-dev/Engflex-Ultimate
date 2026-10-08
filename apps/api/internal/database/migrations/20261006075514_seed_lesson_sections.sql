-- +goose Up
INSERT INTO lesson_sections (id, slug, title, description, cefr_band, position) VALUES
    ('11111111-0000-4000-8000-0000000000a1','a1','A1 Breakthrough','Everyday essentials: greetings, numbers and places. TOEIC L&R estimate ≈ 120–225.','A1',1),
    ('11111111-0000-4000-8000-0000000000a2','a2','A2 Waystage','Daily life, travel and services. TOEIC L&R estimate ≈ 225–550.','A2',2),
    ('11111111-0000-4000-8000-0000000000b1','b1','B1 Threshold','Office routines and simple correspondence. TOEIC L&R estimate ≈ 550–785.','B1',3),
    ('11111111-0000-4000-8000-0000000000b2','b2','B2 Vantage','Meetings, reports and negotiation. TOEIC L&R estimate ≈ 785–945.','B2',4),
    ('11111111-0000-4000-8000-0000000000c1','c1','C1 Mastery','Professional fluency and complex texts. TOEIC L&R estimate ≈ 945–990.','C1',5),
    ('11111111-0000-4000-8000-0000000000c2','c2','C2 Precision','Mastery beyond the TOEIC reported CEFR ceiling.','C2',6)
ON CONFLICT (slug) DO NOTHING;

-- Forward-port descriptions on a database that already ran the old seed (the
-- standard path for a stale chain is still `make migration-down && up`).
UPDATE lesson_sections SET description = CASE slug
  WHEN 'a1' THEN 'Everyday essentials: greetings, numbers and places. TOEIC L&R estimate ≈ 120–225.'
  WHEN 'a2' THEN 'Daily life, travel and services. TOEIC L&R estimate ≈ 225–550.'
  WHEN 'b1' THEN 'Office routines and simple correspondence. TOEIC L&R estimate ≈ 550–785.'
  WHEN 'b2' THEN 'Meetings, reports and negotiation. TOEIC L&R estimate ≈ 785–945.'
  WHEN 'c1' THEN 'Professional fluency and complex texts. TOEIC L&R estimate ≈ 945–990.'
  WHEN 'c2' THEN 'Mastery beyond the TOEIC reported CEFR ceiling.'
END
WHERE slug IN ('a1','a2','b1','b2','c1','c2');

-- +goose Down
DELETE FROM lesson_sections WHERE slug IN ('a1','a2','b1','b2','c1','c2');
