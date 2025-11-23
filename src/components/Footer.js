import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-midgray py-6">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
        
        {/* Copyright */}
        <p className="text-sm text-center md:text-left">
          © {new Date().getFullYear()} BlueWise AI. All rights reserved.
        </p>

        {/* Social icons */}
        <div className="flex space-x-4 mt-4 md:mt-0">
          <Link
            href="https://linkedin.com/in/bluewiseai"
            target="_blank"
            aria-label="LinkedIn"
            title="LinkedIn"
            className="
              hover:text-blue-600
              transition
              hover:drop-shadow-[0_0_12px_rgba(59,130,246,0.7)]
            "
          >
            <Linkedin className="w-5 h-5" />
          </Link>

          <Link
            href="https://twitter.com/bluewiseai"
            target="_blank"
            aria-label="X (Twitter)"
            title="X (Twitter)"
            className="
              hover:text-blue-600
              transition
              hover:drop-shadow-[0_0_12px_rgba(59,130,246,0.7)]
            "
          >
            <Twitter className="w-5 h-5" />
          </Link>

          <Link
            href="https://github.com/bluewiseai"
            target="_blank"
            aria-label="GitHub"
            title="GitHub"
            className="
              hover:text-blue-600
              transition
              hover:drop-shadow-[0_0_12px_rgba(59,130,246,0.7)]
            "
          >
            <Github className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
