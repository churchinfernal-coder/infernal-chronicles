import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function PremiumServicesAdmin() {
  const [services, setServices] = useState<any[]>([]);
  const [newService, setNewService] = useState({ name: "", price: 0 });

  const addService = () => {
    if (!newService.name) return toast.error("Name required");
    setServices([...services, { ...newService }]);
    setNewService({ name: "", price: 0 });
    toast.success("Service added");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Premium Services Admin</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Service Name"
          value={newService.name}
          onChange={e => setNewService(s => ({ ...s, name: e.target.value }))}
        />
        <Input
          type="number"
          placeholder="Price"
          value={newService.price}
          onChange={e => setNewService(s => ({ ...s, price: Number(e.target.value) }))}
        />
        <Button onClick={addService}>Add Service</Button>
        <ul>
          {services.map((s, i) => (
            <li key={i}>{s.name} - ${s.price}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
