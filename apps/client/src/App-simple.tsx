import { useState, useEffect } from "react";

function App() {
  const [serverStatus, setServerStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");
  const [activeTab, setActiveTab] = useState<"participants" | "exchanges">(
    "participants",
  );

  // Check server status on load
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/health");
        if (response.ok) {
          setServerStatus("online");
        } else {
          setServerStatus("offline");
        }
      } catch (error) {
        console.error("Server health check failed:", error);
        setServerStatus("offline");
      }
    };

    checkServer();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                🎅 Secret Santa Manager
              </h1>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  serverStatus === "online"
                    ? "bg-green-100 text-green-800"
                    : serverStatus === "offline"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {serverStatus === "online"
                  ? "● Online"
                  : serverStatus === "offline"
                    ? "● Offline"
                    : "● Checking..."}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab("participants")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "participants"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              👥 Participants
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("exchanges")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "exchanges"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🎁 Gift Exchanges
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {serverStatus === "offline" && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Server Offline
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  Cannot connect to the Secret Santa server. Please make sure
                  the server is running on localhost:3000.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {activeTab === "participants"
              ? "Participants Management"
              : "Gift Exchanges Management"}
          </h2>

          {activeTab === "participants" ? (
            <div>
              <p className="text-gray-600 mb-4">
                Manage people who can participate in Secret Santa exchanges.
              </p>
              <div className="space-y-4">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  onClick={() =>
                    alert("Add participant functionality coming soon!")
                  }
                >
                  + Add Participant
                </button>
                <div className="text-sm text-gray-500">
                  No participants yet. Click the button above to add your first
                  participant.
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                Create and manage Secret Santa gift exchanges.
              </p>
              <div className="space-y-4">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  onClick={() =>
                    alert("Create exchange functionality coming soon!")
                  }
                >
                  + Create Exchange
                </button>
                <div className="text-sm text-gray-500">
                  No gift exchanges yet. Click the button above to create your
                  first exchange.
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
