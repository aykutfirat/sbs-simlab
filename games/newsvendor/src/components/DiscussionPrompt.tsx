export function DiscussionPrompt() {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-bagel-100">
      <h2 className="text-lg font-bold text-bagel-800 mb-4">Connection to BI & Analytics</h2>

      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <p>
          In the real world, companies use <strong>Business Intelligence</strong> dashboards to track
          demand patterns, <strong>predictive analytics</strong> to forecast demand distributions, and{' '}
          <strong>optimization models</strong> (like the critical ratio) to set inventory levels. The
          newsvendor model is one of the simplest examples of how quantitative analytics can
          systematically outperform human intuition.
        </p>

        <div className="bg-bagel-50 rounded-lg p-4 border border-bagel-200">
          <p className="font-semibold text-bagel-800 mb-2">Discussion Question</p>
          <p className="text-bagel-700 italic">
            How would an AI-powered inventory system approach this problem differently than you did?
            What data would it use?
          </p>
        </div>
      </div>
    </div>
  );
}
