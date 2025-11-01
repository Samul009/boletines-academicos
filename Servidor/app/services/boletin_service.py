from __future__ import annotations

from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Dict, List, Tuple

from docxtpl import DocxTemplate
from fastapi import HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.models import (
    AnioLectivo,
    Asignatura,
    Calificacion,
    DocenteAsignatura,
    Falla,
    Grado,
    GradoAsignatura,
    Grupo,
    Jornada,
    Matricula,
    PeriodoAcademico,
    Persona,
)


def _get_template_path() -> Path:
    settings = get_settings()
    template_path = Path(settings.BOLETIN_TEMPLATE_PATH)
    if not template_path.exists():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se encontró la plantilla de boletín configurada en '{template_path}'."
        )
    return template_path


def _calcular_desempeno(nota: float | None) -> str:
    if nota is None:
        return ""
    if nota >= 4.5:
        return "SUPERIOR"
    if nota >= 4.0:
        return "ALTO"
    if nota >= 3.0:
        return "BÁSICO"
    return "BAJO"


def _formatear_fecha(fecha: datetime | None, formato: str = "%d/%m/%Y") -> str:
    if not fecha:
        return ""
    if isinstance(fecha, datetime):
        return fecha.strftime(formato)
    return fecha.strftime(formato)


def _normalizar_estado(valor: str | None) -> str:
    if not valor:
        return ""
    return valor.lower()


