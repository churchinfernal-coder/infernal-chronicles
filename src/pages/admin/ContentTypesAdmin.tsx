import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Save } from "lucide-react";

interface ContentType {
  id: string;
  name: string;
  icon?: string;
}

export default function ContentTypesAdmin() {
  const [postTypes, setPostTypes] = useState<ContentType[]>([
    { id: "whisper", name: "Whisper" },
    { id: "scream", name: "Scream" },
    { id: "incantation", name: "Incantation" }
  ]);
  
  const [visibilityTypes, setVisibilityTypes] = useState<ContentType[]>([
    { id: "public", name: "Public" },
    { id: "private", name: "Private" }
  ]);

  const [rarityLevels, setRarityLevels] = useState<ContentType[]>([
    { id: "common", name: "Common" },
    { id: "uncommon", name: "Uncommon" },
    { id: "rare", name: "Rare" },
    { id: "epic", name: "Epic" },
    { id: "legendary", name: "Legendary" }
  ]);

  const [itemTypes, setItemTypes] = useState<ContentType[]>([
    { id: "background", name: "Background" },
    { id: "sigil", name: "Sigil" },
    { id: "badge", name: "Badge" },
    { id: "avatar_frame", name: "Avatar Frame" }
  ]);

  useEffect(() => {
    const saved = localStorage.getItem("content_types");
    if (saved) {
      const data = JSON.parse(saved);
      setPostTypes(data.postTypes || postTypes);
      setVisibilityTypes(data.visibilityTypes || visibilityTypes);
      setRarityLevels(data.rarityLevels || rarityLevels);
      setItemTypes(data.itemTypes || itemTypes);
    }
  }, []);

  const saveAll = () => {
    localStorage.setItem("content_types", JSON.stringify({
      postTypes,
      visibilityTypes,
      rarityLevels,
      itemTypes
    }));
    toast({ title: "Content types saved" });
  };

  const addPostType = () => {
    setPostTypes([...postTypes, { id: "", name: "" }]);
  };

  const updatePostType = (index: number, field: "id" | "name", value: string) => {
    const updated = [...postTypes];
    updated[index][field] = value;
    setPostTypes(updated);
  };

  const removePostType = (index: number) => {
    setPostTypes(postTypes.filter((_, i) => i !== index));
  };

  const addVisibilityType = () => {
    setVisibilityTypes([...visibilityTypes, { id: "", name: "" }]);
  };

  const updateVisibilityType = (index: number, field: "id" | "name", value: string) => {
    const updated = [...visibilityTypes];
    updated[index][field] = value;
    setVisibilityTypes(updated);
  };

  const removeVisibilityType = (index: number) => {
    setVisibilityTypes(visibilityTypes.filter((_, i) => i !== index));
  };

  const addRarityLevel = () => {
    setRarityLevels([...rarityLevels, { id: "", name: "" }]);
  };

  const updateRarityLevel = (index: number, field: "id" | "name", value: string) => {
    const updated = [...rarityLevels];
    updated[index][field] = value;
    setRarityLevels(updated);
  };

  const removeRarityLevel = (index: number) => {
    setRarityLevels(rarityLevels.filter((_, i) => i !== index));
  };

  const addItemType = () => {
    setItemTypes([...itemTypes, { id: "", name: "" }]);
  };

  const updateItemType = (index: number, field: "id" | "name", value: string) => {
    const updated = [...itemTypes];
    updated[index][field] = value;
    setItemTypes(updated);
  };

  const removeItemType = (index: number) => {
    setItemTypes(itemTypes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Post Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {postTypes.map((type, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="ID (lowercase)"
                value={type.id}
                onChange={(e) => updatePostType(index, "id", e.target.value)}
              />
              <Input
                placeholder="Display Name"
                value={type.name}
                onChange={(e) => updatePostType(index, "name", e.target.value)}
              />
              <Button variant="destructive" size="icon" onClick={() => removePostType(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button onClick={addPostType} variant="outline">
            <Plus className="w-4 h-4 mr-2" />Add Post Type
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visibility Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {visibilityTypes.map((type, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="ID (lowercase)"
                value={type.id}
                onChange={(e) => updateVisibilityType(index, "id", e.target.value)}
              />
              <Input
                placeholder="Display Name"
                value={type.name}
                onChange={(e) => updateVisibilityType(index, "name", e.target.value)}
              />
              <Button variant="destructive" size="icon" onClick={() => removeVisibilityType(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button onClick={addVisibilityType} variant="outline">
            <Plus className="w-4 h-4 mr-2" />Add Visibility Type
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rarity Levels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rarityLevels.map((type, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="ID (lowercase)"
                value={type.id}
                onChange={(e) => updateRarityLevel(index, "id", e.target.value)}
              />
              <Input
                placeholder="Display Name"
                value={type.name}
                onChange={(e) => updateRarityLevel(index, "name", e.target.value)}
              />
              <Button variant="destructive" size="icon" onClick={() => removeRarityLevel(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button onClick={addRarityLevel} variant="outline">
            <Plus className="w-4 h-4 mr-2" />Add Rarity Level
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Item Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {itemTypes.map((type, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="ID (lowercase)"
                value={type.id}
                onChange={(e) => updateItemType(index, "id", e.target.value)}
              />
              <Input
                placeholder="Display Name"
                value={type.name}
                onChange={(e) => updateItemType(index, "name", e.target.value)}
              />
              <Button variant="destructive" size="icon" onClick={() => removeItemType(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button onClick={addItemType} variant="outline">
            <Plus className="w-4 h-4 mr-2" />Add Item Type
          </Button>
        </CardContent>
      </Card>

      <Button onClick={saveAll} className="w-full">
        <Save className="w-4 h-4 mr-2" />
        Save All Content Types
      </Button>
    </div>
  );
}
