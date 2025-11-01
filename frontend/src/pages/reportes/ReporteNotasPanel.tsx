import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context';
import { useApi } from '../../hooks/useApi';
import { usePermissions } from '../../hooks/usePermissions';
import './ReporteNotasPanel.css';

type Nullable<T> = T | null;

type AnioLectivoActivoInfo = {
  id_anio_lectivo: number;
  anio: number;
  estado?: string;
};

interface DocenteInfo {
  id_persona: number;
  nombre: string;
  apellido: string;
  numero_identificacion: string;
  id_usuario?: Nullable<number>;
}

interface AsignacionDocente {
  id_docente_asignatura: number;
  id_persona_docente: Nullable<number>;
  id_asignatura: number;
  id_grado: Nullable<number>;
  id_grupo: Nullable<number>;
  id_anio_lectivo: Nullable<number>;
  asignatura_nombre: string;
  grado_nombre?: string;
  grupo_nombre?: string;
  anio_lectivo?: number;
}

interface DocenteSuggestion {
  id_persona_docente: number;
  docente_nombre: string;
  docente_identificacion?: string | null;
  asignaciones: AsignacionDocente[];
}

interface PeriodoAcademicoItem {
  id_periodo: number;
  id_anio_lectivo: number;
  nombre_periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
}

interface EstudianteNotaRow {
  id_persona: number;
  nombre: string;
  apellido: string;
  foto?: string;
  numeroIdentificacion?: string | null;
  id_calificacion?: Nullable<number>;
  calificacion_actual?: Nullable<number>;
  total_fallas?: number;
  total_fallas_justificadas?: number;

  notaEditable: string;
  error?: string;
  estaGuardando?: boolean;
  ultimaActualizacion?: Date;
  tieneCambios: boolean;
}

interface ClasePeriodoResponse {
  id_docente_asignatura: number;
  asignatura_nombre: string;
  grupo_codigo?: string;
  grado_nombre: string;
  anio_lectivo: number;
  periodo_nombre: string;
  periodo_estado: string;
  estudiantes: Array<{
    id_persona: number;
    nombre: string;
    apellido: string;
    numero_identificacion?: string | null;
    foto?: string;
    id_calificacion?: Nullable<number>;
    calificacion_actual?: Nullable<number>;
    total_fallas?: number;
    total_fallas_justificadas?: number;
  }>;
}

interface ResumenNotas {
  totalEstudiantes: number;
  notasIngresadas: number;
  pendientes: number;
  promedio?: Nullable<number>;
}

const NOTE_REGEX = /^\d(\.\d)?$/;

const parseFecha = (value: string): Date => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(value.replace(' ', 'T'));
  }
  return parsed;
};

