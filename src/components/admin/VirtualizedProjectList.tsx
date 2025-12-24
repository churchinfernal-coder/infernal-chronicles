import { memo } from "react";
import { FileImage } from "lucide-react";

interface Project {
  id: string;
  name: string;
  thumbnail_url?: string;
  width: number;
  height: number;
  created_at: string;
}

interface VirtualizedProjectListProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

// Memoized project card component to prevent unnecessary re-renders
const ProjectCard = memo(({ 
  project, 
  onClick 
}: { 
  project: Project; 
  onClick: () => void;
}) => (
  <div
    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors group animate-fade-in"
    onClick={onClick}
  >
    <div className="aspect-video bg-muted rounded-md mb-3 overflow-hidden">
      {project.thumbnail_url ? (
        <img
          src={project.thumbnail_url}
          alt={project.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <FileImage className="w-12 h-12 text-muted-foreground" />
        </div>
      )}
    </div>
    <div className="space-y-2">
      <h3 className="font-medium truncate group-hover:text-primary transition-colors">
        {project.name}
      </h3>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{project.width} × {project.height}</span>
        <span>
          {new Date(project.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  </div>
));

ProjectCard.displayName = "ProjectCard";

export const VirtualizedProjectList = memo(({ 
  projects, 
  onProjectClick 
}: VirtualizedProjectListProps) => {
  if (projects.length === 0) {
    return (
      <div className="col-span-2 text-center py-12 text-muted-foreground animate-fade-in">
        <p>No saved projects yet</p>
        <p className="text-sm mt-2">Create and save a project to see it here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onClick={() => onProjectClick(project)}
        />
      ))}
    </div>
  );
});

VirtualizedProjectList.displayName = "VirtualizedProjectList";
