-- Seed school-owned grades/streams for Twalumbu/Talumbu from existing student enrollment data.
-- Safe to run multiple times (idempotent).

DO $$
DECLARE
    v_school RECORD;
BEGIN
    FOR v_school IN
        SELECT school_id, school_name
        FROM public.schools
        WHERE lower(school_name) LIKE '%twalumbu%'
           OR lower(school_name) LIKE '%talumbu%'
    LOOP
        RAISE NOTICE '[SeedGrades] Processing school: % (%)', v_school.school_name, v_school.school_id;

        -- 1) Create missing school-specific grade rows from existing student_grade links.
        INSERT INTO public.grades (grade_name, category, is_active, display_order, school_id)
        SELECT DISTINCT
            trim(g_src.grade_name) AS grade_name,
            g_src.category,
            true AS is_active,
            COALESCE(g_src.display_order, 0) AS display_order,
            v_school.school_id AS school_id
        FROM public.student_grade sg
        JOIN public.students s
          ON s.student_id = sg.student_id
        JOIN public.grades g_src
          ON g_src.grade_id = sg.grade_id
        WHERE s.school_id = v_school.school_id
          AND trim(COALESCE(g_src.grade_name, '')) <> ''
          AND NOT EXISTS (
              SELECT 1
              FROM public.grades g_existing
              WHERE g_existing.school_id = v_school.school_id
                AND lower(trim(g_existing.grade_name)) = lower(trim(g_src.grade_name))
          );

        -- 2) Remap student_grade rows to school-specific grade IDs by grade_name.
        UPDATE public.student_grade sg
        SET grade_id = g_school.grade_id,
            school_id = v_school.school_id
        FROM public.students s,
             public.grades g_src,
             public.grades g_school
        WHERE sg.student_id = s.student_id
          AND g_src.grade_id = sg.grade_id
          AND g_school.school_id = v_school.school_id
          AND lower(trim(g_school.grade_name)) = lower(trim(g_src.grade_name))
          AND s.school_id = v_school.school_id
          AND sg.grade_id <> g_school.grade_id;

        -- Keep school_id populated for this school's historical grade rows.
        UPDATE public.student_grade sg
        SET school_id = v_school.school_id
        FROM public.students s
        WHERE sg.student_id = s.student_id
          AND s.school_id = v_school.school_id
          AND sg.school_id IS DISTINCT FROM v_school.school_id;

        -- 3) Seed school streams/classes from student_grade.class.
        INSERT INTO public.school_streams (school_id, grade_id, stream_name, is_active)
        SELECT DISTINCT
            v_school.school_id AS school_id,
            g_school.grade_id AS grade_id,
            trim(sg.class) AS stream_name,
            true AS is_active
        FROM public.student_grade sg
        JOIN public.students s
          ON s.student_id = sg.student_id
        JOIN public.grades g_src
          ON g_src.grade_id = sg.grade_id
        JOIN public.grades g_school
          ON g_school.school_id = v_school.school_id
         AND lower(trim(g_school.grade_name)) = lower(trim(g_src.grade_name))
        WHERE s.school_id = v_school.school_id
          AND trim(COALESCE(sg.class, '')) <> ''
          AND lower(trim(sg.class)) <> 'general'
          AND NOT EXISTS (
              SELECT 1
              FROM public.school_streams ss
              WHERE ss.school_id = v_school.school_id
                AND ss.grade_id = g_school.grade_id
                AND lower(trim(ss.stream_name)) = lower(trim(sg.class))
          );

        -- 4) Backfill stream_id on student_grade where class matches seeded stream.
        UPDATE public.student_grade sg
        SET stream_id = ss.id
        FROM public.students s,
             public.grades g_src,
             public.grades g_school,
             public.school_streams ss
        WHERE sg.student_id = s.student_id
          AND g_src.grade_id = sg.grade_id
          AND g_school.school_id = v_school.school_id
          AND lower(trim(g_school.grade_name)) = lower(trim(g_src.grade_name))
          AND ss.school_id = v_school.school_id
          AND ss.grade_id = g_school.grade_id
          AND lower(trim(ss.stream_name)) = lower(trim(sg.class))
          AND s.school_id = v_school.school_id
          AND trim(COALESCE(sg.class, '')) <> ''
          AND lower(trim(sg.class)) <> 'general'
          AND sg.stream_id IS DISTINCT FROM ss.id;

        RAISE NOTICE '[SeedGrades] Done for school: %', v_school.school_name;
    END LOOP;
END
$$;
