-- Verificacion de los reportes: comprueba invariantes que los triggers de la base
-- ya garantizan, asi que un fallo aca significa error en la agregacion, no en los datos.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT * FROM public.rpc_reporte_circuito(NULL, NULL, NULL, NULL, NULL) LOOP
    IF r.certificado > r.comprado + 0.01 THEN
      RAISE EXCEPTION 'Invariante roto (% ): certificado % > comprado %',
        r.moneda, r.certificado, r.comprado;
    END IF;
    IF r.facturado > r.certificado + 0.01 THEN
      RAISE EXCEPTION 'Invariante roto (% ): facturado % > certificado %',
        r.moneda, r.facturado, r.certificado;
    END IF;
    IF r.pagado > r.facturado + 0.01 THEN
      RAISE EXCEPTION 'Invariante roto (% ): pagado % > facturado %',
        r.moneda, r.pagado, r.facturado;
    END IF;
  END LOOP;
  RAISE NOTICE 'Invariantes del circuito: OK';
END $$;
