import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign, Edit, Loader2, Plus, Trash2 } from "lucide-react";

interface ProductPrice {
  id: string;
  product_name: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  billing_interval: string | null;
  is_active: boolean;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  paypal_product_id: string | null;
  paypal_plan_id: string | null;
}

export const ProductPricesPanel = () => {
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<ProductPrice | null>(null);
  const [formData, setFormData] = useState({
    product_name: "",
    description: "",
    amount_cents: 0,
    currency: "usd",
    billing_interval: "one_time",
    is_active: true,
    stripe_product_id: "",
    stripe_price_id: "",
    paypal_product_id: "",
    paypal_plan_id: ""
  });

  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('product_prices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrices(data || []);
    } catch (error: any) {
      console.error('Error loading prices:', error);
      toast.error('Failed to load prices');
    }
  };

  const handleEdit = (price: ProductPrice) => {
    setEditingPrice(price);
    setFormData({
      product_name: price.product_name,
      description: price.description || "",
      amount_cents: price.amount_cents,
      currency: price.currency,
      billing_interval: price.billing_interval || "one_time",
      is_active: price.is_active,
      stripe_product_id: price.stripe_product_id || "",
      stripe_price_id: price.stripe_price_id || "",
      paypal_product_id: price.paypal_product_id || "",
      paypal_plan_id: price.paypal_plan_id || ""
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = {
        ...formData,
        description: formData.description || null,
        stripe_product_id: formData.stripe_product_id || null,
        stripe_price_id: formData.stripe_price_id || null,
        paypal_product_id: formData.paypal_product_id || null,
        paypal_plan_id: formData.paypal_plan_id || null
      };

      if (editingPrice) {
        const { error } = await supabase
          .from('product_prices')
          .update(data)
          .eq('id', editingPrice.id);

        if (error) throw error;
        toast.success('Price updated successfully');
      } else {
        const { error } = await supabase
          .from('product_prices')
          .insert([data]);

        if (error) throw error;
        toast.success('Price created successfully');
      }

      setIsDialogOpen(false);
      setEditingPrice(null);
      resetForm();
      loadPrices();
    } catch (error: any) {
      console.error('Error saving price:', error);
      toast.error('Failed to save price');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this price?')) return;

    try {
      const { error } = await supabase
        .from('product_prices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Price deleted successfully');
      loadPrices();
    } catch (error: any) {
      console.error('Error deleting price:', error);
      toast.error('Failed to delete price');
    }
  };

  const resetForm = () => {
    setFormData({
      product_name: "",
      description: "",
      amount_cents: 0,
      currency: "usd",
      billing_interval: "one_time",
      is_active: true,
      stripe_product_id: "",
      stripe_price_id: "",
      paypal_product_id: "",
      paypal_plan_id: ""
    });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <DollarSign className="w-5 h-5 text-primary" />
              Product Prices
            </CardTitle>
            <CardDescription>
              Manage pricing for products and services
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingPrice(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Price
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPrice ? 'Edit' : 'Create'} Product Price</DialogTitle>
                <DialogDescription>
                  Configure pricing details for your product or service
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product_name">Product Name</Label>
                  <Input
                    id="product_name"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    placeholder="Premium Plan"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Full access to all features"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount_cents">Amount (cents)</Label>
                    <Input
                      id="amount_cents"
                      type="number"
                      value={formData.amount_cents}
                      onChange={(e) => setFormData({ ...formData, amount_cents: parseInt(e.target.value) })}
                      placeholder="2999"
                    />
                    <p className="text-xs text-muted-foreground">
                      ${(formData.amount_cents / 100).toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      placeholder="usd"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billing_interval">Billing Interval</Label>
                  <Select
                    value={formData.billing_interval}
                    onValueChange={(value) => setFormData({ ...formData, billing_interval: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One Time</SelectItem>
                      <SelectItem value="day">Daily</SelectItem>
                      <SelectItem value="week">Weekly</SelectItem>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="year">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stripe_product_id">Stripe Product ID</Label>
                    <Input
                      id="stripe_product_id"
                      value={formData.stripe_product_id}
                      onChange={(e) => setFormData({ ...formData, stripe_product_id: e.target.value })}
                      placeholder="prod_..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stripe_price_id">Stripe Price ID</Label>
                    <Input
                      id="stripe_price_id"
                      value={formData.stripe_price_id}
                      onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
                      placeholder="price_..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paypal_product_id">PayPal Product ID</Label>
                    <Input
                      id="paypal_product_id"
                      value={formData.paypal_product_id}
                      onChange={(e) => setFormData({ ...formData, paypal_product_id: e.target.value })}
                      placeholder="PROD-..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paypal_plan_id">PayPal Plan ID</Label>
                    <Input
                      id="paypal_plan_id"
                      value={formData.paypal_plan_id}
                      onChange={(e) => setFormData({ ...formData, paypal_plan_id: e.target.value })}
                      placeholder="P-..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_active">Active</Label>
                    <p className="text-xs text-muted-foreground">
                      Make this price available for purchase
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Price'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gateway IDs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No prices configured yet
                  </TableCell>
                </TableRow>
              ) : (
                prices.map((price) => (
                  <TableRow key={price.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{price.product_name}</div>
                        {price.description && (
                          <div className="text-xs text-muted-foreground">{price.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      ${(price.amount_cents / 100).toFixed(2)} {price.currency.toUpperCase()}
                    </TableCell>
                    <TableCell className="capitalize">
                      {price.billing_interval?.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        price.is_active
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {price.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {price.stripe_price_id && (
                          <div className="text-muted-foreground">Stripe: {price.stripe_price_id}</div>
                        )}
                        {price.paypal_plan_id && (
                          <div className="text-muted-foreground">PayPal: {price.paypal_plan_id}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(price)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(price.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
