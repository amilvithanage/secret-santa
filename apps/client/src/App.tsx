import { useState, useEffect } from "react";
import { ParticipantManager } from "./components/ParticipantManager";
import { GiftExchangeManager } from "./components/GiftExchangeManager";
import { ExchangeDetails } from "./components/ExchangeDetails";
import type { GiftExchange } from "./types/api";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState<
    "participants" | "exchanges" | "details"
  >("participants");
  const [selectedExchange, setSelectedExchange] = useState<GiftExchange | null>(
    null,
  );
  const [serverStatus, setServerStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");

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

  const handleExchangeSelect = (exchange: GiftExchange) => {
    try {
      setSelectedExchange(exchange);
      setActiveTab("details");
    } catch (error) {
      console.error("Error selecting exchange:", error);
    }
  };

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
            {selectedExchange && (
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "details"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📋 {selectedExchange.name}
              </button>
            )}
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

        {(() => {
          try {
            if (activeTab === "participants") {
              return <ParticipantManager />;
            }
            if (activeTab === "exchanges") {
              return (
                <GiftExchangeManager onExchangeSelect={handleExchangeSelect} />
              );
            }
            if (activeTab === "details" && selectedExchange) {
              return <ExchangeDetails exchange={selectedExchange} />;
            }
            return null;
          } catch (error) {
            console.error("Error rendering component:", error);
            return (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-red-800">
                  Something went wrong
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  Please refresh the page and try again. Check the console for
                  more details.
                </p>
              </div>
            );
          }
        })()}
      </main>
    </div>
  );
}

export default App;
