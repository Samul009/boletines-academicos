import React from 'react';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-logo">
          <h1>Centro Educativo Asambleas De Dios</h1>
        </div>
        <div className="header-title">
          <h2>Panel de Control</h2>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-row">
          <div className="dashboard-card">
            <div className="card-icon green-icon"></div>
            <div className="card-title">Ingreso Académico</div>
          </div>
          <div className="dashboard-card">
            <div className="card-icon user-icon"></div>
            <div className="card-title">Conoce tu usuario</div>
          </div>
          <div className="dashboard-card">
            <div className="card-icon password-icon"></div>
            <div className="card-title">Recordar contraseña</div>
          </div>
          <div className="dashboard-card">
            <div className="card-icon grades-icon"></div>
            <div className="card-title">Ver Calificaciones</div>
          </div>
        </div>

        <div className="dashboard-row">
          <div className="dashboard-card">
            <div className="card-icon payment-icon"></div>
            <div className="card-title">Liquidación Estudiantes</div>
          </div>
          <div className="dashboard-card">
            <div className="card-icon invoice-icon"></div>
            <div className="card-title">Generador de Facturas</div>
          </div>
          <div className="dashboard-card">
            <div className="card-icon online-payment-icon"></div>
            <div className="card-title">Pago en Línea</div>
          </div>
          <div className="dashboard-card">
            <div className="card-icon search-icon"></div>
            <div className="card-title">Consulta Estudiante</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;