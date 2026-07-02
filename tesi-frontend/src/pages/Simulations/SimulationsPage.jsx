// src/pages/Simulations/SimulationsPage.jsx
import PageLayout from '../../components/PageLayout';

export default function SimulationsPage(){
  return (
    <PageLayout>
      <div className="animate-in fade-in duration-300">
        <h2 className="text-3xl font-bold tracking-tight text-gray-800 mb-12">
          Simulations Section
        </h2>
        <p className="text-xl text-gray-700">
          Hello from the Simulations Page in /simulations!
        </p>
      </div>
    </PageLayout>
  );
}