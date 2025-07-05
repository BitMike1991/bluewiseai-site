// src/components/Layout.js
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
