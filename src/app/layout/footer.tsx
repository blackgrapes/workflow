export default function Footer() {
  return (
    <footer className="w-full border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 text-sm text-gray-500 flex items-center justify-between">
        <p>© {new Date().getFullYear()} Workflow Management System. All rights reserved.</p>
        <nav className="flex space-x-4">
          <a href="/privacy" className="hover:text-gray-700 transition-colors">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:text-gray-700 transition-colors">
            Terms of Service
          </a>
        </nav>
      </div>
    </footer>
  );
}
