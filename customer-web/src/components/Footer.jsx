import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 mt-10 py-8">
      <div className="max-w-6xl mx-auto px-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink/50">
        <span className="font-display font-700 text-ink/70">Sheegra</span>
        <Link to="/terms" className="hover:text-leaf">Terms of Service</Link>
        <Link to="/privacy" className="hover:text-leaf">Privacy Policy</Link>
        <Link to="/refund-policy" className="hover:text-leaf">Cancellation & Refunds</Link>
      </div>
    </footer>
  );
}
