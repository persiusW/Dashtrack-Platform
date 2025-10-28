
export default function LinksPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Links</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Create Link
        </button>
      </div>
      <p className="text-gray-600">A list of your tracked links will be displayed here.</p>
    </div>
  );
}
