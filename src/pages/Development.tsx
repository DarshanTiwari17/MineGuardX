import './Development.css';

const destinations = [
  'Hazards',
  'Rescue',
  'Route',
  'Rover Control',
  'Comms',
  'Rover Health',
  'Logs',
  'Analytics',
  'Reports',
];

export default function Development() {
  return (
    <section className="development-page" aria-labelledby="development-title">
      <header className="page-header">
        <div>
          <h1 className="page-title" id="development-title">Development</h1>
          <p className="page-sub">
            These destinations are under development and are not yet available for operational use.
          </p>
        </div>
      </header>

      <ul className="development-list" aria-label="Destinations under development">
        {destinations.map((destination) => (
          <li className="development-row" key={destination}>
            <span className="development-destination">{destination}</span>
            <span className="development-status">
              <span className="development-status-dot" aria-hidden="true" />
              Under development
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}