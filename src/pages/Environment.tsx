import React from 'react';
import { Thermometer, Droplets, Activity, AlertTriangle, CheckCircle2, XCircle, Clock, Navigation } from 'lucide-react';
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
      case 'stale':
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
      case 'stale':
        return <AlertTriangle size={16} color="var(--warning-color)" />;
      case 'critical':
      case 'CRITICAL':
        return <XCircle size={16} color="var(--danger-color)" />;
      default:
        return <Clock size={16} color="var(--text-disabled)" />;
    }
  };

  /**
   * Render a gas sensor card ONLY if valid numeric data exists.
   * Hides the card completely (returns null) when value is null/undefined.
   */
  const renderGasCard = (name: string, formula: string, reading: EnvironmentalReading) => {
    if (reading?.value === null || reading?.value === undefined || isNaN(reading.value)) {
      return null;
    }

    const displayValue = reading.value.toString();

    return (
      <div className="status-card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {getStatusIcon(reading.status)}
            <h3 style={{ margin: 0 }}>
              {name}{' '}
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {formula}
              </span>
            </h3>
          </div>
          <StatusBadge
            variant={
              reading.status === 'ok'
                ? 'connected'
                : reading.status === 'warning'
                ? 'warning'
                : 'critical'
            }
            label={reading.status.toUpperCase()}
            showDot={false}
          />
        </div>
        <div className="card-body">
          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: getStatusColor(reading.status),
              marginBottom: '8px',
            }}
          >
            {displayValue}{' '}
            {reading.unit && (
              <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
                {reading.unit}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Freshness: {reading.dataFreshness || 'LIVE'}</span>
            <span>
              {reading.timestamp
                ? new Date(reading.timestamp).toLocaleTimeString()
                : 'No data'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render an atmospheric/metric card ONLY if valid numeric data exists.
   */
  const renderMetricCard = (
    name: string,
    icon: React.ReactNode,
    reading: EnvironmentalReading
  ) => {
    if (reading?.value === null || reading?.value === undefined || isNaN(reading.value)) {
      return null;
    }

    return (
      <div className="status-card">
        <div className="card-header">
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon} {name}
          </h3>
          <StatusBadge
            variant={reading.status === 'ok' ? 'connected' : 'warning'}
            label={reading.status.toUpperCase()}
          />
        </div>
        <div className="card-body">
          <div
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: getStatusColor(reading.status),
              marginBottom: '8px',
            }}
          >
            {reading.value}{' '}
            {reading.unit && (
              <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
                {reading.unit}
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Freshness: {reading.dataFreshness || 'LIVE'}
          </div>
        </div>
      </div>
    );
  };

  // Count active gas cards and top metric cards
  const gasCards = [
    renderGasCard('MQ-4 Methane', 'CH₄', readings.methane),
    renderGasCard('MQ-7 Carbon Monoxide', 'CO', readings.co),
    renderGasCard('Carbon Dioxide', 'CO₂', readings.co2),
    renderGasCard('Hydrogen Sulfide', 'H₂S', readings.h2s),
    renderGasCard('Oxygen', 'O₂', readings.o2),
  ].filter(Boolean);

  const metricCards = [
    renderMetricCard('Distance', <Navigation size={18} />, readings.distance),
    renderMetricCard('Humidity', <Droplets size={18} />, readings.humidity),
    renderMetricCard('Temperature', <Thermometer size={18} />, readings.temperature),
  ].filter(Boolean);

  // Filter active sensors with real communication / readings
  const activeSensors = sensors.filter((s) => s.status !== 'DISCONNECTED');

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
                Waiting for live sensor data stream. Check sensor connectivity.
              </p>
            )}
          </div>
        </div>

        {metricCards.length > 0 && (
          <div className="cc-row-2">
            {metricCards}
          </div>
        )}
      </div>

      <h2 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
        Gas Sensors
      </h2>
      <div className="cc-row-3" style={{ marginBottom: '24px' }}>
        {gasCards.length > 0 ? (
          gasCards
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px 0', color: 'var(--text-disabled)', fontSize: '14px' }}>
            No live gas sensor data streaming
          </div>
        )}
      </div>

      <div className="cc-row-2">
        <div className="status-card">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Sensor Health</h3>
          </div>
          <div className="card-body">
            {activeSensors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
                No active environmental sensors streaming
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
                  {activeSensors.map((sensor) => (
                    <tr key={sensor.sensorId} style={{ borderBottom: '1px solid var(--border-dark)' }}>
                      <td style={{ padding: '8px' }}>{sensor.sensorId}</td>
                      <td style={{ padding: '8px' }}>{sensor.sensorType}</td>
                      <td style={{ padding: '8px' }}>
                        <StatusBadge
                          variant={
                            sensor.status === 'CONNECTED'
                              ? 'connected'
                              : sensor.status === 'STALE'
                              ? 'warning'
                              : 'unavailable'
                          }
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
