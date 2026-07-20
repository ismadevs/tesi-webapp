import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

export default function HomePage(){
  return (
    <PageLayout>
      <div className="animate-in fade-in duration-500">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-12">
          Overview
        </h2>

        <p className="text-xl leading-relaxed text-gray-700">
          This web application is designed to support researchers in managing computational
          resources and configuring scientific experiments. In the{' '}
          <Link to="/resources" className="text-primary font-bold cursor-pointer transition-colors">
            Resources
          </Link>
          {' '}section, it is possible to catalog and administer available servers, defining
          their hardware and software characteristics, such as computational capacity, memory,
          and hosting technologies. The{' '}
          <Link to="/experiments" className="text-primary font-bold cursor-pointer transition-colors">
            Experiments
          </Link>
          {' '}section allows you to create and manage computing scenarios, associating one or
          more resources to the experiments to achieve reproducible and easily monitored
          configurations. The platform simplifies infrastructure organization and constitutes
          the foundation for automated execution of workloads in cloud-native environments.
        </p>
      </div>
    </PageLayout>
  );
}