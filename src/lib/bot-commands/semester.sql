-- BLOCK select_semesters
SELECT
    *
FROM
    semesters;

-- BLOCK insert_semester
INSERT INTO
    semesters (semester)
VALUES
    (:semester);

-- BLOCK activate_semester
UPDATE semesters
SET
    active = (semester = :semester);