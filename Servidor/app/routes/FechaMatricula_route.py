from fastapi import HTTPException, APIRouter
from typing import List
from ..models.Ubicacion_model import FechaMatricula
from ..core.database import get_db
import mysql.connector

router = APIRouter(prefix="/fechamatricula", tags=["FechaMatricula"])

@router.get("/anios", response_model=List[int])
async def listar_anios():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT DISTINCT al.anio 
                FROM fecha_matricula fm
                JOIN anio_lectivo al ON fm.id_anio_lectivo = al.id_anio_lectivo
                WHERE al.fecha_eliminacion IS NULL
            """)
            rows = cursor.fetchall()
            return [row[0] for row in rows]
    except mysql.connector.Error as e:
        raise HTTPException(status_code=400, detail=f"Error en MySQL: {str(e)}")

@router.get("/", response_model=List[FechaMatricula])
async def listar_fecha_matriculas():
    try:
        with get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            sql = "SELECT * FROM fecha_matricula WHERE fecha_eliminacion IS NULL"
            cursor.execute(sql)
            rows = cursor.fetchall()

            fecha_matriculas: List[FechaMatricula] = []
            for r in rows:
                fecha_matriculas.append(FechaMatricula(
                    id_fecha_matricula=r["id_fecha_matricula"],
                    id_anio_lectivo=r["id_anio_lectivo"],
                    fecha_inicio=r["fecha_inicio"],
                    fecha_fin=r["fecha_fin"],
                ))
            return fecha_matriculas
    except mysql.connector.Error as e:
        raise HTTPException(status_code=400, detail=f"Error al listar FechaMatriculas: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inesperado: {str(e)}")

@router.post("/", response_model=dict)
async def crear_fecha_matricula(fecha_matricula: FechaMatricula):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            # Validar que id_anio_lectivo exista
            cursor.execute(
                "SELECT id_anio_lectivo FROM anio_lectivo WHERE id_anio_lectivo = %s AND fecha_eliminacion IS NULL",
                (fecha_matricula.id_anio_lectivo,)
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=400, detail="El id_anio_lectivo no existe")

            sql = """
                INSERT INTO fecha_matricula (id_anio_lectivo, fecha_inicio, fecha_fin)
                VALUES (%s, %s, %s)
            """
            cursor.execute(sql, (
                fecha_matricula.id_anio_lectivo,
                fecha_matricula.fecha_inicio,
                fecha_matricula.fecha_fin
            ))
            conn.commit()
            return {"mensaje": "FechaMatricula creado con éxito"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=400, detail=f"Error al crear FechaMatricula: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Error de validación: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inesperado: {str(e)}")

@router.delete("/{fecha_matricula_id}", response_model=dict)
async def eliminar_fecha_matricula(fecha_matricula_id: int):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            # Verificar si hay matrículas asociadas
            cursor.execute("SELECT COUNT(*) FROM matricula WHERE id_fecha_matricula = %s", (fecha_matricula_id,))
            if cursor.fetchone()[0] > 0:
                raise HTTPException(status_code=400, detail="No se puede eliminar: Hay matrículas asociadas a esta fecha.")

            sql = "UPDATE fecha_matricula SET fecha_eliminacion = CURRENT_TIMESTAMP WHERE id_fecha_matricula = %s"
            cursor.execute(sql, (fecha_matricula_id,))
            conn.commit()

            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="FechaMatricula no encontrado")

            return {"mensaje": "FechaMatricula eliminado con éxito"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=400, detail=f"Error al eliminar FechaMatricula: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inesperado: {str(e)}")

@router.get("/{fecha_matricula_id}", response_model=FechaMatricula)
async def obtener_fecha_matricula(fecha_matricula_id: int):
    try:
        with get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            sql = "SELECT * FROM fecha_matricula WHERE id_fecha_matricula = %s AND fecha_eliminacion IS NULL"
            cursor.execute(sql, (fecha_matricula_id,))
            r = cursor.fetchone()

            if not r:
                raise HTTPException(status_code=404, detail="FechaMatricula no encontrado")

            return FechaMatricula(
                id_fecha_matricula=r["id_fecha_matricula"],
                id_anio_lectivo=r["id_anio_lectivo"],
                fecha_inicio=r["fecha_inicio"],
                fecha_fin=r["fecha_fin"]
            )
    except mysql.connector.Error as e:
        raise HTTPException(status_code=400, detail=f"Error al obtener FechaMatricula: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inesperado: {str(e)}")

@router.put("/{fecha_matricula_id}", response_model=dict)
async def actualizar_fecha_matricula(fecha_matricula_id: int, fecha_matricula: FechaMatricula):
    try:
        with get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            # Verificar si el item existe
            cursor.execute("SELECT * FROM fecha_matricula WHERE id_fecha_matricula = %s AND fecha_eliminacion IS NULL", (fecha_matricula_id,))
            fecha_matricula_existente = cursor.fetchone()
            if not fecha_matricula_existente:
                raise HTTPException(status_code=404, detail="FechaMatricula no encontrado")

            # Validar que id_anio_lectivo exista si se proporciona
            if fecha_matricula.id_anio_lectivo:
                cursor.execute(
                    "SELECT id_anio_lectivo FROM anio_lectivo WHERE id_anio_lectivo = %s AND fecha_eliminacion IS NULL",
                    (fecha_matricula.id_anio_lectivo,)
                )
                if not cursor.fetchone():
                    raise HTTPException(status_code=400, detail="El id_anio_lectivo no existe")

            # Merge: decidir el valor final para cada campo
            campos = ["id_anio_lectivo", "fecha_inicio", "fecha_fin"]
            def valor_final(campo: str):
                val = getattr(fecha_matricula, campo, None)
                if val is None:
                    return fecha_matricula_existente.get(campo)
                return val

            valores_para_update = [valor_final(c) for c in campos]

            sql = """
                UPDATE fecha_matricula
                SET id_anio_lectivo = %s,
                    fecha_inicio = %s,
                    fecha_fin = %s
                WHERE id_fecha_matricula = %s
            """
            cursor.execute(sql, (*valores_para_update, fecha_matricula_id))
            conn.commit()

            if cursor.rowcount == 0:
                raise HTTPException(status_code=400, detail="No se realizó ninguna modificación")

            return {"mensaje": "FechaMatricula actualizado con éxito"}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=400, detail=f"Error en MySQL: {getattr(err, 'msg', str(err))}")
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Error inesperado: {str(err)}")