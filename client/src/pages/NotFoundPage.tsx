import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-pitchBlack flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Number */}
        <div className="text-8xl font-bold text-vanillaCustard mb-4">
          404
        </div>
        
        {/* Error Message */}
        <h1 className="text-2xl font-bold text-vanillaCustard mb-4">
          Page Not Found
        </h1>
        
        <p className="text-base text-vanillaCustard/90 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved. 
          Don't worry - our community resources are still here to help.
        </p>
        
        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex w-full justify-center rounded-xl bg-powderBlush px-6 py-3 text-lg font-bold text-pitchBlack shadow-soft transition hover:brightness-95"
          >
            🏠 Go Home
          </Link>
          
          <Link
            to="/resources"
            className="inline-flex w-full justify-center rounded-xl border border-vanillaCustard/15 bg-pitchBlack px-6 py-3 text-lg font-bold text-vanillaCustard shadow-soft transition hover:brightness-95"
          >
            🏥 Browse Resources
          </Link>
        </div>
        
        
        {/* Contact Support */}
        <div className="mt-8 p-4 rounded-xl border border-vanillaCustard/15 bg-pitchBlack">
          <p className="text-sm text-vanillaCustard/90 mb-2">
            Still can't find what you need?
          </p>
          <a
            href="mailto:robin@transvoices.us"
            className="text-powderBlush hover:brightness-95 transition font-medium"
          >
            Contact Support
          </a>
        </div>
        
        {/* Emergency Resources */}
        <div className="mt-8 text-xs text-vanillaCustard/70">
          <p className="font-medium mb-2">🆘 Need immediate help?</p>
          <p>LGBT National Hotline: (888) 843-4564</p>
          <p>Trans Lifeline: (877) 565-8860</p>
        </div>
      </div>
    </div>
  );
}
