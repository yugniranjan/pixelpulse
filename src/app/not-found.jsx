import './styles/notfound.css';
import { headers } from 'next/headers';

export default async function NotFound() {
  const headersList = await headers();
  const url = headersList.get('x-invoke-path') || headersList.get('referer') || '';
  // fallback to extract pathname from referer or empty string
  const keyword = url.split('/').filter(Boolean).pop() || 'page';

  return (
    <div className="not-found-container">
      <h1 className="not-found-title">This page isn’t part of the game map.
Let’s teleport you back to the fun!</h1>
      <p className="not-found-message">
        Sorry&apos; we couldn&apos;t find the{' '}
        <span className="highlight">&quot; {keyword} &quot;</span> you were
        looking for.
      </p>
      <p className="suggestion">
        Try checking the URL or go back to the homepage.
      </p>
      <a href="/" className="not-found-link">
        Return to Home
      </a>
    </div>
  );
}
