-- 기존 학생/신청내역 보존. 기존 학생은 관리자 확인 후 비밀번호 설정 필요.
ALTER TABLE public.tt_students ADD COLUMN IF NOT EXISTS "passwordHash" text;
REVOKE ALL ON public.tt_students FROM anon, authenticated;
NOTIFY pgrst, 'reload schema';
