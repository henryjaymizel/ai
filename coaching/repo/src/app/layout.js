import './globals.css';
import Nav from '../components/Nav';

export const metadata = {
  title: 'Sales Coaching Tool',
  description: 'AI-powered sales coaching with Gong call analysis',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Nav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
