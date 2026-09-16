import React, { useState } from 'react';
import { Wind, Thermometer, Droplets, Activity, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import StatusBadge from '../components/shared/StatusBadge';
import type { EnvironmentalReading, SensorStatus } from '../types';

export default function Environment() {
  const { state } = useAppContext();
  const { environment } = state;
  const { readings, overallStatus, sensors, history } = environment;

  const getStatusColor = (status: SensorStatus | string) => {
    switch (status) {
      case 'ok':
      case 'NORMAL':
        return 'var(--success-color)';
      case 'warning':
      case 'WARNING':
        return 'var(--warning-color)';
      case 'critical':
      case 'CRITICAL':
        return 'var(--danger-color)';
      default:
        return 'var(--text-disabled)';
    }
  };

  const getStatusIcon = (status: SensorStatus | string) => {
    switch (status) {
      case 'ok':
      case 'NORMAL':
        return <CheckCircle2 size={16} color="var(--success-color)" />;
      case 'warning':
      case 'WARNING':
        return <AlertTriangle size={16} color="var(--warning-color)" />;
      case 'critical':
      case 'CRITICAL':
        return <XCircle size={16} color="var(--danger-color)" />;
      default:
        return <Clock size={16} color="var(--text-disabled)" />;
    }
  };

  const renderGasCard = (name: string, formula: string, reading: EnvironmentalReading) => (
    <div className="status-card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getStatusIcon(reading.status)}
          <h3 style={{ margin: 0 }}>{name} <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formula}</span></h3>
        </div>
        <StatusBadge 
          variant={reading.value === null ? 'unavailable' : reading.status === 'ok' ? 'connected' : reading.status === 'warning' ? 'warning' : 'critical'} 
          label={reading.value === null ? 'Offline' : reading.status.toUpperCase()} 
          showDot={false} 
        />
      </div>
      <div className="card-body">
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: getStatusColor(reading.status), marginBottom: '8px' }}>
          {reading.value !== null ? reading.value : '—'} <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>{reading.unit}</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Freshness: {reading.dataFreshness}</span>
          <span>{reading.timestamp ? new Date(reading.timestamp).toLocaleTimeString() : 'No data'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in" aria-label="Environment dashboard">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Environmental Monitoring</h1>
        <p className="page-sub">Live telemetry for gas, temperature, and atmospheric conditions</p>
      </div>

      <div className="cc-row-2" style={{ marginBottom: '24px' }}>
        <div className="status-card" style={{ borderLeft: `4px solid ${getStatusColor(overallStatus)}` }}>
          <div className="card-header">
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} /> Overall Environmental Status
            </h3>
          </div>
          <div className="card-body">
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: getStatusColor(overallStatus) }}>
              {overallStatus}
            </div>
            {overallStatus === 'UNKNOWN' && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                Insufficient data to determine overall status. Check sensor connectivity.
              </p>
            )}
          </div>
        </div>
        
        <div className="cc-row-2">
          <div className="status-card">
            <div className="card-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Thermometer size={18} /> Temperature
              </h3>
              <StatusBadge 
                variant={readings.temperature.status === 'ok' ? 'connected' : readings.temperature.status === 'warning' ? 'warning' : readings.temperature.status === 'critical' ? 'critical' : 'unavailable'} 
                label={readings.temperature.status.toUpperCase()} 
              />
            </div>
            <div className="card-body">
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: getStatusColor(readings.temperature.status), marginBottom: '8px' }}>
                {readings.temperature.value !== null ? readings.temperature.value : '—'} <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>{readings.temperature.unit}</span>
              </div>
            </div>
          </div>
          
          <div className="status-card">
            <div className="card-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Droplets size={18} /> Humidity
              </h3>
              <StatusBadge 
                variant={readings.humidity.status === 'ok' ? 'connected' : readings.humidity.status === 'warning' ? 'warning' : readings.humidity.status === 'critical' ? 'critical' : 'unavailable'} 
                label={readings.humidity.status.toUpperCase()} 
              />
            </div>
            <div className="card-body">
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: getStatusColor(readings.humidity.status), marginBottom: '8px' }}>
                {readings.humidity.value !== null ? readings.humidity.value : '—'} <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>{readings.humidity.unit}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Gas Sensors</h2>
      <div className="cc-row-3" style={{ marginBottom: '24px' }}>
        {renderGasCard('Methane', 'CH₄', readings.methane)}
        {renderGasCard('Carbon Monoxide', 'CO', readings.co)}
        {renderGasCard('Carbon Dioxide', 'CO₂', readings.co2)}
        {renderGasCard('Hydrogen Sulfide', 'H₂S', readings.h2s)}
        {renderGasCard('Oxygen', 'O₂', readings.o2)}
      </div>

      <div className="cc-row-2">
        <div className="status-card">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Sensor Health</h3>
          </div>
          <div className="card-body">
            {sensors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
                No environmental sensors connected
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>ID</th>
                    <th style={{ padding: '8px' }}>Type</th>
                    <th style={{ padding: '8px' }}>Status</th>
                    <th style={{ padding: '8px' }}>Last Comm</th>
                  </tr>
                </thead>
                <tbody>
                  {sensors.map((sensor) => (
                    <tr key={sensor.sensorId} style={{ borderBottom: '1px solid var(--border-dark)' }}>
                      <td style={{ padding: '8px' }}>{sensor.sensorId}</td>
                      <td style={{ padding: '8px' }}>{sensor.sensorType}</td>
                      <td style={{ padding: '8px' }}>
                        <StatusBadge 
                          variant={sensor.status === 'CONNECTED' ? 'connected' : sensor.status === 'STALE' ? 'warning' : 'unavailable'} 
                          label={sensor.status} 
                        />
                      </td>
                      <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                        {sensor.lastCommunication ? new Date(sensor.lastCommunication).toLocaleTimeString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="status-card">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Environment History</h3>
          </div>
          <div className="card-body">
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
                Historical data unavailable
              </div>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Time</th>
                      <th style={{ padding: '8px' }}>Parameter</th>
                      <th style={{ padding: '8px' }}>Value</th>
                      <th style={{ padding: '8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice().reverse().map((record) => (
                      <tr key={record.id} style={{ borderBottom: '1px solid var(--border-dark)' }}>
                        <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: '8px' }}>{record.parameter}</td>
                        <td style={{ padding: '8px', color: getStatusColor(record.status) }}>
                          {record.value} {record.unit}
                        </td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ color: getStatusColor(record.status), fontSize: '12px', fontWeight: 'bold' }}>
                            {record.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
