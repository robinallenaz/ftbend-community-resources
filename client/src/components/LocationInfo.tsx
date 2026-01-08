import { useState } from 'react';

export default function LocationInfo() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="rounded-xl border border-vanillaCustard/10 bg-pitchBlack/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm text-vanillaCustard/80">
          <span className="font-semibold">Location-based search enabled</span>
          <br />
          📍 = Exact location | 🗺️ = General area center
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-vanillaCustard/60 hover:text-vanillaCustard/80 transition"
          aria-label={showDetails ? 'Hide details' : 'Show details'}
        >
          {showDetails ? 'Hide' : 'Details'}
        </button>
      </div>
      
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-vanillaCustard/10 text-xs text-vanillaCustard/70">
          <h4 className="font-semibold mb-2">Understanding Distance Accuracy:</h4>
          <div className="grid gap-2">
            <div className="flex items-start gap-2">
              <span>📍</span>
              <div>
                <strong>Exact Location:</strong> Distance to specific address or building coordinates.
                Most accurate for healthcare providers and physical locations.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span>🗺️</span>
              <div>
                <strong>Area Center:</strong> Distance to general area center point (e.g., Fort Bend County center).
                Approximate distance for regional services and community resources.
              </div>
            </div>
          </div>
          <p className="mt-2 text-vanillaCustard/60">
            Tip: Always call ahead to confirm locations and availability.
          </p>
        </div>
      )}
    </div>
  );
}
