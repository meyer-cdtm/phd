import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Explore OneTutor Dataset
          </h1>

          <div className="flex flex-col gap-4 mt-6">
            <Link
              href="/questions"
              className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Question Viewer
            </Link>

            <Link
              href="/labeling"
              className="inline-block px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Start Labelling
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
