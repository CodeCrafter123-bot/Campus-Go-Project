// Simple info page shown at http://localhost:3000
export default function Home() {
  return (
    <main>
      <h1>CampusGo API</h1>
      <p>This is the backend of the CampusGo mobile app. It only serves JSON under <code>/api</code>.</p>
      <p>
        Check that it works: <a href="/api/health">/api/health</a>
      </p>
    </main>
  );
}
