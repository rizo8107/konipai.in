import { BuilderPage as BuilderPageComponent } from '@/components/BuilderPage';
import { useParams } from 'react-router-dom';

export default function BuilderPage() {
  const { path } = useParams<{ path: string }>();
  
  return (
    <div className="container mx-auto py-8">
      <BuilderPageComponent 
        fallback={
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Page Not Found in Builder.io</h1>
            <p className="text-muted-foreground">
              This page hasn't been created in Builder.io yet. Log in to your Builder.io 
              account to create content for this page.
            </p>
          </div>
        }
      />
    </div>
  );
}
