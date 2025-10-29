# core/pdf.py
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from jinja2 import Environment, FileSystemLoader
from io import BytesIO
import os

def generar_boletin_pdf(data: dict) -> BytesIO:
    buffer = BytesIO()
    
    # Configuración del documento
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch)
    styles = getSampleStyleSheet()
    
    # Estilos personalizados
    styles.add(ParagraphStyle(name='TitleCenter', fontSize=16, alignment=1, spaceAfter=20))
    styles.add(ParagraphStyle(name='Subtitle', fontSize=12, alignment=1, spaceAfter=10))
    styles.add(ParagraphStyle(name='Info', fontSize=10, spaceAfter=6))
    
    story = []
    
    # === ENCABEZADO ===
    logo_path = "static/logo.png"  # Asegúrate de tenerlo
    if os.path.exists(logo_path):
        logo = Image(logo_path, width=1*inch, height=1*inch)
        logo.hAlign = 'LEFT'
        story.append(logo)
    
    story.append(Paragraph("COLEGIO EJEMPLO", styles['TitleCenter']))
    story.append(Paragraph("Boletín de Calificaciones", styles['Subtitle']))
    story.append(Spacer(1, 0.2*inch))
    
    # === DATOS DEL ESTUDIANTE ===
    info = f"""
    <b>Estudiante:</b> {data['estudiante']['nombre']} {data['estudiante']['apellido']}<br/>
    <b>Grado:</b> {data['grado']} - Grupo: {data['grupo']}<br/>
    <b>Período:</b> {data['periodo']} - Año: {data['anio']}<br/>
    <b>Director de Grupo:</b> {data['director']}
    """
    story.append(Paragraph(info, styles['Info']))
    story.append(Spacer(1, 0.3*inch))
    
    # === TABLA DE CALIFICACIONES ===
    table_data = [["Asignatura", "Nota", "Fallas", "Observación"]]
    
    for cal in data['calificaciones']:
        fallas = f"{cal['fallas_injustificadas']}I / {cal['fallas_justificadas']}J"
        table_data.append([
            cal['asignatura'],
            str(cal['calificacion']),
            fallas,
            cal.get('observacion', '')
        ])
    
    # Promedio
    table_data.append(["", "Promedio:", f"{data['promedio']:.2f}", ""])
    
    table = Table(table_data, colWidths=[3*inch, 0.8*inch, 1*inch, 2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.grey),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 12),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('BACKGROUND', (0,1), (-1,-2), colors.beige),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('ROWBACKGROUNDS', (0,-1), (-1,-1), [colors.lightgrey, colors.white])
    ]))
    story.append(table)
    
    # === FIRMA ===
    story.append(Spacer(1, 1*inch))
    story.append(Paragraph("_________________________", styles['Normal']))
    story.append(Paragraph(f"{data['director']}", styles['Normal']))
    story.append(Paragraph("Director de Grupo", styles['Normal']))
    
    # Generar PDF
    doc.build(story)
    buffer.seek(0)
    return buffer