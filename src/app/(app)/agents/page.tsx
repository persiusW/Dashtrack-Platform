
export default function AgentsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agents</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          New Agent
        </button>
      </div>
      <p className="text-gray-600">A list of your agents will be displayed here.</p>
    </div>
  );
}
