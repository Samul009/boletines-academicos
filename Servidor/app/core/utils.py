# core/utils.py
from decimal import Decimal
from typing import Optional, Union

def calcular_desempeno(nota: Optional[Union[Decimal, float]]) -> Optional[str]:
    """
    Convierte la calificación numérica a la escala de desempeño 
    (SUPERIOR, ALTO, BÁSICO, BAJO).
    
    Escala de Equivalencias (basada en el documento de boletín):
    - SUPERIOR: 4.5 - 5.0
    - ALTO:     4.0 – 4.49
    - BÁSICO:   3.0 – 3.99
    - BAJO:     0.0 – 2.99
    """
    if nota is None:
        return None
        
    # Aseguramos que la nota sea un número flotante para las comparaciones
    nota_f = float(nota) 

    if nota_f >= 4.5: 
        return "SUPERIOR" # 4.5 - 5.0 
    elif nota_f >= 4.0:
        return "ALTO"     # 4.0 – 4.49 
    elif nota_f >= 3.0:
        return "BÁSICO"   # 3.0 – 3.99 
    else: 
        return "BAJO"     # 0.0 – 2.99