const ReporteNotasPanel: React.FC = () => {
  const { state } = useAppContext();
  const { get: apiGet, post: apiPost, put: apiPut } = useApi();
  const permissions = usePermissions();

  const [anioLectivoActivo, setAnioLectivoActivo] = useState<Nullable<AnioLectivoActivoInfo>>(null);
  const [loadingAnio, setLoadingAnio] = useState<boolean>(false);

  const [cedulaBusqueda, setCedulaBusqueda] = useState<string>('');
  const [docente, setDocente] = useState<Nullable<DocenteInfo>>(null);
  const [buscandoDocente, setBuscandoDocente] = useState<boolean>(false);
  const [errorDocente, setErrorDocente] = useState<string>('');

  const [sugerenciasDocentes, setSugerenciasDocentes] = useState<DocenteSuggestion[]>([]);
  const [cargandoSugerencias, setCargandoSugerencias] = useState<boolean>(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState<boolean>(false);

  const [asignaciones, setAsignaciones] = useState<AsignacionDocente[]>([]);
  const [cargandoAsignaciones, setCargandoAsignaciones] = useState<boolean>(false);
  const [selectedAsignacionId, setSelectedAsignacionId] = useState<Nullable<number>>(null);

  const [periodos, setPeriodos] = useState<PeriodoAcademicoItem[]>([]);
  const [cargandoPeriodos, setCargandoPeriodos] = useState<boolean>(false);
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<Nullable<number>>(null);
  const [periodoActivoId, setPeriodoActivoId] = useState<Nullable<number>>(null);
  const [advertenciaPeriodo, setAdvertenciaPeriodo] = useState<string>('');

  const [estudiantes, setEstudiantes] = useState<EstudianteNotaRow[]>([]);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState<boolean>(false);
  const [guardandoTodo, setGuardandoTodo] = useState<boolean>(false);
  const [grupoDetectado, setGrupoDetectado] = useState<string>('');

  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'con-nota' | 'sin-nota'>('todos');

  const loadAnioLectivoActivo = useCallback(async (): Promise<Nullable<AnioLectivoActivoInfo>> => {
    setLoadingAnio(true);
    try {
      const data = await apiGet<any[]>('/aniolectivo');
      const activo = (data || []).find((item) => item.estado?.nombre === 'activo' || item.estado === 'activo');
      setAnioLectivoActivo(activo || null);
      return activo || null;
    } catch (error) {
      console.error('Error cargando año lectivo activo', error);
      setAnioLectivoActivo(null);
      return null;
    } finally {
      setLoadingAnio(false);
    }
  }, [apiGet]);

  useEffect(() => {
    loadAnioLectivoActivo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetAsignaciones = useCallback(() => {
    setAsignaciones([]);
    setSelectedAsignacionId(null);
    setPeriodos([]);
    setSelectedPeriodoId(null);
    setPeriodoActivoId(null);
    setEstudiantes([]);
    setGrupoDetectado('');
  }, [setAsignaciones]);

  const ordenarAsignaciones = useCallback((items: AsignacionDocente[]): AsignacionDocente[] => {
    return [...items].sort((a, b) => {
      const gradoA = a.grado_nombre || '';
      const gradoB = b.grado_nombre || '';
      if (gradoA.toLocaleLowerCase() < gradoB.toLocaleLowerCase()) return -1;
      if (gradoA.toLocaleLowerCase() > gradoB.toLocaleLowerCase()) return 1;

      const grupoA = (a.grupo_nombre || '').toLocaleLowerCase();
      const grupoB = (b.grupo_nombre || '').toLocaleLowerCase();
      if (grupoA < grupoB) return -1;
      if (grupoA > grupoB) return 1;

      return (a.asignatura_nombre || '').localeCompare(b.asignatura_nombre || '');
    });
  }, []);

  const normalizarAsignaciones = useCallback((items: AsignacionDocente[]): AsignacionDocente[] => {
    if (!items.length) return [];

    const agrupado = new Map<string, { tieneGrupo: boolean; asignaciones: AsignacionDocente[] }>();

    items.forEach((item) => {
      const clave = `${item.id_anio_lectivo ?? 0}-${item.id_grado ?? 0}-${item.id_asignatura}`;
      if (!agrupado.has(clave)) {
        agrupado.set(clave, { tieneGrupo: false, asignaciones: [] });
      }
      const entry = agrupado.get(clave)!;
      entry.asignaciones.push(item);
      if (item.id_grupo) {
        entry.tieneGrupo = true;
      }
    });

    const resultado: AsignacionDocente[] = [];
    agrupado.forEach(({ tieneGrupo, asignaciones }) => {
      if (tieneGrupo) {
        resultado.push(...asignaciones.filter((asig) => asig.id_grupo));
      } else {
        resultado.push(...asignaciones);
      }
    });

    return ordenarAsignaciones(resultado);
  }, [ordenarAsignaciones]);

  const agruparAsignacionesPorDocente = useCallback((items: any[]): DocenteSuggestion[] => {
    const agrupado = new Map<number, DocenteSuggestion>();
    (items || []).forEach((item: any) => {
      if (!item.id_persona_docente) return;
      if (!agrupado.has(item.id_persona_docente)) {
        agrupado.set(item.id_persona_docente, {
          id_persona_docente: item.id_persona_docente,
          docente_nombre: item.docente_nombre || '',
          docente_identificacion: item.docente_identificacion,
          asignaciones: [],
        });
      }
      const asignaciones = agrupado.get(item.id_persona_docente)!.asignaciones;
      asignaciones.push({
        id_docente_asignatura: item.id_docente_asignatura,
        id_persona_docente: item.id_persona_docente,
        id_asignatura: item.id_asignatura,
        id_grado: item.id_grado,
        id_grupo: item.id_grupo,
        id_anio_lectivo: item.id_anio_lectivo,
        asignatura_nombre: item.asignatura_nombre,
        grado_nombre: item.grado_nombre,
        grupo_nombre: item.grupo_nombre,
        anio_lectivo: item.anio_lectivo,
      });
    });
    return Array.from(agrupado.values()).map((suggestion) => ({
      ...suggestion,
      asignaciones: normalizarAsignaciones(suggestion.asignaciones),
    }));
  }, [normalizarAsignaciones]);

  const seleccionarDocente = useCallback(async (sugerencia: DocenteSuggestion) => {
    if (!sugerencia.id_persona_docente) return;

    setMostrarSugerencias(false);
    setSugerenciasDocentes([]);
    setBuscandoDocente(true);
    setErrorDocente('');
    resetAsignaciones();

    try {
      const anioActivo = anioLectivoActivo || (await loadAnioLectivoActivo());
      if (!anioActivo) {
        setErrorDocente('No se encontró un año lectivo activo.');
        return;
      }

      const usuarios = await apiGet<any[]>(`/usuarios?id_persona=${sugerencia.id_persona_docente}`);
      const usuario = (usuarios || []).find((u: any) => !u.fecha_eliminacion);

      const partesNombre = (sugerencia.docente_nombre || '').trim().split(/\s+/);
      const nombre = partesNombre.shift() || '';
      const apellido = partesNombre.join(' ');
      const documento = sugerencia.docente_identificacion || cedulaBusqueda.trim();

      const docenteInfo: DocenteInfo = {
        id_persona: sugerencia.id_persona_docente,
        nombre,
        apellido,
        numero_identificacion: documento,
        id_usuario: usuario?.id_usuario ?? null,
      };

      setDocente(docenteInfo);
      setCedulaBusqueda(documento);

      const asignacionesOrdenadas = normalizarAsignaciones(sugerencia.asignaciones || []);
      setAsignaciones(asignacionesOrdenadas);

      if (!asignacionesOrdenadas.length) {
        setErrorDocente('No hay asignaciones para el año lectivo activo.');
      }
    } catch (error) {
      console.error('Error al seleccionar docente', error);
      setDocente(null);
      setAsignaciones([]);
      setErrorDocente('No se pudo cargar la información del docente.');
    } finally {
      setBuscandoDocente(false);
      setCargandoAsignaciones(false);
    }
  }, [anioLectivoActivo, apiGet, cedulaBusqueda, loadAnioLectivoActivo, normalizarAsignaciones, resetAsignaciones]);

  const buscarDocente = useCallback(async () => {
    const termino = cedulaBusqueda.trim();
    if (!termino) {
      setErrorDocente('Ingrese un número de identificación válido.');
      return;
    }

    const anioActivo = anioLectivoActivo || (await loadAnioLectivoActivo());
    if (!anioActivo) {
      setErrorDocente('No se encontró un año lectivo activo.');
      return;
    }

    setMostrarSugerencias(false);
    setSugerenciasDocentes([]);

    const sugerenciaExacta = sugerenciasDocentes.find((suger) =>
      suger.docente_identificacion && suger.docente_identificacion.toString() === termino
    );
    if (sugerenciaExacta) {
      await seleccionarDocente(sugerenciaExacta);
      return;
    }

    setErrorDocente('');
    setBuscandoDocente(true);
    resetAsignaciones();

    try {
      const resultados = await apiGet<any[]>(
        `/docente-asignatura?anio_lectivo_id=${anioActivo.id_anio_lectivo}&buscar=${encodeURIComponent(termino)}`
      );

      const agrupados = agruparAsignacionesPorDocente(resultados);
      const coincidencia = agrupados.find((suger) =>
        suger.docente_identificacion && suger.docente_identificacion.toString() === termino
      );

      if (coincidencia) {
        await seleccionarDocente(coincidencia);
        return;
      }

      if (agrupados.length === 1) {
        await seleccionarDocente(agrupados[0]);
        return;
      }

      if (!agrupados.length) {
        setDocente(null);
        setErrorDocente('Docente no encontrado o sin asignaciones activas.');
        return;
      }

      // Si hay múltiples coincidencias parciales, mostrar sugerencias para elección manual
      setSugerenciasDocentes(agrupados);
      setMostrarSugerencias(true);
      setErrorDocente('Selecciona el docente correcto de la lista.');
      setDocente(null);
      resetAsignaciones();
    } catch (error) {
      console.error('Error al buscar docente', error);
      setErrorDocente('Error al buscar docente. Intente nuevamente.');
      setDocente(null);
      resetAsignaciones();
    } finally {
      setBuscandoDocente(false);
      setCargandoAsignaciones(false);
    }
  }, [cedulaBusqueda, anioLectivoActivo, apiGet, loadAnioLectivoActivo, resetAsignaciones, sugerenciasDocentes, seleccionarDocente, agruparAsignacionesPorDocente]);

  useEffect(() => {
    if (buscandoDocente) {
      return;
    }

    const termino = cedulaBusqueda.trim();
    if (termino.length < 2) {
      setCargandoSugerencias(false);
      setSugerenciasDocentes([]);
      setMostrarSugerencias(false);
      return;
    }

    let cancelado = false;
    const handler = setTimeout(async () => {
      if (cancelado) return;
      try {
        const anioActivo = anioLectivoActivo || (await loadAnioLectivoActivo());
        if (!anioActivo?.id_anio_lectivo) {
          if (!cancelado) {
            setCargandoSugerencias(false);
            setSugerenciasDocentes([]);
            setMostrarSugerencias(false);
          }
          return;
        }

        setCargandoSugerencias(true);
        const data = await apiGet<any[]>(`/docente-asignatura?anio_lectivo_id=${anioActivo.id_anio_lectivo}&buscar=${encodeURIComponent(termino)}`);

        if (cancelado) {
          return;
        }

        setSugerenciasDocentes(agruparAsignacionesPorDocente(data));
        setMostrarSugerencias(true);
      } catch (error) {
        if (!cancelado) {
          console.error('Error cargando sugerencias de docentes', error);
          setSugerenciasDocentes([]);
          setMostrarSugerencias(false);
        }
      } finally {
        if (!cancelado) {
          setCargandoSugerencias(false);
        }
      }
    }, 250);

    return () => {
      cancelado = true;
      clearTimeout(handler);
    };
  }, [cedulaBusqueda, anioLectivoActivo, apiGet, loadAnioLectivoActivo, buscandoDocente, agruparAsignacionesPorDocente]);

  const detectarPeriodoActivo = (periodosDisponibles: PeriodoAcademicoItem[]): Nullable<PeriodoAcademicoItem> => {
    if (!periodosDisponibles.length) return null;

    const hoy = new Date();

    const encontradoPorFecha = periodosDisponibles.find((periodo) => {
      const inicio = parseFecha(periodo.fecha_inicio);
      const fin = parseFecha(periodo.fecha_fin);
      const esActivo = inicio <= hoy && hoy <= fin;
      return esActivo;
    });

    if (encontradoPorFecha) {
      return encontradoPorFecha;
    }

    const estadoActivo = periodosDisponibles.find((p) => p.estado === 'activo');
    if (estadoActivo) return estadoActivo;

    return periodosDisponibles[0];
  };

  const loadPeriodos = useCallback(async (anioId: number) => {
    setCargandoPeriodos(true);
    setAdvertenciaPeriodo('');
    try {
      const data = await apiGet<PeriodoAcademicoItem[]>(`/periodos?anio_lectivo_id=${anioId}`);
      const periodosOrdenados = (data || []).sort((a, b) => parseFecha(a.fecha_inicio).getTime() - parseFecha(b.fecha_inicio).getTime());
      setPeriodos(periodosOrdenados);

      const activo = detectarPeriodoActivo(periodosOrdenados);
      setPeriodoActivoId(activo?.id_periodo ?? null);
      setSelectedPeriodoId(activo?.id_periodo ?? null);

      if (!activo) {
        setAdvertenciaPeriodo('No hay período activo configurado.');
      } else if (activo.estado !== 'activo') {
        setAdvertenciaPeriodo(`El período identificado (${activo.nombre_periodo}) no está marcado como activo.`);
      }
    } catch (error) {
      console.error('Error cargando períodos', error);
      setPeriodos([]);
      setAdvertenciaPeriodo('No fue posible cargar los períodos académicos.');
    } finally {
      setCargandoPeriodos(false);
    }
  }, [apiGet]);

  const loadEstudiantes = useCallback(async (idAsignacion: number, idPeriodo: number) => {
    setCargandoEstudiantes(true);
    try {
      const data = await apiGet<ClasePeriodoResponse>(`/docente-asignatura/clase/${idAsignacion}/periodo/${idPeriodo}`);
      const estudiantesData: EstudianteNotaRow[] = (data?.estudiantes || []).map((est) => {
        const notaFuente =
          est.calificacion_actual ??
          (est as { nota_existente?: number | null }).nota_existente ??
          null;

        return {
        id_persona: est.id_persona,
        nombre: est.nombre,
        apellido: est.apellido,
        foto: est.foto,
        numeroIdentificacion: est.numero_identificacion ?? null,
        id_calificacion: est.id_calificacion,
          calificacion_actual: notaFuente,
        total_fallas: est.total_fallas ?? 0,
        total_fallas_justificadas: est.total_fallas_justificadas ?? 0,
          notaEditable:
            notaFuente !== null && notaFuente !== undefined
              ? Number(notaFuente).toFixed(1)
              : '',
          tieneCambios: false,
        };
      });
      setEstudiantes(estudiantesData);

      if (data?.grupo_codigo) {
        setGrupoDetectado(data.grupo_codigo);
        setAsignaciones((prev) =>
          prev.map((asignacion) =>
            asignacion.id_docente_asignatura === idAsignacion
              ? { ...asignacion, grupo_nombre: data.grupo_codigo }
              : asignacion
          )
        );
      } else {
        setGrupoDetectado('');
      }
    } catch (error) {
      console.error('Error cargando estudiantes', error);
      setEstudiantes([]);
      setGrupoDetectado('');
    } finally {
      setCargandoEstudiantes(false);
    }
  }, [apiGet, setAsignaciones]);

  useEffect(() => {
    if (selectedAsignacionId && selectedPeriodoId) {
      loadEstudiantes(selectedAsignacionId, selectedPeriodoId);
    } else {
      setEstudiantes([]);
    }
  }, [selectedAsignacionId, selectedPeriodoId, loadEstudiantes]);

  const asignacionSeleccionada = useMemo(
    () => asignaciones.find((a) => a.id_docente_asignatura === selectedAsignacionId) || null,
    [asignaciones, selectedAsignacionId]
  );

  const periodoSeleccionado = useMemo(
    () => periodos.find((p) => p.id_periodo === selectedPeriodoId) || null,
    [periodos, selectedPeriodoId]
  );

  const obtenerEstadoValor = (estado: any): string => {
    if (!estado) return '';
    if (typeof estado === 'string') return estado;
    if (typeof estado === 'object') {
      if (typeof estado.nombre === 'string') return estado.nombre;
      if (typeof estado.estado === 'string') return estado.estado;
    }
    return '';
  };

  const anioEstadoValor = obtenerEstadoValor(anioLectivoActivo?.estado);
  const periodoEstadoValor = obtenerEstadoValor(periodoSeleccionado?.estado);
  const periodoSeleccionadoEstado = periodoEstadoValor;
  const puedeCambiarPeriodo = permissions.canOverridePeriodo();
  const puedeEditarNotas = useMemo(
    () => permissions.canEditNotas(anioEstadoValor, periodoEstadoValor),
    [permissions, anioEstadoValor, periodoEstadoValor]
  );
  const tienePermisoBase = permissions.hasAnyPermission(['editar_notas', 'gestionar_notas', 'docente']);
  const anioEstadoNormalizado = anioEstadoValor.toLowerCase();
  const periodoEstadoNormalizado = periodoEstadoValor.toLowerCase();
  const mensajeBloqueo = useMemo(() => {
    if (puedeEditarNotas) return '';
    if (!tienePermisoBase) {
      return 'Tu perfil no tiene permisos para registrar calificaciones.';
    }
    if (periodoEstadoNormalizado && periodoEstadoNormalizado !== 'activo') {
      return 'Solo el período activo permite registrar notas con tu rol actual.';
    }
    if (['finalizado', 'cerrado'].includes(anioEstadoNormalizado)) {
      return 'El año lectivo actual está cerrado para edición de notas.';
    }
    return 'El ingreso de notas está bloqueado para su perfil o el período seleccionado.';
  }, [puedeEditarNotas, tienePermisoBase, periodoEstadoNormalizado, anioEstadoNormalizado]);

  const handleSelectAsignacion = async (id: number) => {
    setSelectedAsignacionId(id);
    setSelectedPeriodoId(null);
    setPeriodoActivoId(null);
    setEstudiantes([]);
    setGrupoDetectado('');

    if (anioLectivoActivo?.id_anio_lectivo) {
      await loadPeriodos(anioLectivoActivo.id_anio_lectivo);
    }
  };

  const handlePeriodoChange = (periodoId: number) => {
    setSelectedPeriodoId(periodoId);
    const periodoSeleccionado = periodos.find((p) => p.id_periodo === periodoId);
    if (periodoSeleccionado && periodoSeleccionado.estado !== 'activo') {
      setAdvertenciaPeriodo('El período seleccionado no está activo. Las notas se guardarán bajo su responsabilidad.');
    } else {
      setAdvertenciaPeriodo('');
    }
  };

  const validarNota = (valor: string): { esValida: boolean; valorNumerico?: number; mensaje?: string } => {
    if (valor.trim() === '') {
      return { esValida: true, valorNumerico: undefined };
    }

    if (!NOTE_REGEX.test(valor.trim())) {
      return { esValida: false, mensaje: 'Formato inválido. Use un número con máximo un decimal.' };
    }

    const numero = parseFloat(valor);
    if (Number.isNaN(numero) || numero < 0 || numero > 5) {
      return { esValida: false, mensaje: 'La nota debe estar entre 0.0 y 5.0.' };
    }

    const redondeado = Math.round(numero * 10) / 10;
    return { esValida: true, valorNumerico: redondeado };
  };

  const actualizarEstudiante = (idPersona: number, updater: (est: EstudianteNotaRow) => EstudianteNotaRow) => {
    setEstudiantes((prev) => prev.map((est) => (est.id_persona === idPersona ? updater(est) : est)));
  };

  const handleNotaInputChange = (idPersona: number, valor: string) => {
    actualizarEstudiante(idPersona, (est) => ({
      ...est,
      notaEditable: valor,
      tieneCambios: true,
      error: undefined,
    }));
  };

  const guardarNota = async (estudiante: EstudianteNotaRow): Promise<boolean> => {
    if (!selectedAsignacionId || !selectedPeriodoId || !anioLectivoActivo?.id_anio_lectivo || !docente) {
      return false;
    }

    if (!puedeEditarNotas) {
      return false;
    }

    const { esValida, valorNumerico, mensaje } = validarNota(estudiante.notaEditable);
    if (!esValida) {
      actualizarEstudiante(estudiante.id_persona, (est) => ({ ...est, error: mensaje }));
      return false;
    }

    const datos = {
      id_persona: estudiante.id_persona,
      id_asignatura: asignaciones.find((a) => a.id_docente_asignatura === selectedAsignacionId)?.id_asignatura,
      id_periodo: selectedPeriodoId,
      id_anio_lectivo: anioLectivoActivo.id_anio_lectivo,
      id_usuario: state.user.id,
      calificacion_numerica: valorNumerico ?? 0,
    };

    if (!datos.id_asignatura) {
      actualizarEstudiante(estudiante.id_persona, (est) => ({ ...est, error: 'No se encontró la asignatura asociada.' }));
      return false;
    }

    actualizarEstudiante(estudiante.id_persona, (est) => ({ ...est, estaGuardando: true }));

    try {
      if (valorNumerico === undefined || valorNumerico === null) {
        throw new Error('Debe ingresar una nota para guardar.');
      }

      let idCalificacion = estudiante.id_calificacion;
      if (idCalificacion) {
        await apiPut(`/calificaciones/${idCalificacion}`, {
          calificacion_numerica: valorNumerico,
          id_usuario: state.user.id,
        });
      } else {
        const response = await apiPost('/calificaciones', datos);
        idCalificacion = response?.id_calificacion || response?.id || response?.data?.id_calificacion;
      }

      actualizarEstudiante(estudiante.id_persona, (est) => ({
        ...est,
        id_calificacion: idCalificacion ?? est.id_calificacion,
        calificacion_actual: valorNumerico,
        notaEditable: valorNumerico.toFixed(1),
        tieneCambios: false,
        error: undefined,
        estaGuardando: false,
        ultimaActualizacion: new Date(),
      }));

      return true;
    } catch (error) {
      console.error('Error guardando nota', error);
      actualizarEstudiante(estudiante.id_persona, (est) => ({
        ...est,
        error: 'No fue posible guardar la nota. Intente nuevamente.',
        estaGuardando: false,
      }));
      return false;
    }
  };

  const guardarNotasSeleccionadas = async () => {
    if (!puedeEditarNotas) {
      alert(mensajeBloqueo || 'No puedes registrar notas en este período.');
      return;
    }

    const estudiantesConCambios = estudiantes.filter((est) => est.tieneCambios);
    if (!estudiantesConCambios.length) {
      alert('No hay cambios por guardar.');
      return;
    }

    setGuardandoTodo(true);
    try {
      const resultados = await Promise.all(estudiantesConCambios.map((est) => guardarNota(est)));
      const exitos = resultados.filter(Boolean).length;
      alert(`Notas guardadas correctamente (${exitos}/${estudiantesConCambios.length}).`);
    } finally {
      setGuardandoTodo(false);
    }
  };

  const resumen: ResumenNotas = useMemo(() => {
    const total = estudiantes.length;
    if (!total) {
      return { totalEstudiantes: 0, notasIngresadas: 0, pendientes: 0 };
    }

    const notasIngresadas = estudiantes.filter((est) => est.calificacion_actual !== null && est.calificacion_actual !== undefined).length;
    const pendientes = total - notasIngresadas;
    const suma = estudiantes.reduce((acc, est) => acc + (est.calificacion_actual ?? 0), 0);
    const promedio = notasIngresadas ? Math.round((suma / notasIngresadas) * 10) / 10 : undefined;

    return { totalEstudiantes: total, notasIngresadas, pendientes, promedio };
  }, [estudiantes]);

  const estudiantesFiltrados = useMemo(() => {
    return estudiantes.filter((est) => {
      const termino = filtroBusqueda.toLocaleLowerCase().trim();
      const coincideBusqueda = termino === ''
        || `${est.nombre} ${est.apellido}`.toLocaleLowerCase().includes(termino)
        || est.id_persona.toString().includes(termino);

      if (!coincideBusqueda) return false;

      if (filtroEstado === 'con-nota') {
        return est.calificacion_actual !== null && est.calificacion_actual !== undefined;
      }
      if (filtroEstado === 'sin-nota') {
        return est.calificacion_actual === null || est.calificacion_actual === undefined;
      }

      return true;
    });
  }, [estudiantes, filtroBusqueda, filtroEstado]);

  const handleBuscarKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      buscarDocente();
    }
  };

  return (
    <div className="reporte-notas-panel">
      <header className="panel-header">
        <div className="panel-header__title">
          <span className="material-icons">fact_check</span>
          <div>
            <h2>Panel de Reporte de Notas</h2>
            <p>Ingreso y control de calificaciones para personal administrativo.</p>
          </div>
        </div>
        {anioLectivoActivo && (
          <div className="panel-header__context">
            <strong>Año lectivo activo:</strong> {anioLectivoActivo.anio}
          </div>
        )}
      </header>

      <section className="panel-card">
        <div className="panel-card__title">
          <span className="material-icons">person_search</span>
          <h3>Búsqueda y selección de docente</h3>
        </div>

        <div className="docente-search">
          <input
            type="text"
            value={cedulaBusqueda}
            onChange={(e) => setCedulaBusqueda(e.target.value)}
            onKeyDown={handleBuscarKeyDown}
            placeholder="Número de identificación del docente"
            disabled={buscandoDocente || loadingAnio}
            onFocus={() => {
              if (sugerenciasDocentes.length) {
                setMostrarSugerencias(true);
              }
            }}
          />
          <button className="btn btn-primary" onClick={buscarDocente} disabled={buscandoDocente || loadingAnio}>
            {buscandoDocente ? 'Buscando…' : 'Buscar'}
          </button>
        </div>

        {mostrarSugerencias && (
          <div className="docente-search-results">
            {cargandoSugerencias ? (
              <div className="docente-search-results__item">Buscando docentes…</div>
            ) : sugerenciasDocentes.length ? (
              sugerenciasDocentes.map((sugerencia) => (
                <button
                  type="button"
                  key={sugerencia.id_persona_docente}
                  className="docente-search-results__item"
                  onClick={() => seleccionarDocente(sugerencia)}
                >
                  <div>
                    <strong>{sugerencia.docente_nombre}</strong>
                    <p>
                      Cédula: {sugerencia.docente_identificacion || 'Sin identificación'}
                    </p>
                    <small>{sugerencia.asignaciones.length} asignación(es)</small>
                  </div>
                </button>
              ))
            ) : (
              <div className="docente-search-results__item docente-search-results__empty">Sin coincidencias</div>
            )}
          </div>
        )}

        {errorDocente && <div className="alert alert-error">{errorDocente}</div>}

        {docente && (
          <div className="docente-summary">
            <div>
              <strong>{docente.nombre} {docente.apellido}</strong>
              <p>Cédula: {docente.numero_identificacion}</p>
            </div>
            {docente.id_usuario ? (
              <span className="status-pill status-pill--success">Usuario asignado #{docente.id_usuario}</span>
            ) : (
              <span className="status-pill status-pill--warning">Sin usuario asociado</span>
            )}
          </div>
        )}
      </section>

      {docente && (
        <section className="panel-card">
          <div className="panel-card__title">
            <span className="material-icons">class</span>
            <h3>Asignaciones activas</h3>
          </div>

          {cargandoAsignaciones ? (
            <div className="loading">Cargando asignaciones…</div>
          ) : asignaciones.length ? (
            <div className="asignaciones-list">
              {asignaciones.map((asignacion) => {
                const esSeleccionada = asignacion.id_docente_asignatura === selectedAsignacionId;
                return (
                  <button
                    key={asignacion.id_docente_asignatura}
                    className={`asignacion-item ${esSeleccionada ? 'asignacion-item--active' : ''}`}
                    onClick={() => handleSelectAsignacion(asignacion.id_docente_asignatura)}
                  >
                    <div>
                      <strong>{asignacion.asignatura_nombre}</strong>
                      <p>{asignacion.grado_nombre} · {asignacion.grupo_nombre || 'Sin grupo asignado'}</p>
                    </div>
                    <span className="asignacion-item__anio">{asignacion.anio_lectivo || anioLectivoActivo?.anio}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="alert alert-info">
              No hay asignaciones activas para el año lectivo seleccionado.
            </div>
          )}
        </section>
      )}

      {selectedAsignacionId && (
        <section className="panel-card">
          <div className="panel-card__title">
            <span className="material-icons">calendar_month</span>
            <h3>Período académico</h3>
          </div>

          {cargandoPeriodos ? (
            <div className="loading">Determinando período activo…</div>
          ) : periodos.length ? (
            <div className="periodo-selector">
              <div className="periodo-selector__primary">
                <label htmlFor="periodo-select">Período activo</label>
                <select
                  id="periodo-select"
                  value={selectedPeriodoId ?? ''}
                  onChange={(event) => handlePeriodoChange(Number(event.target.value))}
                  disabled={!puedeCambiarPeriodo}
                >
                  <option value="">Seleccione un período</option>
                  {periodos.map((periodo) => (
                    <option
                      key={periodo.id_periodo}
                      value={periodo.id_periodo}
                      disabled={!puedeCambiarPeriodo && periodo.estado !== 'activo'}
                    >
                      {periodo.nombre_periodo} ({periodo.estado})
                    </option>
                  ))}
                </select>
              </div>

              {!puedeCambiarPeriodo && (
                <small className="text-muted" style={{ display: 'block', marginTop: '6px' }}>
                  Tu rol solo permite ingresar notas en el período activo.
                </small>
              )}

              {periodoActivoId && periodoActivoId === selectedPeriodoId && (
                <span className="status-pill status-pill--success">Período detectado automáticamente</span>
              )}
            </div>
          ) : (
            <div className="alert alert-error">No se encontraron períodos académicos configurados.</div>
          )}

          {advertenciaPeriodo && <div className="alert alert-warning">{advertenciaPeriodo}</div>}
        </section>
      )}

      {selectedAsignacionId && selectedPeriodoId && (
        <section className="panel-card">
          <div className="panel-card__title">
            <span className="material-icons">grading</span>
            <h3>Gestión de calificaciones</h3>
          </div>

          <div className="gestion-header">
            <div>
              <p><strong>Asignatura:</strong> {asignacionSeleccionada?.asignatura_nombre}</p>
              <p><strong>Grupo:</strong> {grupoDetectado || asignacionSeleccionada?.grupo_nombre || 'Sin grupo'}</p>
            </div>
            <div>
              <p><strong>Período:</strong> {periodoSeleccionado?.nombre_periodo}</p>
              <p><strong>Estado:</strong> {periodoSeleccionado?.estado}</p>
            </div>
            <div className="resumen-card">
              <div>
                <strong>{resumen.notasIngresadas}</strong>
                <span>Notas ingresadas</span>
              </div>
              <div>
                <strong>{resumen.pendientes}</strong>
                <span>Pendientes</span>
              </div>
              <div>
                <strong>{resumen.promedio ?? '–'}</strong>
                <span>Promedio</span>
              </div>
            </div>
          </div>

          <div className="gestion-toolbar">
            <input
              type="search"
              placeholder="Buscar estudiante por nombre o ID"
              value={filtroBusqueda}
              onChange={(event) => setFiltroBusqueda(event.target.value)}
            />

            <div className="gestion-toolbar__filters">
              <label>
                <input
                  type="radio"
                  name="filtroEstado"
                  value="todos"
                  checked={filtroEstado === 'todos'}
                  onChange={() => setFiltroEstado('todos')}
                />
                Todos
              </label>
              <label>
                <input
                  type="radio"
                  name="filtroEstado"
                  value="con-nota"
                  checked={filtroEstado === 'con-nota'}
                  onChange={() => setFiltroEstado('con-nota')}
                />
                Solo con nota
              </label>
              <label>
                <input
                  type="radio"
                  name="filtroEstado"
                  value="sin-nota"
                  checked={filtroEstado === 'sin-nota'}
                  onChange={() => setFiltroEstado('sin-nota')}
                />
                Solo sin nota
              </label>
            </div>

            <button
              className="btn btn-primary"
              onClick={guardarNotasSeleccionadas}
              disabled={!puedeEditarNotas || guardandoTodo}
            >
              {guardandoTodo ? 'Guardando…' : 'Guardar todo'}
            </button>
          </div>

          {!!mensajeBloqueo && (
            <div className="alert alert-info">
              {mensajeBloqueo}
            </div>
          )}

          {cargandoEstudiantes ? (
            <div className="loading">Cargando estudiantes…</div>
          ) : estudiantesFiltrados.length ? (
            <div className="tabla-notas">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Estudiante</th>
                    <th>Nota (0.0 – 5.0)</th>
                    <th>Fallas</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantesFiltrados.map((estudiante, index) => {
                    const notaBaja = estudiante.calificacion_actual !== undefined && estudiante.calificacion_actual !== null && estudiante.calificacion_actual < 3;
                    const notaAlta = estudiante.calificacion_actual !== undefined && estudiante.calificacion_actual !== null && estudiante.calificacion_actual >= 4.5;

                    return (
                      <tr key={estudiante.id_persona}>
                        <td>{index + 1}</td>
                        <td>
                          <div className="estudiante-info">
                            {estudiante.foto && <img src={estudiante.foto} alt={estudiante.nombre} />}
                            <div>
                              <strong>{estudiante.nombre} {estudiante.apellido}</strong>
                                <span>ID interno: {estudiante.id_persona}</span>
                                <span>Documento: {estudiante.numeroIdentificacion || 'No registrado'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={estudiante.notaEditable}
                            onChange={(event) => handleNotaInputChange(estudiante.id_persona, event.target.value)}
                            disabled={!puedeEditarNotas}
                            className={[
                              notaBaja ? 'nota-baja' : '',
                              notaAlta ? 'nota-alta' : '',
                              estudiante.error ? 'input-error' : '',
                            ].join(' ').trim()}
                            placeholder="–"
                          />
                          {estudiante.error && <small className="input-error-message">{estudiante.error}</small>}
                        </td>
                        <td>
                          <div className="fallas-info">
                            <span>Total: {estudiante.total_fallas || 0}</span>
                            <span>Justificadas: {estudiante.total_fallas_justificadas || 0}</span>
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            onClick={() => guardarNota(estudiante)}
                            disabled={!puedeEditarNotas || estudiante.estaGuardando}
                          >
                            {estudiante.estaGuardando ? 'Guardando…' : 'Guardar'}
                          </button>
                          {estudiante.ultimaActualizacion && (
                            <small className="ultima-actualizacion">
                              Actualizado {estudiante.ultimaActualizacion.toLocaleTimeString()}
                            </small>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-info">No hay estudiantes que coincidan con los filtros actuales.</div>
          )}
        </section>
      )}
    </div>
  );
};

export default ReporteNotasPanel;


