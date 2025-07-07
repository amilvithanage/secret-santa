import { useState, useEffect } from "react";
import { useGiftExchanges } from "../hooks/useApi";
import type { CreateGiftExchangeRequest, GiftExchange } from "../types/api";

interface GiftExchangeManagerProps {
  onExchangeSelect: (exchange: GiftExchange) => void;
}

export function GiftExchangeManager({
  onExchangeSelect,
}: GiftExchangeManagerProps) {
  const {
    giftExchanges,
    loading,
    error,
    loadGiftExchanges,
    createGiftExchange,
  } = useGiftExchanges();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateGiftExchangeRequest>({
    name: "",
    year: new Date().getFullYear(),
    description: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadGiftExchanges();
  }, []); // Load gift exchanges only once when component mounts

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      await createGiftExchange(formData);
      setFormData({
        name: "",
        year: new Date().getFullYear(),
        description: "",
      });
      setShowForm(false);
    } catch (err) {
      console.error("Failed to create gift exchange:", err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "year" ? parseInt(value) || new Date().getFullYear() : value,
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gift Exchanges</h2>
          <p className="mt-1 text-sm text-gray-600">
            Create and manage Secret Santa gift exchanges
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {showForm ? "Cancel" : "+ Create Exchange"}
        </button>
      </div>

      {/* Create Exchange Form */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Create New Gift Exchange
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Exchange Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="e.g., Christmas 2024, Office Holiday Party"
              />
            </div>
            <div>
              <label
                htmlFor="year"
                className="block text-sm font-medium text-gray-700"
              >
                Year
              </label>
              <input
                type="number"
                name="year"
                id="year"
                required
                min="2020"
                max="2030"
                value={formData.year}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description (Optional)
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Add any special instructions or details..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {formLoading ? "Creating..." : "Create Exchange"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Gift Exchanges List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            All Gift Exchanges ({(giftExchanges || []).length})
          </h3>

          {loading ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <p className="mt-2 text-sm text-gray-600">
                Loading gift exchanges...
              </p>
            </div>
          ) : (giftExchanges || []).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No gift exchanges yet. Create your first exchange above!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(giftExchanges || []).map((exchange) => (
                <div
                  key={exchange.id}
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 cursor-pointer transition-colors"
                  onClick={() => onExchangeSelect(exchange)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-medium text-gray-900 truncate">
                        {exchange.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Year: {exchange.year}
                      </p>
                      {exchange.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {exchange.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Created{" "}
                        {new Date(exchange.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(exchange.status)}`}
                    >
                      {exchange.status}
                    </span>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExchangeSelect(exchange);
                      }}
                    >
                      Manage Exchange →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
