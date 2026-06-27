import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureInstructionGenerator } from "@/components/admin/FeatureInstructionGenerator";
import { FeatureInstructionViewer } from "@/components/admin/FeatureInstructionViewer";

const FeatureInstructions = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Feature Instructions</h1>
        <p className="text-muted-foreground mt-2">
          Generate and manage comprehensive instruction tabs for SuperAdmin features
        </p>
      </div>

      <Tabs defaultValue="viewer" className="w-full">
        <TabsList>
          <TabsTrigger value="viewer">View Instructions</TabsTrigger>
          <TabsTrigger value="generator">Generate New</TabsTrigger>
        </TabsList>

        <TabsContent value="viewer" className="mt-6">
          <FeatureInstructionViewer />
        </TabsContent>

        <TabsContent value="generator" className="mt-6">
          <div className="max-w-2xl mx-auto">
            <FeatureInstructionGenerator />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeatureInstructions;
