/*
# Restringir funciones a roles autenticados

Revoca el permiso EXECUTE de las funciones has_role, is_editor y handle_new_user
del rol anónimo, para que solo usuarios autenticados puedan usarlas.
*/

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_editor(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
