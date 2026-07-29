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

-- El corte por proveedor tiene que sumar exactamente el total del circuito.
-- Si difiere, un JOIN esta perdiendo o duplicando filas en alguno de los dos.
DO $$
DECLARE
  v_circuito numeric;
  v_proveedores numeric;
  r record;
BEGIN
  FOR r IN SELECT DISTINCT moneda FROM public.rpc_reporte_circuito(NULL,NULL,NULL,NULL,NULL) LOOP
    SELECT comprado INTO v_circuito
    FROM public.rpc_reporte_circuito(NULL,NULL,NULL,NULL,r.moneda);

    SELECT COALESCE(SUM(comprado), 0) INTO v_proveedores
    FROM public.rpc_reporte_proveedores(NULL,NULL,NULL,NULL,r.moneda);

    IF abs(v_circuito - v_proveedores) > 0.01 THEN
      RAISE EXCEPTION 'Descuadre (%): circuito % vs proveedores %',
        r.moneda, v_circuito, v_proveedores;
    END IF;
  END LOOP;
  RAISE NOTICE 'Coherencia circuito/proveedores: OK';
END $$;

-- Los tramos de aging tienen que sumar la deuda total: ningun tramo se pisa ni falta.
DO $$
DECLARE
  v_total numeric;
  v_tramos numeric;
BEGIN
  SELECT COALESCE(SUM(saldo), 0) INTO v_total
  FROM public.rpc_reporte_deuda(NULL,NULL,NULL,NULL,NULL);

  SELECT COALESCE(SUM(s), 0) INTO v_tramos
  FROM (SELECT SUM(saldo) AS s
        FROM public.rpc_reporte_deuda(NULL,NULL,NULL,NULL,NULL)
        GROUP BY tramo) t;

  IF abs(v_total - v_tramos) > 0.01 THEN
    RAISE EXCEPTION 'Descuadre de aging: total % vs tramos %', v_total, v_tramos;
  END IF;
  RAISE NOTICE 'Coherencia de tramos de aging: OK';
END $$;
