export function Footer() {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm">
            © 2024 Hypertube. Built with Next.js 14 & NestJS
          </div>
          <div className="flex space-x-6 text-sm text-gray-400 mt-4 md:mt-0">
            <span>🎬 Subject Compliant</span>
            <span>⚡ Transmission Powered</span>
            <span>🐳 Docker Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}