-- Нормализация исторических значений incident_victims к единому справочнику.

UPDATE incident_victims
SET social_status = CASE social_status
  WHEN 'child_preschool' THEN 'child'
  WHEN 'student_school' THEN 'student_10_16'
  WHEN 'student_uni' THEN 'student'
  ELSE social_status
END
WHERE social_status IN ('child_preschool', 'student_school', 'student_uni');

UPDATE incident_victims
SET condition = 'unattended_children'
WHERE condition = 'unsupervised_child';

UPDATE incident_victims
SET death_cause = CASE death_cause
  WHEN 'combustion_products' THEN 'smoke'
  WHEN 'psych' THEN 'panic'
  ELSE death_cause
END
WHERE death_cause IN ('combustion_products', 'psych');
