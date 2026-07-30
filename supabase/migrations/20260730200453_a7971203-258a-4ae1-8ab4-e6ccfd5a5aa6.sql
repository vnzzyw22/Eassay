REVOKE ALL ON FUNCTION public.ranking_minha_sala() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ranking_minha_sala() TO authenticated;