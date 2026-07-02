import PageLayout from '../../components/PageLayout';

export default function ResourcesPage(){
  return (
    <PageLayout>
      <div className="animate-in fade-in duration-300">
        <h2 className="text-3xl font-bold tracking-tight text-gray-800 mb-12">
          Resources Section
        </h2>
        <p className="text-xl text-gray-700">
          Hello from the Resource Page in /resources!
        </p>
      </div>
    </PageLayout>
  );
}