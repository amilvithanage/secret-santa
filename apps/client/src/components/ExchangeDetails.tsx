import { useState, useEffect } from "react";
import type { GiftExchange } from "../types/api";
import {
  useExchangeParticipants,
  useExclusionRules,
  useAssignments,
  useParticipants,
} from "../hooks/useApi";

interface ExchangeDetailsProps {
  exchange: GiftExchange;
}

export function ExchangeDetails({ exchange }: ExchangeDetailsProps) {
  const [activeSection, setActiveSection] = useState<
    "participants" | "exclusions" | "assignments"
  >("participants");

  const {
    exchangeParticipants,
    loading: participantsLoading,
    addParticipantToExchange,
  } = useExchangeParticipants(exchange.id);
  const { participants: allParticipants, loadParticipants } = useParticipants();
  const { exclusionRules, createExclusionRule, validateExclusionRules } =
    useExclusionRules(exchange.id);
  const {
    assignments,
    createAssignments,
    loading: assignmentsLoading,
    error: assignmentsError,
  } = useAssignments(exchange.id);

  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [showAddExclusion, setShowAddExclusion] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [exclusionForm, setExclusionForm] = useState({
    excluderId: "",
    excludedId: "",
    reason: "",
  });
  const [validationResult, setValidationResult] = useState<any>(null);
  const [exclusionError, setExclusionError] = useState<string | null>(null);
  const [isCreatingExclusion, setIsCreatingExclusion] = useState(false);

  useEffect(() => {
    loadParticipants();
  }, []); // Load participants only once when component mounts

  const availableParticipants = (allParticipants || []).filter(
    (p) => !(exchangeParticipants || []).some((ep) => ep.id === p.id),
  );

  // Check if the current exclusion form would create a duplicate
  const isDuplicateExclusion = (exclusionRules || []).some(
    (rule) =>
      rule.excluder.id === exclusionForm.excluderId &&
      rule.excluded.id === exclusionForm.excludedId,
  );

  const handleAddParticipant = async () => {
    if (selectedParticipant) {
      await addParticipantToExchange(selectedParticipant);
      setSelectedParticipant("");
      setShowAddParticipant(false);
    }
  };

  const handleCreateExclusion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingExclusion(true);
    setExclusionError(null);

    try {
      const result = await createExclusionRule(exclusionForm);
      if (result) {
        setExclusionForm({ excluderId: "", excludedId: "", reason: "" });
        setShowAddExclusion(false);
      }
    } catch (error: any) {
      setExclusionError(error.message || "Failed to create exclusion rule");
    } finally {
      setIsCreatingExclusion(false);
    }
  };

  const handleValidateExclusions = async () => {
    const result = await validateExclusionRules();
    setValidationResult(result);
  };

  const handleCreateAssignments = async () => {
    await createAssignments();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {exchange.name}
            </h2>
            <p className="text-sm text-gray-600">Year: {exchange.year}</p>
            {exchange.description && (
              <p className="text-sm text-gray-700 mt-1">
                {exchange.description}
              </p>
            )}
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              exchange.status === "DRAFT"
                ? "bg-yellow-100 text-yellow-800"
                : exchange.status === "ACTIVE"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {exchange.status}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              type="button"
              onClick={() => setActiveSection("participants")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === "participants"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              👥 Participants ({(exchangeParticipants || []).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("exclusions")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === "exclusions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🚫 Exclusion Rules ({(exclusionRules || []).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("assignments")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === "assignments"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🎁 Assignments ({(assignments || []).length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Participants Section */}
          {activeSection === "participants" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Exchange Participants
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddParticipant(!showAddParticipant)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  + Add Participant
                </button>
              </div>

              {showAddParticipant && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedParticipant}
                      onChange={(e) => setSelectedParticipant(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select a participant...</option>
                      {availableParticipants.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.email})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddParticipant}
                      disabled={!selectedParticipant}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddParticipant(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {participantsLoading ? (
                <div className="text-center py-4">Loading participants...</div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(exchangeParticipants || []).map((participant) => (
                    <div
                      key={participant.id}
                      className="bg-gray-50 p-3 rounded-md"
                    >
                      <p className="font-medium text-gray-900">
                        {participant.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {participant.email}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Exclusions Section */}
          {activeSection === "exclusions" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Exclusion Rules
                </h3>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={handleValidateExclusions}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Validate Rules
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddExclusion(!showAddExclusion)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    + Add Exclusion
                  </button>
                </div>
              </div>

              {validationResult && (
                <div
                  className={`p-4 rounded-md ${validationResult.valid ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                >
                  <h4
                    className={`font-medium ${validationResult.valid ? "text-green-800" : "text-red-800"}`}
                  >
                    {validationResult.valid
                      ? "✅ Validation Passed"
                      : "❌ Validation Issues"}
                  </h4>
                  {validationResult.issues &&
                    validationResult.issues.length > 0 && (
                      <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                        {validationResult.issues.map(
                          (issue: string, index: number) => (
                            <li key={index}>{issue}</li>
                          ),
                        )}
                      </ul>
                    )}
                </div>
              )}

              {showAddExclusion && (
                <form
                  onSubmit={handleCreateExclusion}
                  className="bg-gray-50 p-4 rounded-md space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Excluder
                      </label>
                      <select
                        value={exclusionForm.excluderId}
                        onChange={(e) =>
                          setExclusionForm((prev) => ({
                            ...prev,
                            excluderId: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        required
                      >
                        <option value="">Select person...</option>
                        {(exchangeParticipants || []).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Cannot give to
                      </label>
                      <select
                        value={exclusionForm.excludedId}
                        onChange={(e) =>
                          setExclusionForm((prev) => ({
                            ...prev,
                            excludedId: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        required
                      >
                        <option value="">Select person...</option>
                        {(exchangeParticipants || [])
                          .filter((p) => p.id !== exclusionForm.excluderId)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Reason (Optional)
                    </label>
                    <input
                      type="text"
                      value={exclusionForm.reason}
                      onChange={(e) =>
                        setExclusionForm((prev) => ({
                          ...prev,
                          reason: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      placeholder="e.g., They are siblings, roommates, etc."
                    />
                  </div>

                  {/* Error Display */}
                  {exclusionError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-700">{exclusionError}</p>
                    </div>
                  )}

                  {/* Duplicate Warning */}
                  {isDuplicateExclusion && exclusionForm.excluderId && exclusionForm.excludedId && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <p className="text-sm text-yellow-700">
                        ⚠️ This exclusion rule already exists
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddExclusion(false);
                        setExclusionError(null);
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingExclusion || isDuplicateExclusion || !exclusionForm.excluderId || !exclusionForm.excludedId}
                      className={`px-4 py-2 rounded-md ${
                        isCreatingExclusion || isDuplicateExclusion || !exclusionForm.excluderId || !exclusionForm.excludedId
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {isCreatingExclusion ? 'Adding...' : 'Add Exclusion'}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {(exclusionRules || []).map((rule) => (
                  <div key={rule.id} className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm">
                      <span className="font-medium">{rule.excluder.name}</span>{" "}
                      cannot give to{" "}
                      <span className="font-medium">{rule.excluded.name}</span>
                      {rule.reason && (
                        <span className="text-gray-600"> ({rule.reason})</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignments Section */}
          {activeSection === "assignments" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Secret Santa Assignments
                </h3>
                <button
                  type="button"
                  onClick={handleCreateAssignments}
                  disabled={
                    assignmentsLoading ||
                    (exchangeParticipants || []).length < 2
                  }
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {assignmentsLoading
                    ? "Generating..."
                    : "🎲 Generate Assignments"}
                </button>
              </div>

              {(exchangeParticipants || []).length < 2 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-yellow-800">
                    You need at least 2 participants to generate assignments.
                  </p>
                </div>
              )}

              {assignmentsError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800">Error: {assignmentsError}</p>
                </div>
              )}

              {(assignments || []).length > 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h4 className="font-medium text-green-800 mb-3">
                    🎉 Assignments Generated!
                  </h4>
                  <div className="space-y-2">
                    {(assignments || []).map((assignment) => (
                      <div
                        key={assignment.id}
                        className="bg-white p-3 rounded border"
                      >
                        <p className="text-sm">
                          <span className="font-medium">
                            {assignment.giver.name}
                          </span>{" "}
                          gives to{" "}
                          <span className="font-medium text-green-600">
                            {assignment.receiver.name}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No assignments generated yet. Click the button above to create
                  them!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
