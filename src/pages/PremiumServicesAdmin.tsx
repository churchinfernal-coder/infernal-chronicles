import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface PremiumService {
  id: string;
  name: string;
  description: string;
  price: number;
}

export default function PremiumServicesAdmin() {
  const [services, setServices] = useState<PremiumService[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<Partial<PremiumService>>({});
  const [newService, setNewService] = useState<Partial<PremiumService>>({ name: "", description: "", price: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("premium_services").select("*");
    if (error) toast.error(error.message);
    else setServices(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newService.name || !newService.price) return toast.error("Name and price required");
    const { error } = await supabase.from("premium_services").insert(newService);
    if (error) toast.error(error.message);
    else {
      toast.success("Service added");
      setNewService({ name: "", description: "", price: 0 });
      fetchServices();
    }
  };

  const handleEdit = (service: PremiumService) => {
    setEditingId(service.id);
    setEditState(service);
  };

  const handleSave = async () => {
    if (!editingId || !editState.name || !editState.price) return toast.error("Name and price required");
    const { error } = await supabase.from("premium_services").update(editState).eq("id", editingId);
    if (error) toast.error(error.message);
    else {
      toast.success("Service updated");
      setEditingId(null);
      setEditState({});
      fetchServices();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    const { error } = await supabase.from("premium_services").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Service deleted");
      fetchServices();
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-12">
      <CardHeader>
        <CardTitle>Premium Services Management</CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="font-semibold mb-4">Add New Service</h3>
        <div className="flex gap-2 mb-6">
          <Input placeholder="Name" value={newService.name as string} onChange={e => setNewService(s => ({ ...s, name: e.target.value }))} />
          <Input placeholder="Description" value={newService.description as string} onChange={e => setNewService(s => ({ ...s, description: e.target.value }))} />
          <Input type="number" placeholder="Price" value={newService.price as number} onChange={e => setNewService(s => ({ ...s, price: Number(e.target.value) }))} />
          <Button onClick={handleAdd}>Add</Button>
        </div>
        <h3 className="font-semibold mb-4">Existing Services</h3>
        {loading ? <div>Loading...</div> : (
          <div className="space-y-4">
            {services.map(service => (
              <Card key={service.id} className="p-4 flex items-center gap-4">
                {editingId === service.id ? (
                  <>
                    <Input value={editState.name as string} onChange={e => setEditState(s => ({ ...s, name: e.target.value }))} />
                    <Input value={editState.description as string} onChange={e => setEditState(s => ({ ...s, description: e.target.value }))} />
                    <Input type="number" value={editState.price as number} onChange={e => setEditState(s => ({ ...s, price: Number(e.target.value) }))} />
                    <Button onClick={handleSave}>Save</Button>
                    <Button variant="destructive" onClick={() => setEditingId(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="font-bold">{service.name}</div>
                      <div className="text-sm text-muted-foreground">{service.description}</div>
                      <div className="text-gold-600 font-semibold">${service.price}</div>
                    </div>
                    <Button onClick={() => handleEdit(service)}>Edit</Button>
                    <Button variant="destructive" onClick={() => handleDelete(service.id)}>Delete</Button>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