def obtener_contexto_boletin(
    db: Session,
    grupo_id: int,
    periodo_id: int,
) -> Dict:
    grupo: Grupo | None = db.get(Grupo, grupo_id)
    if not grupo or grupo.fecha_eliminacion is not None:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    periodo: PeriodoAcademico | None = db.get(PeriodoAcademico, periodo_id)
    if not periodo or periodo.fecha_eliminacion is not None:
        raise HTTPException(status_code=404, detail="Período no encontrado")

    if periodo.id_anio_lectivo != grupo.id_anio_lectivo:
        raise HTTPException(status_code=400, detail="El período seleccionado no pertenece al año lectivo del grupo")

    anio: AnioLectivo | None = db.get(AnioLectivo, grupo.id_anio_lectivo)
    grado: Grado | None = db.get(Grado, grupo.id_grado)
    jornada: Jornada | None = db.get(Jornada, grupo.id_jornada) if getattr(grupo, "id_jornada", None) else None

    estudiantes_rows = (
        db.query(Persona, Matricula)
        .join(Matricula, Matricula.id_persona == Persona.id_persona)
        .filter(
            Matricula.id_grupo == grupo_id,
            Matricula.id_anio_lectivo == grupo.id_anio_lectivo,
            Matricula.activo.is_(True),
            Matricula.fecha_eliminacion.is_(None),
            Persona.fecha_eliminacion.is_(None)
        )
        .order_by(Persona.apellido.asc(), Persona.nombre.asc())
        .all()
    )

    if not estudiantes_rows:
        raise HTTPException(status_code=400, detail="No hay estudiantes matriculados en el grupo seleccionado")

    estudiante_ids = [persona.id_persona for persona, _ in estudiantes_rows]

    # Asignaturas asignadas al grupo (incluyendo asignaciones por grado sin grupo específico)
    asignaciones: List[DocenteAsignatura] = (
        db.query(DocenteAsignatura)
        .join(Asignatura)
        .filter(
            DocenteAsignatura.fecha_eliminacion.is_(None),
            DocenteAsignatura.id_anio_lectivo == grupo.id_anio_lectivo,
            or_(
                DocenteAsignatura.id_grupo == grupo_id,
                and_(
                    DocenteAsignatura.id_grupo.is_(None),
                    DocenteAsignatura.id_grado == grupo.id_grado,
                )
            )
        )
        .all()
    )

    if not asignaciones:
        raise HTTPException(status_code=400, detail="No hay asignaturas asignadas a este grupo para el año lectivo seleccionado")

    asignatura_ids = [asig.id_asignatura for asig in asignaciones]

    calificaciones = (
        db.query(Calificacion)
        .filter(
            Calificacion.id_periodo == periodo_id,
            Calificacion.id_anio_lectivo == grupo.id_anio_lectivo,
            Calificacion.id_asignatura.in_(asignatura_ids),
            Calificacion.id_persona.in_(estudiante_ids),
            Calificacion.fecha_eliminacion.is_(None)
        )
        .all()
    )

    calificacion_map: Dict[Tuple[int, int], float] = {
        (calificacion.id_persona, calificacion.id_asignatura): calificacion.calificacion_numerica
        for calificacion in calificaciones
        if calificacion.calificacion_numerica is not None
    }

    fallas = (
        db.query(Falla)
        .filter(
            Falla.id_persona.in_(estudiante_ids),
            Falla.id_asignatura.in_(asignatura_ids),
            Falla.fecha_eliminacion.is_(None),
            Falla.fecha_falla >= periodo.fecha_inicio,
            Falla.fecha_falla <= periodo.fecha_fin
        )
        .all()
    )

    fallas_map: Dict[Tuple[int, int], Dict[str, int]] = {}
    for falla in fallas:
        key = (falla.id_persona, falla.id_asignatura)
        bucket = fallas_map.setdefault(key, {"justificadas": 0, "injustificadas": 0})
        if falla.es_justificada:
            bucket["justificadas"] += 1
        else:
            bucket["injustificadas"] += 1

    grado_asignaturas = (
        db.query(GradoAsignatura)
        .filter(
            GradoAsignatura.id_grado == grupo.id_grado,
            GradoAsignatura.id_anio_lectivo == grupo.id_anio_lectivo,
            GradoAsignatura.fecha_eliminacion.is_(None)
        )
        .all()
    )
    intensidad_map = {
        ga.id_asignatura: ga.intensidad_horaria for ga in grado_asignaturas
    }

    estudiantes_context: List[Dict] = []
    for persona, matricula in estudiantes_rows:
        asignaturas_estudiante: List[Dict] = []
        notas_acumuladas: List[float] = []

        for asignacion in asignaciones:
            asignatura: Asignatura = asignacion.asignatura
            nota = calificacion_map.get((persona.id_persona, asignacion.id_asignatura))
            if nota is not None:
                notas_acumuladas.append(nota)

            fallas_info = fallas_map.get((persona.id_persona, asignacion.id_asignatura), {"justificadas": 0, "injustificadas": 0})

            asignaturas_estudiante.append({
                "asignatura": asignatura.nombre_asignatura,
                "nota": f"{nota:.1f}" if nota is not None else "",
                "desempeno": _calcular_desempeno(nota),
                "intensidad_horaria": intensidad_map.get(asignacion.id_asignatura, asignatura.intensidad_horaria or 1),
                "fallas_justificadas": fallas_info["justificadas"],
                "fallas_injustificadas": fallas_info["injustificadas"],
            })

        promedio = sum(notas_acumuladas) / len(notas_acumuladas) if notas_acumuladas else 0

        estudiantes_context.append({
            "nombre_completo": f"{persona.apellido} {persona.nombre}",
            "primer_nombre": persona.nombre.split()[0] if persona.nombre else persona.nombre,
            "segundo_nombre": " ".join(persona.nombre.split()[1:]) if persona and len(persona.nombre.split()) > 1 else "",
            "apellido": persona.apellido,
            "numero_identificacion": persona.numero_identificacion,
            "codigo_matricula": getattr(matricula, "codigo_matricula", getattr(matricula, "id_matricula", "")),
            "asignaturas": asignaturas_estudiante,
            "promedio": f"{promedio:.1f}" if notas_acumuladas else "",
        })

    estudiantes_context.sort(key=lambda e: e["nombre_completo"])

    context = {
        "institucion": {
            "nombre": "COLEGIO",  # Personalizar según corresponda
        },
        "grupo": {
            "codigo": grupo.codigo_grupo,
            "grado": grado.nombre_grado if grado else "",
            "nivel": grado.nivel if grado else "",
            "jornada": jornada.nombre if jornada else "",
            "anio": anio.anio if anio else "",
        },
        "periodo": {
            "nombre": periodo.nombre_periodo,
            "estado": periodo.estado,
            "fecha_inicio": _formatear_fecha(periodo.fecha_inicio),
            "fecha_fin": _formatear_fecha(periodo.fecha_fin),
        },
        "fecha_generacion": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "estudiantes": estudiantes_context,
    }

    return context


def generar_boletin_docx(db: Session, grupo_id: int, periodo_id: int) -> Tuple[BytesIO, str]:
    context = obtener_contexto_boletin(db, grupo_id, periodo_id)
    template_path = _get_template_path()

    doc = DocxTemplate(str(template_path))
    doc.render(context)

    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)

    periodo_nombre = context["periodo"]["nombre"]
    grupo_codigo = context["grupo"]["codigo"]
    filename = f"Boletines_{grupo_codigo}_{periodo_nombre}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"

    return buffer, filename


